const assert = require("node:assert/strict");
const test = require("node:test");
const express = require("express");
const db = require("../src/db/memoryDb");
const routes = require("../src/routes");

async function comServidor(fn) {
  const app = express();
  app.use(express.json());
  app.use("/api", routes);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

function enviar(url, method, body) {
  return fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("PATCH /chamados/:id/concluir repassa o laudo do frontend", () =>
  comServidor(async (base) => {
    const criado = await enviar(`${base}/chamados`, "POST", {
      equipamentoId: db.equipamentos[0].id,
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
  }));

test("rota responde 404 com { erro } para chamado inexistente", () =>
  comServidor(async (base) => {
    const res = await enviar(`${base}/chamados/nao-existe/concluir`, "PATCH", {});
    const body = await res.json();

    assert.equal(res.status, 404);
    assert.equal(body.erro, "Chamado não encontrado.");
  }));
