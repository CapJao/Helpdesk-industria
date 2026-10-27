# Helpdesk de Manutenção Industrial

Aplicação web para acompanhar a manutenção do parque fabril. Reúne cadastro de
setores e equipamentos, abertura e priorização de chamados, atribuição a
técnicos e registro do serviço e das peças utilizadas na conclusão.

## Funcionalidades

- **Quadro Kanban:** acompanha chamados abertos, em andamento e concluídos.
  Permite pesquisar por equipamento, patrimônio, descrição ou técnico e filtrar
  por urgência, tipo e setor.
- **Movimentação de chamados:** atribuição de técnico e conclusão pelo cartão,
  por arraste, botão ou teclado. O cartão só muda após a confirmação da API;
  chamados concluídos não voltam para etapas anteriores.
- **Parque fabril:** cadastro e consulta de setores e equipamentos, contagem de
  chamados ativos e acesso ao histórico de peças por equipamento.
- **Técnicos:** exibe os chamados ativos e a carga de chamados de urgência alta.
- **Conclusão e histórico:** registra laudo, causa raiz e peças substituídas
  (nome, quantidade e observação). A conclusão e as peças são gravadas numa
  única transação.
- **Persistência:** PostgreSQL com migrations versionadas e dados de exemplo
  inseridos apenas quando o banco está vazio.

### Regra de atribuição

Um técnico não pode ter mais de **2 chamados de urgência `Alta`** com status
`Aberto` ou `Em Andamento` ao mesmo tempo. O backend aplica a regra dentro de
uma transação, inclusive para atribuições concorrentes, e responde `422` quando
o limite é excedido.

### O que ainda não está implementado

Chamados podem ser classificados como `Preventiva`, mas o cálculo de MTBF e o
agendamento automático de manutenções preventivas ainda não fazem parte do
sistema. Autenticação, autorização e deploy também estão fora do escopo atual.

## Tecnologias

- **Frontend:** React, TypeScript, Vite e Playwright.
- **Backend:** Node.js, Express e `pg`.
- **Banco:** PostgreSQL 18 local via `embedded-postgres`, ou PostgreSQL externo.
- **CI:** GitHub Actions; a configuração está em
  [.github/workflows/ci.yml](.github/workflows/ci.yml).

## Requisitos

- Node.js 20 ou superior e npm.
- Para os testes de interface, Chromium instalado pelo Playwright (instruções
  abaixo).
- PostgreSQL externo somente se optar por não usar o PostgreSQL embutido.

## Executar localmente

Instale as dependências e inicie a API:

```bash
cd backend
npm ci
npm start
```

Em outro terminal, inicie o frontend:

```bash
cd frontend
npm ci
npm run dev
```

Acesse <http://localhost:5173>. O Vite encaminha as chamadas `/api` para a API
em <http://localhost:3001>. O endpoint <http://localhost:3001/health> retorna
`{"status":"ok"}` quando a API está disponível.

Com o PostgreSQL local vazio, a inicialização aplica as migrations e cria dois
setores, dois equipamentos e dois técnicos de exemplo. O seed só é executado
quando ainda não há setores cadastrados.

### Banco de dados local

Por padrão, `npm start` inicializa um PostgreSQL 18 embutido, sem exigir uma
instalação separada de PostgreSQL ou Docker. Os dados ficam em
`backend/.pgdata`, na porta `54329`, e permanecem após reiniciar o backend.

- Para escolher outra porta, defina `PG_LOCAL_PORT` antes de iniciar o backend.
- Para usar um PostgreSQL existente, defina `DATABASE_URL`, por exemplo:
  `postgres://<usuario>:<senha>@localhost:5432/helpdesk`.
- Para zerar os dados locais, pare o backend e remova somente
  `backend/.pgdata`. Na próxima inicialização, o schema e o seed serão criados
  novamente.
- Para alterar o schema, adicione um arquivo SQL numerado em
  `backend/migrations/`, por exemplo `003_nome_da_mudanca.sql`. Migrations
  pendentes são aplicadas em ordem na inicialização; cada uma roda na própria
  transação.

Se o build de produção do frontend já existir em `frontend/dist`, o backend
também serve esses arquivos em <http://localhost:3001>. Para gerá-lo:

```bash
cd frontend
npm run build
```

## Testes e validações

