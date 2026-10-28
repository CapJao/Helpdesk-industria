# Critérios de aceite — Segunda entrega (N2)

Data: 27/10/2026.

Este documento define os resultados esperados para a homologação da segunda
entrega. Usa a primeira entrega como base e detalha as alterações de persistência,
peças, histórico e interface. Não substitui o relatório de execução do QA nem
significa que todos os cenários abaixo foram executados nesta revisão.

## 1. Escopo

Incluído:

- Persistência em PostgreSQL, migrations e dados iniciais.
- Registro estruturado de peças na conclusão do chamado.
- Histórico de peças por equipamento.
- Kanban com movimentação, detalhes do chamado e controles por teclado/toque.
- Preservação dos formulários quando uma operação falhar e layout responsivo.
- Preservação da regra de no máximo dois chamados Alta abertos por técnico.

Fora desta entrega: cálculo de MTBF, agendamento automático de preventivas,
autenticação, permissões por perfil e publicação em hospedagem. Chamados do tipo
`Preventiva` podem ser abertos manualmente; isso não representa agendamento
automático. Os cadastros e a abertura de chamados da N1 permanecem como base de
regressão, sem serem apresentados como funcionalidades novas da N2.

Os identificadores `CA-N2-*` são próprios deste documento; não substituem nem
renumeram os requisitos da primeira entrega. Registro e histórico de peças
correspondem aos FR-12 e FR-13 citados no contrato existente.

## 2. Persistência e integridade

### CA-N2-01 — Inicialização reproduzível

- **Dado** um ambiente com Node.js compatível com as dependências e npm,
  **quando** executar `npm ci` e `npm start` em `backend/`, sem `DATABASE_URL`,
  **então** a API deve iniciar na porta 3001, por padrão, com PostgreSQL local,
  sem exigir instalação manual do PostgreSQL ou Docker.
- As migrations pendentes devem ser aplicadas antes de disponibilizar a API.
- Com a base inicial vazia, devem existir dois setores, dois equipamentos e dois
  técnicos de exemplo. Reiniciar não deve duplicá-los.
- Com `DATABASE_URL` definida, deve ser usada a base informada, sem iniciar o
  PostgreSQL embutido. O banco indicado é um pré-requisito desse cenário.
- O frontend iniciado com `npm ci` e `npm run dev` deve consumir a API pelo proxy
  `/api` e apresentar os dados em `http://localhost:5173`.

### CA-N2-02 — Persistência após reinício

- **Dado** um chamado concluído com peças e os respectivos cadastros,
  **quando** parar e iniciar novamente o backend, preservando a pasta
  `backend/.pgdata`, **então** os registros, status, laudo e peças devem continuar
  disponíveis na API e na interface.
- A mesma expectativa se aplica a um PostgreSQL externo persistente. Reiniciar
  a aplicação não deve reinicializar nem apagar os dados existentes.

### CA-N2-03 — Integridade entre chamado, equipamento e troca

- Toda troca deve apontar para um chamado e um equipamento existentes.
- O equipamento da troca deve ser o mesmo do chamado. Uma gravação que viole a
  FK composta deve ser recusada pelo banco.
- No fluxo normal, o equipamento é obtido do chamado pelo backend; o usuário
  informa as peças, sem escolher outro equipamento para cada troca.

## 3. Conclusão e peças

### CA-N2-04 — Concluir com uma ou mais peças

- **Dado** um chamado não concluído, **quando** informar o laudo no formulário,
  adicionar peças válidas e confirmar, **então** o chamado deve passar para
  `Concluído`, registrar a data de conclusão e persistir todas as peças.
- Cada linha deve permitir informar nome, quantidade e observação opcional,
  além de adicionar ou remover linhas antes do envio.
- A resposta da conclusão e a listagem de chamados devem incluir `trocas`, com
  `id`, `pecaNome`, `quantidade`, `observacao` e `registradoEm` por item.
- As peças do chamado devem retornar na ordem em que foram enviadas.
- A interface deve exibir as peças após recarregar a página.

### CA-N2-05 — Concluir sem peças

- **Dado** um chamado não concluído, **quando** preencher o laudo e concluir sem
  adicionar peças, **então** a operação deve ser aceita e `trocas` deve ser `[]`.
- A API deve aceitar a lista ausente ou vazia, sem criar registros de troca.
- Não deve ser necessário cadastrar uma peça fictícia para concluir.

### CA-N2-06 — Validação das peças

