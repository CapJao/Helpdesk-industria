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