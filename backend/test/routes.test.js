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
