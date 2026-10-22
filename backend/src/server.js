const path = require("path");
const app = require("./app");
const db = require("./db");
const { migrar } = require("./db/migrar");
const { semear } = require("./db/seed");
const { iniciarPostgresLocal } = require("./db/postgresLocal");

const PORT = process.env.PORT || 3001;
// Sem DATABASE_URL, sobe um PostgreSQL local com os dados em backend/.pgdata.
const PASTA_PG_LOCAL = path.join(__dirname, "..", ".pgdata");
const PORTA_PG_LOCAL = Number(process.env.PG_LOCAL_PORT) || 54329;

async function iniciar() {
  let url = process.env.DATABASE_URL;
  let pararPostgresLocal = null;

  if (!url) {
    const local = await iniciarPostgresLocal({ dir: PASTA_PG_LOCAL, porta: PORTA_PG_LOCAL });
    url = local.url;
    pararPostgresLocal = local.parar;
    console.log(`PostgreSQL local em localhost:${PORTA_PG_LOCAL} (dados em backend/.pgdata)`);
  }

  db.conectar(url);
  const aplicadas = await migrar();
  if (aplicadas.length) console.log(`Migrations aplicadas: ${aplicadas.join(", ")}`);
  if (await semear()) console.log("Banco vazio: dados de exemplo inseridos.");

  const server = app.listen(PORT, () => {
    console.log(`Helpdesk API rodando em http://localhost:${PORT}`);
  });

  let encerrando = false;
  async function encerrar() {
    if (encerrando) return;
    encerrando = true;
    server.close();
    await db.desconectar();
    if (pararPostgresLocal) await pararPostgresLocal();
    process.exit(0);
  }
  process.on("SIGINT", encerrar);
  process.on("SIGTERM", encerrar);
}

iniciar().catch((err) => {
  console.error("Falha ao iniciar o backend:", err);
  process.exit(1);
});
