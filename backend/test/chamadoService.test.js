const assert = require("node:assert/strict");
const { test, before, beforeEach, after } = require("node:test");
const db = require("../src/db");
const service = require("../src/services/chamadoService");
const { prepararBanco, dadosDoSeed } = require("./helpers/banco");

let banco;
let seed;

before(async () => {
  banco = await prepararBanco();
});
beforeEach(async () => {
  await banco.limpar();
  seed = await dadosDoSeed();
});
after(() => banco.encerrar());

test("limita a dois chamados de urgencia Alta abertos por tecnico", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const tecnicoId = seed.tecnicos[0].id;
  const chamados = [];
  for (let i = 0; i < 3; i++) {
    chamados.push(await service.abrirChamado({ equipamentoId, urgencia: "Alta" }));
  }

  await service.atribuirChamado({ chamadoId: chamados[0].id, tecnicoId });
  await service.atribuirChamado({ chamadoId: chamados[1].id, tecnicoId });

  await assert.rejects(
    service.atribuirChamado({ chamadoId: chamados[2].id, tecnicoId }),
    (error) =>
      error instanceof service.RegraDeNegocioError &&
      error.statusCode === 422 &&
      error.message.includes("limite: 2")
  );

  await service.concluirChamado({ chamadoId: chamados[0].id });
  const reatribuido = await service.atribuirChamado({
    chamadoId: chamados[2].id,
    tecnicoId,
  });

  assert.equal(reatribuido.tecnicoId, tecnicoId);
  assert.equal(await service.contarChamadosAltaAbertos(tecnicoId), 2);
});

test("RN critica resiste a atribuicoes simultaneas ao mesmo tecnico", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const tecnicoId = seed.tecnicos[0].id;
  const chamados = [];
  for (let i = 0; i < 5; i++) {
    chamados.push(await service.abrirChamado({ equipamentoId, urgencia: "Alta" }));
  }

  // Abre as conexões antes, para as transações correrem de fato em paralelo
  // em vez de cada uma terminar enquanto a próxima ainda conecta.
  await Promise.all(chamados.map(() => db.query("SELECT pg_sleep(0.05)")));

  const resultados = await Promise.allSettled(
    chamados.map((c) => service.atribuirChamado({ chamadoId: c.id, tecnicoId }))
  );

  const aceitas = resultados.filter((r) => r.status === "fulfilled");
  const recusadas = resultados.filter((r) => r.status === "rejected");
  assert.equal(aceitas.length, 2);
  assert.ok(recusadas.every((r) => r.reason.statusCode === 422));
  assert.equal(await service.contarChamadosAltaAbertos(tecnicoId), 2);
});

test("concluir grava laudo, causa raiz e pecas trocadas", async () => {
  const chamado = await service.abrirChamado({
    equipamentoId: seed.equipamentos[1].id,
    urgencia: "Media",
  });

  const concluido = await service.concluirChamado({
    chamadoId: chamado.id,
    laudo: "Rolamento substituido.",
    causaRaiz: "Desgaste Natural / Fim de vida útil",
    pecasTrocadas: "Rolamento 6205",
  });

  assert.equal(concluido.status, "Concluído");
  assert.equal(concluido.laudo, "Rolamento substituido.");
  assert.equal(concluido.causaRaiz, "Desgaste Natural / Fim de vida útil");
  assert.equal(concluido.pecasTrocadas, "Rolamento 6205");
  assert.ok(concluido.finalizadoEm);
});

test("conclusao grava as trocas vinculadas ao chamado e ao equipamento", async () => {
  const equipamentoId = seed.equipamentos[1].id;
  const chamado = await service.abrirChamado({ equipamentoId, urgencia: "Media" });

  await service.concluirChamado({
    chamadoId: chamado.id,
    trocas: [{ pecaNome: "Rolamento 6205", quantidade: 2 }, { pecaNome: "Correia" }],
  });

  const { rows } = await db.query(
    `SELECT chamado_id, equipamento_id, peca_nome, quantidade
     FROM trocas_peca ORDER BY peca_nome`
  );
  assert.deepEqual(
    rows.map((r) => [r.peca_nome, r.quantidade, r.chamado_id, r.equipamento_id]),
    [
      ["Correia", 1, chamado.id, equipamentoId],
      ["Rolamento 6205", 2, chamado.id, equipamentoId],
    ]
  );
});

