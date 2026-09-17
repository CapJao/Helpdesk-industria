const { randomUUID } = require("crypto");
const db = require("../db/memoryDb");

const URGENCIAS = ["Baixa", "Media", "Alta"];
const STATUS_ABERTOS = ["Aberto", "Em Andamento"];
const LIMITE_CHAMADOS_ALTA_POR_TECNICO = 2;

class RegraDeNegocioError extends Error {
  constructor(message) {
    super(message);
    this.name = "RegraDeNegocioError";
    this.statusCode = 422;
  }
}

function listarEquipamentos() {
  return db.equipamentos.map((e) => ({
    ...e,
    setor: db.setores.find((s) => s.id === e.setorId) || null,
  }));
}

function criarEquipamento({ nome, setorId, codigoPatrimonio }) {
  if (!nome || !setorId) {
    throw new RegraDeNegocioError("nome e setorId são obrigatórios.");
  }
  const setor = db.setores.find((s) => s.id === setorId);
  if (!setor) throw new RegraDeNegocioError("Setor não encontrado.");

  const equipamento = { id: randomUUID(), nome, setorId, codigoPatrimonio };
  db.equipamentos.push(equipamento);
  return equipamento;
}

function listarSetores() {
  return db.setores;
}

function criarSetor({ nome }) {
  if (!nome) throw new RegraDeNegocioError("nome é obrigatório.");
  const setor = { id: randomUUID(), nome };
  db.setores.push(setor);
  return setor;
}

function listarTecnicos() {
  return db.tecnicos.map((t) => ({
    ...t,
    chamadosAltaAbertos: contarChamadosAltaAbertos(t.id),
  }));
}

function contarChamadosAltaAbertos(tecnicoId) {
  return db.chamados.filter(
    (c) =>
      c.tecnicoId === tecnicoId &&
      c.urgencia === "Alta" &&
      STATUS_ABERTOS.includes(c.status)
  ).length;
}

function listarChamados({ status, urgencia, tecnicoId } = {}) {
  return db.chamados
    .filter((c) => (status ? c.status === status : true))
    .filter((c) => (urgencia ? c.urgencia === urgencia : true))
    .filter((c) => (tecnicoId ? c.tecnicoId === tecnicoId : true))
    .map(enriquecerChamado)
    .sort((a, b) => {
      // Fila de prioridade: Alta > Media > Baixa; empatando, mais antigo primeiro
      const pesoUrgencia = { Alta: 3, Media: 2, Baixa: 1 };
      if (pesoUrgencia[b.urgencia] !== pesoUrgencia[a.urgencia]) {
        return pesoUrgencia[b.urgencia] - pesoUrgencia[a.urgencia];
      }
      return new Date(a.criadoEm) - new Date(b.criadoEm);
    });
}

function enriquecerChamado(chamado) {
  return {
    ...chamado,
    equipamento: db.equipamentos.find((e) => e.id === chamado.equipamentoId) || null,
    tecnico: db.tecnicos.find((t) => t.id === chamado.tecnicoId) || null,
  };
}

function abrirChamado({ equipamentoId, urgencia, descricao, tipo }) {
  if (!equipamentoId || !urgencia) {
    throw new RegraDeNegocioError("equipamentoId e urgencia são obrigatórios.");
  }
  if (!URGENCIAS.includes(urgencia)) {
    throw new RegraDeNegocioError(`urgencia deve ser uma de: ${URGENCIAS.join(", ")}.`);
  }
  const equipamento = db.equipamentos.find((e) => e.id === equipamentoId);
  if (!equipamento) throw new RegraDeNegocioError("Equipamento não encontrado.");

  const chamado = {
    id: randomUUID(),
    equipamentoId,
    urgencia,
    descricao: descricao || "",
    tipo: tipo === "Preventiva" ? "Preventiva" : "Corretiva",
    status: "Aberto",
    tecnicoId: null,
    criadoEm: new Date().toISOString(),
    atribuidoEm: null,
    finalizadoEm: null,
  };
  db.chamados.push(chamado);
  return enriquecerChamado(chamado);
}

/**
 * RN Crítica: um técnico não pode ter mais de 2 chamados com urgência
 * "Alta" abertos (status Aberto ou Em Andamento) ao mesmo tempo.
 */
function atribuirChamado({ chamadoId, tecnicoId }) {
  const chamado = db.chamados.find((c) => c.id === chamadoId);
  if (!chamado) throw new RegraDeNegocioError("Chamado não encontrado.");

  const tecnico = db.tecnicos.find((t) => t.id === tecnicoId);
  if (!tecnico) throw new RegraDeNegocioError("Técnico não encontrado.");

  if (!STATUS_ABERTOS.includes(chamado.status)) {
    throw new RegraDeNegocioError(
      "Somente chamados Abertos ou Em Andamento podem ser (re)atribuídos."
    );
  }

  if (chamado.urgencia === "Alta" && chamado.tecnicoId !== tecnicoId) {
    const abertosAlta = contarChamadosAltaAbertos(tecnicoId);
    if (abertosAlta >= LIMITE_CHAMADOS_ALTA_POR_TECNICO) {
      throw new RegraDeNegocioError(
        `RN crítica violada: o técnico ${tecnico.nome} já possui ${abertosAlta} chamados de urgência "Alta" em aberto (limite: ${LIMITE_CHAMADOS_ALTA_POR_TECNICO}).`
      );
    }
  }

  chamado.tecnicoId = tecnicoId;
  chamado.status = "Em Andamento";
  chamado.atribuidoEm = new Date().toISOString();
  return enriquecerChamado(chamado);
}

function concluirChamado({ chamadoId }) {
  const chamado = db.chamados.find((c) => c.id === chamadoId);
  if (!chamado) throw new RegraDeNegocioError("Chamado não encontrado.");
  chamado.status = "Concluído";
  chamado.finalizadoEm = new Date().toISOString();
  return enriquecerChamado(chamado);
}

module.exports = {
  RegraDeNegocioError,
  URGENCIAS,
  listarEquipamentos,
  criarEquipamento,
  listarSetores,
  criarSetor,
  listarTecnicos,
  listarChamados,
  abrirChamado,
  atribuirChamado,
  concluirChamado,
  contarChamadosAltaAbertos,
};
