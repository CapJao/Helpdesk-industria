/**
 * Postgres descartável por arquivo de teste: pasta temporária e porta livre,
 * então os arquivos rodam em paralelo sem um pisar no outro.
 */

const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const db = require("../../src/db");
const { migrar } = require("../../src/db/migrar");
const { semear } = require("../../src/db/seed");
const { iniciarPostgresLocal } = require("../../src/db/postgresLocal");

function portaLivre() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function prepararBanco() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "helpdesk-pg-"));
  const local = await iniciarPostgresLocal({ dir, porta: await portaLivre(), persistente: false });
  db.conectar(local.url);
  await migrar();

  return {
    async limpar() {
      await db.query("TRUNCATE trocas_peca, chamados, equipamentos, tecnicos, setores CASCADE");
      await semear();
    },
    async encerrar() {
      await db.desconectar();
      await local.parar();
    },
  };
}

// Registros do seed, em ordem de nome, no lugar dos arrays do antigo memoryDb.
async function dadosDoSeed() {
  const [equipamentos, tecnicos] = await Promise.all([
    db.query(`SELECT id, setor_id AS "setorId" FROM equipamentos ORDER BY nome`),
    db.query("SELECT id FROM tecnicos ORDER BY nome"),
  ]);
  return { equipamentos: equipamentos.rows, tecnicos: tecnicos.rows };
}

module.exports = { prepararBanco, dadosDoSeed };
