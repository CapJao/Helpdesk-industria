const assert = require("node:assert/strict");
const test = require("node:test");
const db = require("../src/db/memoryDb");
const service = require("../src/services/chamadoService");

test("limita a dois chamados de urgencia Alta abertos por tecnico", () => {
  const equipamentoId = db.equipamentos[0].id;
  const tecnicoId = db.tecnicos[0].id;
  const chamados = Array.from({ length: 3 }, () =>
    service.abrirChamado({ equipamentoId, urgencia: "Alta" })
  );

  service.atribuirChamado({ chamadoId: chamados[0].id, tecnicoId });
  service.atribuirChamado({ chamadoId: chamados[1].id, tecnicoId });

  assert.throws(
    () => service.atribuirChamado({ chamadoId: chamados[2].id, tecnicoId }),
    (error) =>
      error instanceof service.RegraDeNegocioError &&
      error.statusCode === 422 &&
      error.message.includes("limite: 2")
  );

  service.concluirChamado({ chamadoId: chamados[0].id });
  const reatribuido = service.atribuirChamado({
    chamadoId: chamados[2].id,
    tecnicoId,
  });

  assert.equal(reatribuido.tecnicoId, tecnicoId);
  assert.equal(service.contarChamadosAltaAbertos(tecnicoId), 2);
});
test("concluir grava laudo, causa raiz e pecas trocadas", () => {
  const chamado = service.abrirChamado({
    equipamentoId: db.equipamentos[1].id,
    urgencia: "Media",
  });

  const concluido = service.concluirChamado({
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

test("nao permite concluir chamado ja concluido", () => {
  const chamado = service.abrirChamado({
    equipamentoId: db.equipamentos[1].id,
    urgencia: "Baixa",
  });
  const primeiro = service.concluirChamado({ chamadoId: chamado.id });

  assert.throws(
    () => service.concluirChamado({ chamadoId: chamado.id }),
    (error) => error instanceof service.RegraDeNegocioError && error.statusCode === 422
  );
  const [atual] = service.listarChamados().filter((c) => c.id === chamado.id);
  assert.equal(atual.finalizadoEm, primeiro.finalizadoEm);
});

test("chamado traz setor do equipamento e carga do tecnico", () => {
  const tecnicoId = db.tecnicos[1].id;
  const chamado = service.abrirChamado({
    equipamentoId: db.equipamentos[0].id,
    urgencia: "Alta",
  });
  const atribuido = service.atribuirChamado({ chamadoId: chamado.id, tecnicoId });

  assert.equal(atribuido.equipamento.setor.id, db.equipamentos[0].setorId);
  assert.equal(atribuido.tecnico.chamadosAltaAbertos, 1);
});

test("rejeita tipo de chamado invalido", () => {
  assert.throws(
    () =>
      service.abrirChamado({
        equipamentoId: db.equipamentos[0].id,
        urgencia: "Baixa",
        tipo: "Preditiva",
      }),
    (error) => error.statusCode === 422 && error.message.includes("tipo")
  );
  const preventiva = service.abrirChamado({
    equipamentoId: db.equipamentos[0].id,
    urgencia: "Baixa",
    tipo: "Preventiva",
  });
  assert.equal(preventiva.tipo, "Preventiva");
});

test("registros inexistentes retornam 404", () => {
  const naoEncontrado = (error) =>
    error instanceof service.NaoEncontradoError && error.statusCode === 404;

  assert.throws(() => service.concluirChamado({ chamadoId: "x" }), naoEncontrado);
  assert.throws(
    () => service.atribuirChamado({ chamadoId: "x", tecnicoId: db.tecnicos[0].id }),
    naoEncontrado
  );
  assert.throws(
    () => service.abrirChamado({ equipamentoId: "x", urgencia: "Alta" }),
    naoEncontrado
  );
  assert.throws(
    () => service.criarEquipamento({ nome: "Prensa", setorId: "x" }),
    naoEncontrado
  );
});