test("falha ao gravar uma troca desfaz a conclusao inteira", async () => {
  const chamado = await service.abrirChamado({
    equipamentoId: seed.equipamentos[1].id,
    urgencia: "Media",
  });

  // Simula o banco recusando a 2ª troca depois que a conclusão e a 1ª troca
  // já foram escritas na transação.
  await db.query("ALTER TABLE trocas_peca ADD CONSTRAINT teste_falha CHECK (peca_nome <> 'FALHA')");
  try {
    await assert.rejects(
      service.concluirChamado({
        chamadoId: chamado.id,
        laudo: "Nao deve ficar gravado.",
        trocas: [{ pecaNome: "Correia" }, { pecaNome: "FALHA" }],
      }),
      (error) => error.code === "23514"
    );
  } finally {
    await db.query("ALTER TABLE trocas_peca DROP CONSTRAINT teste_falha");
  }

  const [atual] = (await service.listarChamados()).filter((c) => c.id === chamado.id);
  assert.equal(atual.status, "Aberto");
  assert.equal(atual.finalizadoEm, null);
  const { rows } = await db.query("SELECT count(*)::int AS total FROM trocas_peca");
  assert.equal(rows[0].total, 0);
});

test("rejeita troca invalida antes de gravar", async () => {
  const chamado = await service.abrirChamado({
    equipamentoId: seed.equipamentos[1].id,
    urgencia: "Media",
  });

  const invalidas = [
    [{ pecaNome: "" }],
    [{ pecaNome: "x".repeat(101) }],
    [{ pecaNome: "Correia", quantidade: 0 }],
    [{ pecaNome: "Correia", quantidade: 1.5 }],
    [{ pecaNome: "Correia", quantidade: 2 ** 31 }],
    [{ pecaNome: "Correia", observacao: "x".repeat(501) }],
  ];
  for (const trocas of invalidas) {
    await assert.rejects(
      service.concluirChamado({ chamadoId: chamado.id, trocas }),
      (error) => error instanceof service.RegraDeNegocioError && error.statusCode === 422
    );
  }
});

test("nao permite concluir chamado ja concluido", async () => {
  const chamado = await service.abrirChamado({
    equipamentoId: seed.equipamentos[1].id,
    urgencia: "Baixa",
  });
  const primeiro = await service.concluirChamado({ chamadoId: chamado.id });

  await assert.rejects(
    service.concluirChamado({ chamadoId: chamado.id }),
    (error) => error instanceof service.RegraDeNegocioError && error.statusCode === 422
  );
  const [atual] = (await service.listarChamados()).filter((c) => c.id === chamado.id);
  assert.deepEqual(atual.finalizadoEm, primeiro.finalizadoEm);
});

test("chamado traz setor do equipamento e carga do tecnico", async () => {
  const tecnicoId = seed.tecnicos[1].id;
  const chamado = await service.abrirChamado({
    equipamentoId: seed.equipamentos[0].id,
    urgencia: "Alta",
  });
  const atribuido = await service.atribuirChamado({ chamadoId: chamado.id, tecnicoId });

  assert.equal(atribuido.equipamento.setor.id, seed.equipamentos[0].setorId);
  assert.equal(atribuido.tecnico.chamadosAltaAbertos, 1);
});

test("fila prioriza urgencia e depois o chamado mais antigo", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const baixa = await service.abrirChamado({ equipamentoId, urgencia: "Baixa" });
  const alta1 = await service.abrirChamado({ equipamentoId, urgencia: "Alta" });
  const media = await service.abrirChamado({ equipamentoId, urgencia: "Media" });
  const alta2 = await service.abrirChamado({ equipamentoId, urgencia: "Alta" });

  const fila = (await service.listarChamados()).map((c) => c.id);
  assert.deepEqual(fila, [alta1.id, alta2.id, media.id, baixa.id]);
});

test("rejeita tipo de chamado invalido", async () => {
  await assert.rejects(
    service.abrirChamado({
      equipamentoId: seed.equipamentos[0].id,
      urgencia: "Baixa",
      tipo: "Preditiva",
    }),
    (error) => error.statusCode === 422 && error.message.includes("tipo")
  );
  const preventiva = await service.abrirChamado({
    equipamentoId: seed.equipamentos[0].id,
    urgencia: "Baixa",
    tipo: "Preventiva",
  });
  assert.equal(preventiva.tipo, "Preventiva");
});

