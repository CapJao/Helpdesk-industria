# Documento de Handoff — Helpdesk de Manutenção Industrial

Este documento existe para a equipe que receber o projeto avaliar a
viabilidade de recepção e dar continuidade nas evoluções N2/N3.

## 1. O que está implementado

- Cadastro de equipamentos e setores.
- Abertura de chamados com nível de urgência (Alta / Média / Baixa) e tipo
  (Corretiva / Preventiva).
- Atribuição de chamados a técnicos, com fila priorizada por urgência.
- **RN crítica implementada e testada:** um técnico não pode ter mais de 2
  chamados "Alta" abertos simultaneamente (`backend/src/services/chamadoService.js`).
- Frontend React + TypeScript + Vite consumindo a API.
- Kanban com arraste por mouse/toque, ações por teclado e detalhes completos do chamado.
- PostgreSQL com migrations versionadas, banco local persistente e seed sem duplicação.
- Conclusão de chamados com laudo e peças gravados na mesma transação.
- Histórico de peças por equipamento, com chamado de origem e técnico.
- CI no GitHub Actions com testes do backend e lint, build e testes de navegador do frontend.

## 2. O que NÃO foi feito nesta entrega (fica para N2/N3)

- Cálculo de MTBF (tempo médio entre falhas).
- Agendamento automático de preventivas.
- Autenticação/autorização.
- Ampliar a cobertura automatizada para todos os cadastros e cenários de falha;
  os testes atuais não cobrem todos os endpoints e estados possíveis (ver DT-03).
- Deploy contínuo e ambiente de hospedagem não configurados (ver DT-07).

## 3. Como rodar e onde mexer

Ver `README.md` na raiz do repositório para instruções de execução.

Pontos de extensão sugeridos para a N2:

- `backend/src/db/` contém conexão, migrations, seed e PostgreSQL local.
  Novas alterações do schema ficam em `backend/migrations/`.
- `chamadoService.js` já registra trocas e consulta o histórico. O cálculo de
  MTBF deve entrar como um serviço próprio, consumindo os chamados por
  `equipamentoId`; seu contrato ainda precisa ser definido.
- `docs/contratos/trocas-e-historico.md` documenta o contrato integrado de peças.
- Rotas novas ficam em `backend/src/routes/`, seguindo o padrão de
  `asHandler` já existente para tratamento de erros de RN.

## 4. Débitos técnicos herdados

Ver lista completa e priorizada em `docs/debitos-tecnicos/debitos-tecnicos.md`.
DT-01 está quitado. Recomenda-se avaliar DT-03 e DT-07 nas próximas etapas, pois
impactam diretamente a confiabilidade do cálculo de MTBF.

## 5. Contatos / papéis na N1

Ver seção "Papéis da equipe" no `README.md` e o detalhamento de
contribuições em `Matriz_de_Papeis_N1.docx`.

## 6. Critério sugerido de avaliação de viabilidade

Ao decidir se recebe o projeto, a próxima equipe deve considerar:

- [ ] O código roda localmente seguindo o README, sem passos faltando?
- [ ] A RN crítica está de fato implementada e testável?
- [ ] Os débitos técnicos são aceitáveis para o próximo ciclo, ou algum
      deles precisa ser pago antes de novas features (ex.: controle de acesso
      antes de disponibilizar o sistema a usuários externos)?
- [ ] A cobertura de testes é suficiente para evoluir com segurança?
