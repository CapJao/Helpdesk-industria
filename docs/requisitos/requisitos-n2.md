# Requisitos do sistema: segunda entrega (N2)

Helpdesk de Manutenção Industrial.

Este documento transcreve os requisitos funcionais e não funcionais do PDF de
requisitos de 23/10/2026, preservando seus identificadores. O detalhamento dos
cenários de validação está nos [critérios de aceite](criterios-aceite-n2.md), e o
modelo físico está no [DER atualizado](../DER/DER.md).

## 1. Escopo

A segunda entrega mantém os cadastros e fluxos da N1 como base de regressão e
inclui persistência em PostgreSQL, registro estruturado de peças na conclusão,
histórico por equipamento e melhorias no Kanban e nos detalhes dos chamados.

MTBF, agendamento automático de preventivas, autenticação e permissões por
perfil ficam para as próximas etapas. A classificação manual de um chamado como
`Preventiva` não representa agendamento automático. A execução desta entrega é
local, sem publicação em hospedagem.

## 2. Requisitos funcionais

### RF01: Setores

Permitir cadastrar e listar setores da indústria.

### RF02: Equipamentos

Permitir cadastrar e listar equipamentos, vinculando-os a um setor e informando
o código de patrimônio opcionalmente.

### RF03: Abertura de chamados

Permitir abrir chamados vinculados a equipamentos, informando urgência,
descrição e tipo de manutenção: corretiva ou preventiva.

### RF04: Listagem e priorização de chamados

Listar chamados com filtros por status, urgência e técnico, priorizando os mais
urgentes e, em caso de empate, os mais antigos.

### RF05: Carga dos técnicos

Listar técnicos e apresentar a quantidade de chamados de urgência alta ativos
de cada um.

### RF06: Atribuição de chamados

Permitir atribuir ou reatribuir chamados a técnicos, respeitando o limite de
dois chamados de urgência alta ativos por técnico.

### RF07: Movimentação no Kanban

Permitir movimentar chamados no Kanban por arraste ou pelo botão Mover,
realizando atribuição ou conclusão conforme a etapa de destino.

### RF08: Conclusão e registro de peças

Permitir concluir chamados com laudo técnico, causa raiz opcional e registro
das peças substituídas, incluindo nome, quantidade e observação opcional.

### RF09: Histórico de peças por equipamento

Permitir consultar o histórico de peças substituídas por equipamento,
apresentando data, chamado de origem e técnico responsável, quando houver.

### RF10: Detalhes dos chamados

Exibir os detalhes dos chamados, incluindo equipamento, setor, descrição,
urgência, tipo, status, técnico, datas, laudo, causa raiz e peças substituídas.

## 3. Requisitos não funcionais

### RNF01: Persistência

Persistir os dados em PostgreSQL, mantendo os registros após reiniciar a
aplicação.

### RNF02: Atomicidade da conclusão

Garantir que a conclusão do chamado e o registro das peças ocorram na mesma
transação, revertendo todas as alterações em caso de falha.

### RNF03: Integridade referencial

Garantir integridade referencial entre setores, equipamentos, técnicos,
chamados e peças substituídas.

### RNF04: Concorrência

Controlar operações concorrentes para preservar o limite de chamados por
técnico e impedir duplicação de peças em conclusões simultâneas.

### RNF05: Migrations

Gerenciar alterações na estrutura do banco por migrations versionadas, sem
reaplicar migrations já executadas.

### RNF06: Comunicação pela API

Disponibilizar comunicação entre frontend e backend por API REST, utilizando
JSON.

### RNF07: Padronização de erros

Padronizar os erros da API no formato `{ "erro": "mensagem" }`, utilizando
códigos HTTP conforme a situação.

### RNF08: Operação por teclado e toque

Permitir operar o Kanban por teclado e toque, oferecendo alternativa à
movimentação por arraste.

### RNF09: Confirmação das operações

Atualizar o estado dos cartões somente após confirmação da API, mantendo o
estado anterior quando a operação falhar.

### RNF10: Verificação automatizada

Manter verificação automatizada com testes do backend e da interface, além de
lint e build do frontend na integração contínua.

## 4. Regras e homologação

- A carga limitada a dois chamados considera urgência `Alta` e status `Aberto`
  ou `Em Andamento`, inclusive em atribuições simultâneas.
- Cada troca pertence ao mesmo equipamento do chamado ao qual está vinculada.
- Uma conclusão pode ser realizada sem peças. Quando informadas, as peças
  devem atender às validações descritas nos critérios de aceite.
- A movimentação no Kanban exige confirmação do formulário correspondente;
  chamados concluídos não retornam às etapas anteriores por esse fluxo.

Os requisitos descrevem o comportamento esperado e não comprovam, por si só,
aprovação nos testes. A homologação deve registrar o resultado de cada cenário
e as pendências conhecidas.

As divergências sobre laudo opcional na API, conclusão sem técnico, cadastros
repetidos, JSON malformado e causa raiz estão registradas na seção
[Decisões e divergências a registrar](criterios-aceite-n2.md#7-decisões-e-divergências-a-registrar).
Esses pontos não devem ser tratados como corrigidos ou aprovados apenas pela
publicação deste documento.

## 5. Documentos relacionados

- [Critérios de aceite da segunda entrega](criterios-aceite-n2.md).
- [DER atualizado](../DER/DER.md).
- [Contrato da API para trocas e histórico](../contratos/trocas-e-historico.md).
- [Handoff](../handoff/handoff.md).
- [Débitos técnicos](../debitos-tecnicos/debitos-tecnicos.md).
- [Repositório do projeto](https://github.com/CapJao/Helpdesk-industria).

Os códigos RF01 a RF10 e RNF01 a RNF10 seguem o PDF de requisitos da segunda
entrega. O contrato histórico utiliza FR-12 e FR-13 para registro e histórico
de peças, temas correspondentes a RF08 e RF09 neste documento.