- `trocas`, quando informada como lista de peças, deve conter itens válidos.
- `pecaNome` deve ser texto com 1 a 100 caracteres após remover espaços das
  extremidades. Nome vazio ou composto apenas por espaços deve ser recusado.
- `quantidade` deve ser um inteiro entre 1 e 2147483647. Quando omitida, deve
  assumir 1. Zero, negativos, decimais e valores acima do limite devem ser recusados.
- `observacao` é opcional; quando informada, deve ser texto de até 500 caracteres.
- Uma requisição JSON válida com peça inválida deve retornar `422` e corpo
  `{ "erro": "mensagem" }`, sem concluir nem registrar peças.
- Na interface, a rejeição deve manter o formulário aberto e os dados preenchidos.

### CA-N2-07 — Conclusão atômica e bloqueio de repetição

- **Dado** um chamado não concluído, **quando** ocorrer falha ao gravar qualquer
  peça, inclusive após gravar outra peça na mesma transação, **então** a conclusão
  inteira deve ser desfeita: status, laudo e data devem permanecer nos valores
  anteriores e nenhuma peça dessa tentativa deve ficar persistida.
- **Dado** um chamado já concluído, **quando** tentar concluí-lo novamente,
  **então** a API deve retornar `422`, preservando a conclusão e as peças originais.
- Uma falha ao atualizar a tela depois de uma conclusão confirmada não deve ser
  apresentada como falha na gravação da conclusão.

### CA-N2-08 — Compatibilidade com chamados antigos

- O texto legado `pecasTrocadas` deve continuar aceito e preservado.
- Quando `trocas` contiver peças estruturadas, elas devem ser apresentadas no
  cartão e nos detalhes. Sem peças estruturadas, o texto legado pode ser exibido.
- Não se exige transformar automaticamente o texto antigo em itens estruturados.
  O histórico por equipamento consulta as trocas estruturadas.

## 4. Histórico por equipamento

### CA-N2-09 — Consulta, ordenação e ausência de registros

- **Dado** um equipamento com trocas registradas, **quando** abrir o histórico
  no Parque Fabril ou consultar `GET /api/equipamentos/:id/pecas`, **então** devem
  retornar somente as trocas desse equipamento, da data mais recente para a antiga.
- Em peças da mesma conclusão, a posição informada deve ser preservada.
- Cada item deve apresentar nome, quantidade, observação quando existir, data,
  chamado de origem, tipo, urgência, causa raiz e técnico quando atribuído.
- Um equipamento existente sem trocas deve retornar `200` com `[]`; a interface
  deve mostrar `Nenhuma troca registrada`.
- Um equipamento inexistente deve retornar `404` com `{ "erro": "mensagem" }`.
- Enquanto a consulta estiver em andamento, deve haver indicação de carregamento.
  Se falhar, deve haver mensagem de erro e opção de tentar novamente.
- Datas devem representar instantes válidos; a API usa ISO 8601 em UTC e a
  interface apresenta as datas no formato local do navegador.

## 5. Kanban e detalhes

### CA-N2-10 — Movimentação com confirmação

- **Dado** um chamado aberto, **quando** arrastá-lo pela alça para Em Atendimento
  ou selecionar esse destino em `Mover`, **então** deve abrir a escolha do técnico.
- A coluna só deve mudar depois de confirmar um técnico válido e obter sucesso
  da API. Cancelar ou receber erro deve manter o chamado na etapa anterior.
- Mover para Concluídos deve abrir o formulário de conclusão. Soltar o cartão
  não pode concluir o chamado sem a confirmação desse formulário.
- Chamados concluídos não devem oferecer movimentação de volta. Chamados em
  atendimento não devem voltar para a triagem por esse fluxo.
- Deve ser possível usar a alça com mouse/toque e a ação `Mover` pelo teclado,
  sem alterar a regra de prioridade da fila.

### CA-N2-11 — Detalhes do chamado

- **Quando** clicar no cartão, acionar seu título ou usar Enter/Espaço no cartão
  focado, **então** deve abrir um modal com equipamento, patrimônio, setor,
  urgência, tipo, status, técnico, descrição e datas disponíveis.
- Para chamados concluídos, devem aparecer também laudo, causa raiz e peças.
- Informações ausentes devem ter indicação textual, sem quebrar a interface.
- Clicar em selecionar técnico, atribuir, mover ou concluir não deve abrir os
  detalhes simultaneamente.
- Os modais devem permitir fechamento por botão ou Escape quando não houver
  envio em andamento e manter a navegação de foco dentro do diálogo aberto.

