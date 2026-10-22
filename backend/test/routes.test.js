const assert = require("node:assert/strict");
const { test, before, beforeEach, after } = require("node:test");
const app = require("../src/app");
const { prepararBanco, dadosDoSeed } = require("./helpers/banco");

let banco;
let seed;
let server;
let base;

before(async () => {
  banco = await prepararBanco();
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(async () => {
  await banco.limpar();
  seed = await dadosDoSeed();
});
after(async () => {
  server.close();
  await banco.encerrar();
});

function enviar(url, method, body) {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("PATCH /chamados/:id/concluir repassa o laudo do frontend", async () => {
  const criado = await enviar(`${base}/chamados`, "POST", {
    equipamentoId: seed.equipamentos[0].id,
    urgencia: "Media",
  }).then((r) => r.json());

  const res = await enviar(`${base}/chamados/${criado.id}/concluir`, "PATCH", {
    laudo: "Sensor recalibrado.",
    causaRaiz: "Falha Operacional",
    pecasTrocadas: "Sensor indutivo",
  });
  const concluido = await res.json();

  assert.equal(res.status, 200);
  assert.equal(concluido.laudo, "Sensor recalibrado.");
  assert.equal(concluido.causaRaiz, "Falha Operacional");
  assert.equal(concluido.pecasTrocadas, "Sensor indutivo");
});

test("rota responde 404 com { erro } para chamado inexistente", async () => {
  const res = await enviar(`${base}/chamados/nao-existe/concluir`, "PATCH", {});
  const body = await res.json();

  assert.equal(res.status, 404);
  assert.equal(body.erro, "Chamado não encontrado.");
});

test("dado recusado pelo banco vira 422, nao 500", async () => {
  const res = await enviar(`${base}/setores`, "POST", { nome: "   " });
  const body = await res.json();

  assert.equal(res.status, 422);
  assert.equal(body.erro, "Dados inválidos.");
});

// Payload igual ao que o modal de conclusão envia: trocas + resumo legado.
function payloadDoModal(trocas) {
  return {
    laudo: "Manutencao executada.",
    causaRaiz: "Desgaste Natural / Fim de vida útil",
    trocas,
    pecasTrocadas: trocas.map((t) => `${t.quantidade} × ${t.pecaNome}`).join("; "),
  };
}

async function abrirChamado(equipamentoId) {
  return enviar(`${base}/chamados`, "POST", { equipamentoId, urgencia: "Media" }).then((r) => r.json());
}

test("PATCH concluir grava varias pecas e devolve trocas", async () => {
  const chamado = await abrirChamado(seed.equipamentos[0].id);
  const trocas = [
    { pecaNome: "Rolamento 6205", quantidade: 2 },
    { pecaNome: "Correia", quantidade: 1, observacao: "Tensionada" },
  ];

  const res = await enviar(`${base}/chamados/${chamado.id}/concluir`, "PATCH", payloadDoModal(trocas));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.equal(body.status, "Concluído");
  assert.deepEqual(
    body.trocas.map((t) => [t.pecaNome, t.quantidade, t.observacao]),
    [["Rolamento 6205", 2, null], ["Correia", 1, "Tensionada"]]
  );
  assert.equal(body.pecasTrocadas, "2 × Rolamento 6205; 1 × Correia");
});

test("PATCH concluir sem pecas devolve trocas vazia", async () => {
  const chamado = await abrirChamado(seed.equipamentos[0].id);

  const res = await enviar(`${base}/chamados/${chamado.id}/concluir`, "PATCH", payloadDoModal([]));
  const body = await res.json();

  assert.equal(res.status, 200);
  assert.deepEqual(body.trocas, []);
});

test("PATCH concluir com peca invalida responde 422 e nao conclui", async () => {
  const chamado = await abrirChamado(seed.equipamentos[0].id);

  const res = await enviar(
    `${base}/chamados/${chamado.id}/concluir`,
    "PATCH",
    payloadDoModal([{ pecaNome: "Correia", quantidade: 1 }, { pecaNome: "Polia", quantidade: 0 }])
  );
  const body = await res.json();

  assert.equal(res.status, 422);
  assert.equal(body.erro, "quantidade deve ser um inteiro a partir de 1.");
  const chamados = await fetch(`${base}/chamados`).then((r) => r.json());
  const atual = chamados.find((c) => c.id === chamado.id);
  assert.equal(atual.status, "Aberto");
  assert.deepEqual(atual.trocas, []);
});

test("GET /equipamentos/:id/pecas devolve o historico no formato do contrato", async () => {
  const equipamentoId = seed.equipamentos[0].id;
  const chamado = await abrirChamado(equipamentoId);
  await enviar(`${base}/chamados/${chamado.id}/atribuir`, "PATCH", { tecnicoId: seed.tecnicos[0].id });
  await enviar(
    `${base}/chamados/${chamado.id}/concluir`,
    "PATCH",
    payloadDoModal([{ pecaNome: "Correia", quantidade: 1, observacao: "Tensionada" }])
  );

  const res = await fetch(`${base}/equipamentos/${equipamentoId}/pecas`);
  const [troca, ...resto] = await res.json();

  assert.equal(res.status, 200);
  assert.equal(resto.length, 0);
  assert.deepEqual(Object.keys(troca).sort(), ["chamado", "id", "observacao", "pecaNome", "quantidade", "registradoEm", "tecnico"]);
  assert.deepEqual(Object.keys(troca.chamado).sort(), ["causaRaiz", "finalizadoEm", "id", "tipo", "urgencia"]);
  assert.deepEqual(Object.keys(troca.tecnico).sort(), ["id", "nome"]);
  assert.equal(troca.chamado.id, chamado.id);
  assert.equal(troca.observacao, "Tensionada");
});

test("GET /equipamentos/:id/pecas: vazio responde [] e inexistente responde 404", async () => {
  const vazio = await fetch(`${base}/equipamentos/${seed.equipamentos[1].id}/pecas`);
  assert.equal(vazio.status, 200);
  assert.deepEqual(await vazio.json(), []);

  const inexistente = await fetch(`${base}/equipamentos/00000000-0000-4000-8000-000000000000/pecas`);
  assert.equal(inexistente.status, 404);
  assert.deepEqual(await inexistente.json(), { erro: "Equipamento não encontrado." });
});
