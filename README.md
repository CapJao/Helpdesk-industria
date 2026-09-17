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
├── frontend/           # HTML/CSS/JS simples, consumindo a API via fetch
├── backend/            # API REST em Node.js/Express (dados em memória na N1)
│   └── src/
│       ├── db/         # "banco" em memória + seed
│       ├── services/   # regras de negócio (chamadoService.js)
│       ├── routes/     # rotas HTTP
│       └── server.js
└── docs/
    ├── DER/                  # Modelo de dados (N1 e visão N2/N3)
    ├── debitos-tecnicos/     # Registro de débitos técnicos
    └── handoff/              # Documento de handoff para a próxima equipe
```

## Como executar localmente

Pré-requisitos: Node.js 18+.

```bash
cd backend
npm install
npm start
# API + frontend estático em http://localhost:3001
```

Abra `http://localhost:3001` no navegador. O frontend já vem pré-carregado
com 2 setores, 2 equipamentos e 2 técnicos de exemplo (seed em
`backend/src/db/memoryDb.js`).

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
| PATCH | `/api/chamados/:id/concluir` | Conclui o chamado |

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
