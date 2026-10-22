/**
 * Sobe um PostgreSQL local via embedded-postgres, sem Docker nem instalação
 * (RNF-10). Usado quando DATABASE_URL não está definida.
 */

const fs = require("fs");
const path = require("path");

const USUARIO = "postgres";
const SENHA = "postgres";
const BANCO = "helpdesk";

async function iniciarPostgresLocal({ dir, porta, persistente = true }) {
  // embedded-postgres é só ESM; o backend é CommonJS.
  const { default: EmbeddedPostgres } = await import("embedded-postgres");

  const pg = new EmbeddedPostgres({
    databaseDir: dir,
    user: USUARIO,
    password: SENHA,
    port: porta,
    persistent: persistente,
    onLog: () => {},
  });

  if (!fs.existsSync(path.join(dir, "PG_VERSION"))) {
    await pg.initialise();
  }
  await pg.start();

  const admin = pg.getPgClient();
  await admin.connect();
  const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [BANCO]);
  await admin.end();
  if (rowCount === 0) await pg.createDatabase(BANCO);

  return {
    url: `postgres://${USUARIO}:${SENHA}@localhost:${porta}/${BANCO}`,
    parar: () => pg.stop(),
  };
}

module.exports = { iniciarPostgresLocal };