Execute os testes do backend (usam PostgreSQL descartável e não alteram
`backend/.pgdata`):

```bash
cd backend
npm ci
npm test
```

Execute lint, build e testes de navegador do frontend:

```bash
cd frontend
npm ci
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Os testes de interface usam respostas controladas da API e iniciam um Vite
temporário na porta `5175`; não precisam do banco local. No GitHub Actions, os
testes do backend e as validações do frontend rodam em jobs separados a cada
push e pull request. O workflow instala as dependências do Chromium antes dos
testes de interface.

## API

Todas as rotas abaixo são prefixadas por `/api`.

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/setores` | Lista setores. |
| `POST` | `/setores` | Cria setor com `{ "nome": "Produção" }`. |
| `GET` | `/equipamentos` | Lista equipamentos com seus setores. |
| `POST` | `/equipamentos` | Cria equipamento com `{ "nome", "setorId", "codigoPatrimonio" }`; patrimônio é opcional. |
| `GET` | `/equipamentos/:id/pecas` | Lista o histórico de peças do equipamento, da mais recente para a mais antiga. |
| `GET` | `/tecnicos` | Lista técnicos e a contagem de chamados `Alta` abertos. |
| `GET` | `/chamados` | Lista chamados priorizados; aceita filtros `status`, `urgencia` e `tecnicoId`. |
| `POST` | `/chamados` | Abre chamado com `{ "equipamentoId", "urgencia", "descricao", "tipo" }`; urgência é `Alta`, `Media` ou `Baixa`, e tipo é `Corretiva` ou `Preventiva`. |
| `PATCH` | `/chamados/:id/atribuir` | Atribui técnico com `{ "tecnicoId" }` e aplica a regra de limite. |
| `PATCH` | `/chamados/:id/concluir` | Conclui o chamado com laudo, causa raiz e peças substituídas. |

No endpoint de conclusão, `laudo`, `causaRaiz` e `pecasTrocadas` são opcionais.
As peças estruturadas são enviadas em `trocas`, uma lista que pode estar vazia:

```json
{
  "laudo": "Rolamento substituído.",
  "causaRaiz": "Desgaste",
  "trocas": [
    { "pecaNome": "Rolamento 6205", "quantidade": 2 },
    { "pecaNome": "Correia", "observacao": "Tensionada após a troca" }
  ]
}
```

`quantidade` é opcional e assume `1`; `observacao` também é opcional. Se uma
peça for inválida ou o chamado já estiver concluído, a API responde `422` sem
salvar parcialmente a conclusão. Os erros da API usam o formato
`{ "erro": "mensagem" }`; recursos inexistentes retornam `404`.

## Estrutura do repositório

```text
backend/
  migrations/       Migrations SQL do PostgreSQL
  src/
    db/             Conexão, PostgreSQL local, migrations e seed
    routes/         Rotas HTTP da API
    services/       Regras de negócio dos chamados
    app.js          Aplicação Express
    server.js       Inicialização do banco, API e frontend compilado
  test/             Testes do backend e utilitários de banco descartável
frontend/
  e2e/              Testes de interface com Playwright
  src/
    components/     Quadro, telas e diálogos da aplicação
    services/       Cliente da API
docs/
  contratos/        Contrato de trocas e histórico de peças
  debitos-tecnicos/ Débitos técnicos conhecidos
  DER/              Modelo de dados e visão de evolução
  handoff/          Handoff e coleção Postman
```

## Papéis da equipe (conforme Acordo de Manutenibilidade)

| Papel | Integrante |
|---|---|
| Engenheiro de Requisitos | Heitor Lopes Reis |
| Product Owner (PO) | Anttonio Osório Molinaro Maccagnini |
| Quality Assurance (QA) | Gabriel Lengert Guedes |
| Desenvolvedor Frontend | Rafael Alexandre Alves Bandoch |
| Desenvolvedor Backend | João Vitor Paranhos |
| DevOps | João Pedro Alves de Lima |

## Documentação relacionada

- [Contrato de trocas e histórico de peças](docs/contratos/trocas-e-historico.md)
- [Débitos técnicos](docs/debitos-tecnicos/debitos-tecnicos.md)
- [Documento de handoff](docs/handoff/handoff.md)
- [Coleção Postman](docs/handoff/postman_collection.json)
