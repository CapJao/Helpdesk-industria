const { query, transacao } = require("../db");

const URGENCIAS = ["Baixa", "Media", "Alta"];
const TIPOS = ["Corretiva", "Preventiva"];
const STATUS_ABERTOS = ["Aberto", "Em Andamento"];
const LIMITE_CHAMADOS_ALTA_POR_TECNICO = 2;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class RegraDeNegocioError extends Error {
  constructor(message) {
    super(message);
    this.name = "RegraDeNegocioError";
    this.statusCode = 422;
  }
}

class NaoEncontradoError extends RegraDeNegocioError {
  constructor(message) {
    super(message);
    this.name = "NaoEncontradoError";
    this.statusCode = 404;
  }
}

// Um id fora do formato uuid não existe no banco; evita erro de cast do Postgres.
function ehUuid(id) {
  return typeof id === "string" && UUID.test(id);
}

const SELECT_EQUIPAMENTO = `
  SELECT e.id, e.nome, e.setor_id AS "setorId", e.codigo_patrimonio AS "codigoPatrimonio",
         json_build_object('id', s.id, 'nome', s.nome) AS setor
  FROM equipamentos e
  JOIN setores s ON s.id = e.setor_id`;

const SELECT_TECNICO = `
  SELECT id, nome, matricula, chamados_alta_abertos AS "chamadosAltaAbertos"
  FROM tecnicos_com_carga`;

// Chamado já enriquecido com equipamento (+ setor) e técnico (+ carga), no formato do frontend.
const SELECT_CHAMADO = `
  SELECT c.id, c.equipamento_id AS "equipamentoId", c.tecnico_id AS "tecnicoId",
         c.urgencia, c.tipo, c.status, c.descricao,
         c.laudo, c.causa_raiz AS "causaRaiz", c.pecas_trocadas AS "pecasTrocadas",
         c.criado_em AS "criadoEm", c.atribuido_em AS "atribuidoEm", c.finalizado_em AS "finalizadoEm",
         json_build_object(
           'id', e.id, 'nome', e.nome, 'setorId', e.setor_id,
           'codigoPatrimonio', e.codigo_patrimonio,
           'setor', json_build_object('id', s.id, 'nome', s.nome)
         ) AS equipamento,
         CASE WHEN t.id IS NULL THEN NULL ELSE json_build_object(
           'id', t.id, 'nome', t.nome, 'matricula', t.matricula,
           'chamadosAltaAbertos', t.chamados_alta_abertos
         ) END AS tecnico
  FROM chamados c
  JOIN equipamentos e ON e.id = c.equipamento_id
  JOIN setores s ON s.id = e.setor_id
  LEFT JOIN tecnicos_com_carga t ON t.id = c.tecnico_id`;

async function buscarChamado(db, chamadoId) {
  const { rows } = await db.query(`${SELECT_CHAMADO} WHERE c.id = $1`, [chamadoId]);
  return rows[0];
}

async function listarEquipamentos() {
  const { rows } = await query(`${SELECT_EQUIPAMENTO} ORDER BY e.nome`);
  return rows;
}

async function criarEquipamento({ nome, setorId, codigoPatrimonio }) {
  if (!nome || !setorId) {
    throw new RegraDeNegocioError("nome e setorId são obrigatórios.");
  }
  if (!ehUuid(setorId)) throw new NaoEncontradoError("Setor não encontrado.");
  const { rowCount } = await query("SELECT 1 FROM setores WHERE id = $1", [setorId]);
  if (rowCount === 0) throw new NaoEncontradoError("Setor não encontrado.");

  const { rows } = await query(
    `INSERT INTO equipamentos (nome, setor_id, codigo_patrimonio) VALUES ($1, $2, $3) RETURNING id`,
    [nome, setorId, codigoPatrimonio || null]
  );
  const criado = await query(`${SELECT_EQUIPAMENTO} WHERE e.id = $1`, [rows[0].id]);
  return criado.rows[0];
}