test("registros inexistentes retornam 404", async () => {
  const naoEncontrado = (error) =>
    error instanceof service.NaoEncontradoError && error.statusCode === 404;
  const idInexistente = "00000000-0000-4000-8000-000000000000";

  for (const chamadoId of ["x", idInexistente]) {
    await assert.rejects(service.concluirChamado({ chamadoId }), naoEncontrado);
    await assert.rejects(
      service.atribuirChamado({ chamadoId, tecnicoId: seed.tecnicos[0].id }),
      naoEncontrado
    );
  }
  await assert.rejects(
    service.abrirChamado({ equipamentoId: idInexistente, urgencia: "Alta" }),
    naoEncontrado
  );
  await assert.rejects(
    service.criarEquipamento({ nome: "Prensa", setorId: idInexistente }),
    naoEncontrado
  );
});

test("chamado devolve as trocas na ordem informada, ou lista vazia", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const semTroca = await service.abrirChamado({ equipamentoId, urgencia: "Baixa" });
  const comTroca = await service.abrirChamado({ equipamentoId, urgencia: "Baixa" });

  assert.deepEqual(semTroca.trocas, []);
  const concluido = await service.concluirChamado({
    chamadoId: comTroca.id,
    trocas: [
      { pecaNome: "Rolamento 6205", quantidade: 2 },
      { pecaNome: "Correia", observacao: "Tensionada" },
      { pecaNome: "Anel O-ring" },
    ],
  });

  assert.deepEqual(
    concluido.trocas.map((t) => [t.pecaNome, t.quantidade, t.observacao]),
    [
      ["Rolamento 6205", 2, null],
      ["Correia", 1, "Tensionada"],
      ["Anel O-ring", 1, null],
    ]
  );
  assert.match(concluido.trocas[0].registradoEm, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  const [listado] = (await service.listarChamados()).filter((c) => c.id === comTroca.id);
  assert.equal(listado.trocas.length, 3);
});

test("historico de pecas vem da troca mais recente para a mais antiga", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const tecnicoId = seed.tecnicos[0].id;

  const antigo = await service.abrirChamado({ equipamentoId, urgencia: "Media" });
  await service.atribuirChamado({ chamadoId: antigo.id, tecnicoId });
  await service.concluirChamado({
    chamadoId: antigo.id,
    causaRaiz: "Falha Mecânica",
    trocas: [{ pecaNome: "Correia" }, { pecaNome: "Polia" }],
  });

  const recente = await service.abrirChamado({ equipamentoId, urgencia: "Alta", tipo: "Preventiva" });
  await service.concluirChamado({ chamadoId: recente.id, trocas: [{ pecaNome: "Filtro", quantidade: 3 }] });

  // Troca de outro equipamento não entra no histórico.
  const outro = await service.abrirChamado({ equipamentoId: seed.equipamentos[1].id, urgencia: "Baixa" });
  await service.concluirChamado({ chamadoId: outro.id, trocas: [{ pecaNome: "Sensor" }] });

  const historico = await service.listarHistoricoPecas(equipamentoId);

  assert.deepEqual(historico.map((t) => t.pecaNome), ["Filtro", "Correia", "Polia"]);
  assert.deepEqual(historico[0].chamado.id, recente.id);
  assert.equal(historico[0].chamado.tipo, "Preventiva");
  assert.equal(historico[0].chamado.urgencia, "Alta");
  assert.equal(historico[0].chamado.causaRaiz, null);
  assert.equal(historico[0].tecnico, null);
  assert.equal(historico[1].chamado.causaRaiz, "Falha Mecânica");
  assert.equal(historico[1].tecnico.id, tecnicoId);
  assert.ok(historico[1].tecnico.nome);
  assert.ok(historico[1].chamado.finalizadoEm <= historico[0].chamado.finalizadoEm);
});

test("historico vazio e equipamento inexistente", async () => {
  assert.deepEqual(await service.listarHistoricoPecas(seed.equipamentos[1].id), []);

  for (const id of ["x", "00000000-0000-4000-8000-000000000000"]) {
    await assert.rejects(
      service.listarHistoricoPecas(id),
      (error) => error instanceof service.NaoEncontradoError && error.statusCode === 404
    );
  }
});
