/**
 * Banco de dados em memória para a N1.
 * Justificativa (ver docs/debitos-tecnicos): substituir por
 * PostgreSQL/Prisma nas evoluções N2/N3, quando entram histórico
 * de peças e MTBF, que exigem persistência real.
 */

const { randomUUID } = require("crypto");

const db = {
  setores: [],
  equipamentos: [],
  tecnicos: [],
  chamados: [],
};

function seed() {
  const setorProducao = { id: randomUUID(), nome: "Produção - Linha 1" };
  const setorEmbalagem = { id: randomUUID(), nome: "Embalagem" };
  db.setores.push(setorProducao, setorEmbalagem);

  const torno = {
    id: randomUUID(),
    nome: "Torno CNC 01",
    setorId: setorProducao.id,
    codigoPatrimonio: "EQP-0001",
  };
  const esteira = {
    id: randomUUID(),
    nome: "Esteira Transportadora 02",
    setorId: setorEmbalagem.id,
    codigoPatrimonio: "EQP-0002",
  };
  db.equipamentos.push(torno, esteira);

  const tec1 = { id: randomUUID(), nome: "João Silva", matricula: "T-001" };
  const tec2 = { id: randomUUID(), nome: "Maria Souza", matricula: "T-002" };
  db.tecnicos.push(tec1, tec2);
}

seed();

module.exports = db;