async function listarSetores() {
  const { rows } = await query("SELECT id, nome FROM setores ORDER BY nome");
  return rows;
}

async function criarSetor({ nome }) {
  if (!nome) throw new RegraDeNegocioError("nome é obrigatório.");
  const { rows } = await query("INSERT INTO setores (nome) VALUES ($1) RETURNING id, nome", [nome]);
  return rows[0];
}

async function listarTecnicos() {
  const { rows } = await query(`${SELECT_TECNICO} ORDER BY nome`);
  return rows;
}

async function contarChamadosAltaAbertos(tecnicoId, db = { query }) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS total FROM chamados
     WHERE tecnico_id = $1 AND urgencia = 'Alta' AND status = ANY($2)`,
    [tecnicoId, STATUS_ABERTOS]
  );
  return rows[0].total;
}

async function listarChamados({ status, urgencia, tecnicoId } = {}) {
  if (tecnicoId && !ehUuid(tecnicoId)) return [];
  // Fila de prioridade: Alta > Media > Baixa; empatando, mais antigo primeiro
  const { rows } = await query(
    `${SELECT_CHAMADO}
     WHERE ($1::text IS NULL OR c.status = $1)
       AND ($2::text IS NULL OR c.urgencia = $2)
       AND ($3::uuid IS NULL OR c.tecnico_id = $3)
     ORDER BY CASE c.urgencia WHEN 'Alta' THEN 3 WHEN 'Media' THEN 2 ELSE 1 END DESC,
              c.criado_em ASC`,
    [status || null, urgencia || null, tecnicoId || null]
  );
  return rows;
}

async function abrirChamado({ equipamentoId, urgencia, descricao, tipo }) {
  if (!equipamentoId || !urgencia) {
    throw new RegraDeNegocioError("equipamentoId e urgencia são obrigatórios.");
  }
  if (!URGENCIAS.includes(urgencia)) {
    throw new RegraDeNegocioError(`urgencia deve ser uma de: ${URGENCIAS.join(", ")}.`);
  }
  if (tipo !== undefined && !TIPOS.includes(tipo)) {
    throw new RegraDeNegocioError(`tipo deve ser um de: ${TIPOS.join(", ")}.`);
  }
  if (!ehUuid(equipamentoId)) throw new NaoEncontradoError("Equipamento não encontrado.");
  const { rowCount } = await query("SELECT 1 FROM equipamentos WHERE id = $1", [equipamentoId]);
  if (rowCount === 0) throw new NaoEncontradoError("Equipamento não encontrado.");

  const { rows } = await query(
    `INSERT INTO chamados (equipamento_id, urgencia, descricao, tipo)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [equipamentoId, urgencia, descricao || "", tipo || "Corretiva"]
  );
  return buscarChamado({ query }, rows[0].id);
}

/**
 * RN Crítica: um técnico não pode ter mais de 2 chamados com urgência
 * "Alta" abertos (status Aberto ou Em Andamento) ao mesmo tempo.
 *
 * O `FOR UPDATE` na linha do técnico serializa atribuições simultâneas ao
 * mesmo técnico: a segunda espera a primeira terminar e só então conta,
 * já enxergando o chamado que a primeira atribuiu.
 */