## 6. Regressão e qualidade

### CA-N2-12 — Regra dos dois chamados Alta

- Um técnico pode ter no máximo dois chamados de urgência `Alta` nos status
  `Aberto` ou `Em Andamento` ao mesmo tempo.
- A tentativa de atribuir o terceiro deve retornar `422` sem alterar a atribuição.
- Em cinco atribuições simultâneas de chamados Alta distintos a um técnico sem
  carga inicial, somente duas devem ser aceitas; as demais devem ser recusadas
  pela regra, sem ultrapassar o limite no banco.
- Concluir um chamado Alta deve liberar capacidade para uma nova atribuição.
- Reatribuir o mesmo chamado ao técnico atual não deve contá-lo duas vezes.
  Uma transferência para outro técnico deve respeitar a carga do destino.

### CA-N2-13 — Formulários, erros e operação em rede local

- Uma falha no cadastro de chamado, equipamento ou setor deve mostrar uma
  mensagem e preservar os dados no formulário, permitindo corrigir ou reenviar.
- Enquanto houver envio, novos envios e o fechamento do respectivo modal devem
  ficar bloqueados para evitar perda de dados e duplicação por cliques repetidos.
- Os cenários de validação de negócio e registros inexistentes devem usar os
  códigos `422` e `404`, respectivamente, com mensagem compreensível.
- Adicionar/remover peças não pode depender de `crypto.randomUUID()` ou de HTTPS;
  deve funcionar também quando a interface estiver acessível por HTTP na rede
  local. O endereço de rede precisa estar exposto na configuração de execução.

### CA-N2-14 — Interface responsiva e verificação reproduzível

- Quadro de Chamados, Carga da Equipe e Parque Fabril devem caber em viewports de
  320, 390 e 768 pixels sem rolagem horizontal da página. A barra de abas pode ter
  rolagem própria para permitir acesso às opções.
- Em desktop, o Kanban deve apresentar as três colunas. Em telas menores, o
  empilhamento deve manter os cartões e ações acessíveis.
- Os modais de conclusão, histórico e detalhes devem caber na largura da tela,
  com rolagem vertical quando o conteúdo ultrapassar sua altura.
- A verificação deve poder ser repetida com `npm test` no backend e, no frontend,
  `npm run build`, `npm run lint` e `npm run test:e2e`. Falhas e avisos devem ser
  registrados; um build bem-sucedido não substitui a avaliação do fluxo.

## 7. Decisões e divergências a registrar

Estes pontos não devem ser apresentados como decisões novas já aprovadas:

- **Laudo na API:** o formulário exige texto não vazio, mas a API atualmente
  aceita laudo ausente. A obrigatoriedade também no backend depende de definição
  do escopo. Se for exigida, registrar a divergência e corrigir a API; este
  documento não declara essa correção como realizada.
- **Técnico antes da conclusão:** a API e a interface permitem concluir um chamado
  ainda aberto, sem técnico. Exigir atendimento prévio é uma decisão pendente,
  não uma regra já garantida pelo schema. Nesses registros, o histórico pode ter
  `tecnico: null`.
- **Cadastros repetidos:** nomes de setores e códigos de patrimônio não têm
  restrição de unicidade no schema. Qualquer exigência de exclusividade deve ser
  formalizada antes de ser usada como condição de reprovação.
- **JSON malformado:** foi relatado pelo QA que o parser pode responder HTML
  com detalhes internos. É um achado a acompanhar no relatório de bugs; não se
  deve presumir que todo erro de sintaxe JSON já retorna o envelope `{ erro }`.
- **Causa raiz:** permanece texto livre no backend e lista de opções na tela,
  conforme o contrato. Não há catálogo ou validação de enum no banco.

## 8. Registro da homologação

Para cada critério, registrar identificador, cenário executado, resultado
(aprovado, reprovado ou não executado), versão/commit, data, responsável e
referência à evidência ou bug. Cenários executados sem captura de tela podem ser
registrados em uma lista com seus resultados; não é necessário um print por
variação. A validação de um critério não deve ser deduzida somente da ausência
de bugs no relatório.

Referências:

- [Contrato de trocas e histórico](../contratos/trocas-e-historico.md).
- [DER atualizado](../DER/DER.md).
- [Testes do serviço](../../backend/test/chamadoService.test.js) e
  [das rotas](../../backend/test/routes.test.js).
- [Testes da interface](../../frontend/e2e/helpdesk.spec.ts).
