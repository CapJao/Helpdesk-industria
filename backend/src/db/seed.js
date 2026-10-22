/**
 * Dados de exemplo da N1: 2 setores, 2 equipamentos e 2 técnicos.
 * Só roda com o banco vazio, então reiniciar o servidor não duplica nada.
 */

const { query, transacao } = require(".");

async function semear() {
  const { rows } = await query("SELECT count(*)::int AS total FROM setores");
  if (rows[0].total > 0) return false;

  await transacao(async (db) => {
    const { rows: setores } = await db.query(`
      INSERT INTO setores (nome) VALUES ('Produção - Linha 1'), ('Embalagem')
      RETURNING id, nome
    `);
    const setorId = (nome) => setores.find((s) => s.nome === nome).id;

    await db.query(
      `INSERT INTO equipamentos (nome, setor_id, codigo_patrimonio) VALUES
         ('Torno CNC 01', $1, 'EQP-0001'),
         ('Esteira Transportadora 02', $2, 'EQP-0002')`,
      [setorId("Produção - Linha 1"), setorId("Embalagem")]
    );

    await db.query(`
      INSERT INTO tecnicos (nome, matricula) VALUES
        ('João Silva', 'T-001'),
        ('Maria Souza', 'T-002')
    `);
  });
  return true;
}

module.exports = { semear };