async function atribuirChamado({ chamadoId, tecnicoId }) {
  if (!ehUuid(chamadoId)) throw new NaoEncontradoError("Chamado não encontrado.");
  if (!ehUuid(tecnicoId)) throw new NaoEncontradoError("Técnico não encontrado.");

  return transacao(async (db) => {
    const { rows: chamados } = await db.query(
      "SELECT id, urgencia, status, tecnico_id AS \"tecnicoId\" FROM chamados WHERE id = $1 FOR UPDATE",
      [chamadoId]
    );
    const chamado = chamados[0];
    if (!chamado) throw new NaoEncontradoError("Chamado não encontrado.");

    const { rows: tecnicos } = await db.query(
      "SELECT id, nome FROM tecnicos WHERE id = $1 FOR UPDATE",
      [tecnicoId]
    );
    const tecnico = tecnicos[0];
    if (!tecnico) throw new NaoEncontradoError("Técnico não encontrado.");

    if (!STATUS_ABERTOS.includes(chamado.status)) {
      throw new RegraDeNegocioError(
        "Somente chamados Abertos ou Em Andamento podem ser (re)atribuídos."
      );
    }

    if (chamado.urgencia === "Alta" && chamado.tecnicoId !== tecnicoId) {
      const abertosAlta = await contarChamadosAltaAbertos(tecnicoId, db);
      if (abertosAlta >= LIMITE_CHAMADOS_ALTA_POR_TECNICO) {
        throw new RegraDeNegocioError(
          `RN crítica violada: o técnico ${tecnico.nome} já possui ${abertosAlta} chamados de urgência "Alta" em aberto (limite: ${LIMITE_CHAMADOS_ALTA_POR_TECNICO}).`
        );
      }
    }

    await db.query(
      `UPDATE chamados SET tecnico_id = $2, status = 'Em Andamento', atribuido_em = now()
       WHERE id = $1`,
      [chamadoId, tecnicoId]
    );
    return buscarChamado(db, chamadoId);
  });
}

function validarTrocas(trocas) {
  if (!Array.isArray(trocas)) throw new RegraDeNegocioError("trocas deve ser uma lista.");
  for (const troca of trocas) {
    const nome = typeof troca?.pecaNome === "string" ? troca.pecaNome.trim() : "";
    if (nome.length < 1 || nome.length > 100) {
      throw new RegraDeNegocioError("pecaNome é obrigatório e deve ter até 100 caracteres.");
    }
    const quantidade = troca.quantidade ?? 1;
    if (!Number.isInteger(quantidade) || quantidade < 1) {
      throw new RegraDeNegocioError("quantidade deve ser um inteiro a partir de 1.");
    }
  }
}

/**
 * Fecha o chamado registrando o laudo técnico e as peças trocadas.
 * Conclusão e trocas são gravadas na mesma transação: se qualquer troca
 * falhar, o chamado continua aberto e nada é registrado. Laudo, causa raiz e
 * trocas alimentam o histórico de peças e o MTBF previstos para a N2.
 */
async function concluirChamado({ chamadoId, laudo, causaRaiz, pecasTrocadas, trocas = [] }) {
  if (!ehUuid(chamadoId)) throw new NaoEncontradoError("Chamado não encontrado.");
  validarTrocas(trocas);

  return transacao(async (db) => {
    const { rows } = await db.query(
      `SELECT id, status, equipamento_id AS "equipamentoId" FROM chamados WHERE id = $1 FOR UPDATE`,
      [chamadoId]
    );
    const chamado = rows[0];
    if (!chamado) throw new NaoEncontradoError("Chamado não encontrado.");
    if (chamado.status === "Concluído") {
      throw new RegraDeNegocioError("Chamado já está concluído.");
    }

    await db.query(
      `UPDATE chamados
       SET status = 'Concluído', finalizado_em = now(), laudo = $2, causa_raiz = $3, pecas_trocadas = $4
       WHERE id = $1`,
      [chamadoId, laudo || "", causaRaiz || "", pecasTrocadas || ""]
    );

    for (const troca of trocas) {
      await db.query(
        `INSERT INTO trocas_peca (chamado_id, equipamento_id, peca_nome, quantidade, observacao)
         VALUES ($1, $2, $3, $4, $5)`,
        [chamadoId, chamado.equipamentoId, troca.pecaNome.trim(), troca.quantidade ?? 1, troca.observacao || null]
      );
    }

    return buscarChamado(db, chamadoId);
  });
}

module.exports = {
  RegraDeNegocioError,
  NaoEncontradoError,
  URGENCIAS,
  TIPOS,
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
