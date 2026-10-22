/**
 * Acesso ao PostgreSQL (substitui o memoryDb da N1, DT-01).
 * A conexão é aberta uma vez no boot (server.js) ou nos testes.
 */

const { Pool } = require("pg");

let pool = null;

function conectar(connectionString) {
  pool = new Pool({ connectionString });
  return pool;
}

async function desconectar() {
  if (pool) await pool.end();
  pool = null;
}

function obterPool() {
  if (!pool) throw new Error("Banco não conectado: chame conectar() antes.");
  return pool;
}

function query(text, params) {
  return obterPool().query(text, params);
}

/**
 * Executa `fn` numa transação; qualquer erro desfaz tudo.
 * `fn` recebe o client da transação e deve usá-lo em todas as consultas.
 */
async function transacao(fn) {
  const client = await obterPool().connect();
  try {
    await client.query("BEGIN");
    const resultado = await fn(client);
    await client.query("COMMIT");
    return resultado;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { conectar, desconectar, query, transacao };
