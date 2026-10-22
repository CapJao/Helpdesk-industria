/**
 * Aplica, em ordem, os arquivos .sql de backend/migrations ainda não aplicados.
 * Cada migration roda na sua própria transação.
 */

const fs = require("fs");
const path = require("path");
const { query, transacao } = require(".");

const PASTA_MIGRATIONS = path.join(__dirname, "..", "..", "migrations");

async function migrar() {
  await query(`
    CREATE TABLE IF NOT EXISTS migracoes (
      nome       text PRIMARY KEY,
      aplicada_em timestamptz NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await query("SELECT nome FROM migracoes");
  const aplicadas = new Set(rows.map((r) => r.nome));

  const pendentes = fs
    .readdirSync(PASTA_MIGRATIONS)
    .filter((arquivo) => arquivo.endsWith(".sql") && !aplicadas.has(arquivo))
    .sort();

  for (const arquivo of pendentes) {
    const sql = fs.readFileSync(path.join(PASTA_MIGRATIONS, arquivo), "utf8");
    await transacao(async (db) => {
      await db.query(sql);
      await db.query("INSERT INTO migracoes (nome) VALUES ($1)", [arquivo]);
    });
  }
  return pendentes;
}

module.exports = { migrar };
