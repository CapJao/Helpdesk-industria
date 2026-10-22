# Helpdesk de Manutenção Industrial

Sistema para controle de manutenção preventiva e corretiva do parque fabril:
cadastro de equipamentos e setores, abertura de chamados por nível de urgência
e atribuição de chamados a técnicos, com fila priorizada e enforcement da
regra de negócio crítica do time.

> **Escopo desta entrega: N1.** Histórico de troca de peças, cálculo de MTBF e
> agendamento automático de preventivas fazem parte da evolução N2/N3 (ver
> `docs/debitos-tecnicos`).

## Regra de Negócio Crítica (N1)

> Um técnico não pode ter mais de **2 chamados com urgência "Alta"** abertos
> (status `Aberto` ou `Em Andamento`) ao mesmo tempo.

Implementada em `backend/src/services/chamadoService.js`, função
`atribuirChamado`. Uma tentativa de atribuição que viole a regra retorna
`HTTP 422` com mensagem explicativa — o frontend exibe essa mensagem ao
usuário.

## Estrutura do repositório

```
projeto/
├── README.md
├── frontend/           # React + TypeScript + Vite
├── backend/            # API REST em Node.js/Express + PostgreSQL
│   ├── migrations/     # schema do banco, um .sql por mudança
│   └── src/
│       ├── db/         # conexão, Postgres local, migrations e seed
│       ├── services/   # regras de negócio (chamadoService.js)
│       ├── routes/     # rotas HTTP
│       ├── app.js      # app Express (usado também nos testes)
│       └── server.js   # boot: banco + migrations + seed + servidor
└── docs/
    ├── DER/                  # Modelo de dados (N1 e visão N2/N3)
    ├── debitos-tecnicos/     # Registro de débitos técnicos
    └── handoff/              # Documento de handoff para a próxima equipe
```

## Como executar localmente

Pré-requisitos: Node.js 20+ e npm.

Inicie o backend em um terminal:

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

Abra `http://localhost:5173`. O Vite encaminha as chamadas `/api` para o
backend em `http://localhost:3001`. Com o banco vazio, o backend insere 2
setores, 2 equipamentos e 2 técnicos de exemplo (seed em
`backend/src/db/seed.js`).

### Banco de dados

Não é preciso instalar PostgreSQL nem Docker. Sem a variável `DATABASE_URL`,
o `npm start` sobe um PostgreSQL 18 local pelo pacote `embedded-postgres`
(o binário vem no `npm ci`), na porta `54329`, com os dados em
`backend/.pgdata`. Os dados sobrevivem ao reinício do servidor.

- **Zerar o banco:** pare o backend e apague `backend/.pgdata`.
- **Usar outro PostgreSQL:** defina `DATABASE_URL`
  (ex.: `postgres://usuario:senha@host:5432/helpdesk`).
- **Outra porta local:** defina `PG_LOCAL_PORT`.
- **Mudar o schema:** crie um novo arquivo em `backend/migrations/`
  (`002_...sql`); ele é aplicado no próximo `npm start`.

Os testes (`npm test`) sobem um PostgreSQL descartável por arquivo de teste e
não tocam em `backend/.pgdata`.

Para servir tudo pelo backend (sem o Vite), gere o build com `npm run build`
em `frontend/`; o backend serve `frontend/dist` em `http://localhost:3001`.

Erros da API vêm como `{ erro }`: `422` para violação de regra de negócio ou
payload inválido (inclusive dado recusado pelo banco), `404` para setor,
equipamento, técnico ou chamado inexistente.

## Integração contínua

O GitHub Actions valida o backend (`npm ci` e `npm test`) e o frontend
(`npm ci`, `npm run lint` e `npm run build`) em cada push e pull request.
Esses comandos também podem ser executados localmente nas pastas
`backend` e `frontend`, respectivamente.

## Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/setores` | Lista setores |
| POST | `/api/setores` | Cria setor `{ nome }` |
| GET | `/api/equipamentos` | Lista equipamentos (com setor) |
| POST | `/api/equipamentos` | Cria equipamento `{ nome, setorId, codigoPatrimonio }` |
| GET | `/api/tecnicos` | Lista técnicos + contagem de chamados "Alta" abertos |
| GET | `/api/chamados` | Lista chamados priorizados (filtros: `status`, `urgencia`, `tecnicoId`) |
| POST | `/api/chamados` | Abre chamado `{ equipamentoId, urgencia, descricao, tipo }` |
| PATCH | `/api/chamados/:id/atribuir` | Atribui técnico `{ tecnicoId }` — aplica a RN crítica |
| PATCH | `/api/chamados/:id/concluir` | Conclui o chamado `{ laudo, causaRaiz, pecasTrocadas }` (todos opcionais; chamado já concluído retorna 422) |

Coleção Postman pronta para importar: `docs/handoff/postman_collection.json`.

## Gestão do time e entregáveis do processo (fora deste repositório)

Os itens abaixo fazem parte do pacote de entrega da N1, mas vivem fora do
código-fonte:

- **GitHub:** publicar este conteúdo em um repositório da equipe e criar a
  tag/release `v1.0` assim que a N1 for aprovada, para congelar o que foi
  avaliado.
- **Gestão de tarefas:** quadro em Jira/Trello/GitHub Projects com o
  acompanhamento das tarefas da N1 (não incluído aqui por depender de contas
  da equipe).
- **Matriz de Papéis / Histórico de Contribuições:** `Matriz_de_Papeis_N1.docx`
  (entregue separadamente).
- **Pitch:** `Pitch_Helpdesk_Manutencao_Industrial.pdf`, apresentado pelo PO.
- **Comentário no Teams:** usar o modelo em `docs/handoff/comentario-teams.md`.

## Papéis da equipe (conforme Acordo de Manutenibilidade)

| Papel | Integrante |
|---|---|
| Product Owner (PO) | Ruan Pablo de Lima Pereira |
| Quality Assurance (QA) | Vinicius Clemente Negherbon |
| Desenvolvedor Frontend | Rodrigo Bonifácio Conceição |
| Desenvolvedor Backend | Bianca Barp |
| DevOps | Guilherme Pietro Ruiz Costa |

> A partir desta atualização a equipe está com 5 integrantes. As responsabilidades
> de Engenharia de Requisitos (antes a cargo de um integrante que deixou o time)
> foram absorvidas pelo PO, com apoio do QA na formalização dos critérios de
> aceitação — sem impacto no escopo ou na RN crítica já entregues na N1.

O papel atribuído não é exclusivo: qualquer integrante pode e deve atuar em
outras frentes quando necessário (ver `Matriz_de_Papeis_N1.docx` para o
histórico real de contribuições).
