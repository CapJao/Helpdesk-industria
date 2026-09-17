# Documento de Handoff — N1 Helpdesk de Manutenção Industrial

Este documento existe para a equipe que receber o projeto avaliar a
viabilidade de recepção e dar continuidade nas evoluções N2/N3.

## 1. O que foi entregue na N1

- Cadastro de equipamentos e setores.
- Abertura de chamados com nível de urgência (Alta / Média / Baixa) e tipo
  (Corretiva / Preventiva).
- Atribuição de chamados a técnicos, com fila priorizada por urgência.
- **RN crítica implementada e testada:** um técnico não pode ter mais de 2
  chamados "Alta" abertos simultaneamente (`backend/src/services/chamadoService.js`).
- Frontend funcional (HTML/JS) consumindo a API.

## 2. O que NÃO foi feito nesta entrega (fica para N2/N3)

- Histórico de troca de peças por máquina.
- Cálculo de MTBF (tempo médio entre falhas).
- Agendamento automático de preventivas.
- Persistência real em banco de dados (ver DT-01 em `docs/debitos-tecnicos`).
- Autenticação/autorização.
- Testes automatizados e pipeline de CI/CD (ver DT-03 e DT-07).

## 3. Como rodar e onde mexer

Ver `README.md` na raiz do repositório para instruções de execução.

Pontos de extensão sugeridos para a N2:

- `backend/src/db/memoryDb.js` → trocar por client de banco real (ex.:
  Prisma + PostgreSQL), mantendo a mesma assinatura das funções em
  `chamadoService.js` para minimizar o blast radius da migração.
- `chamadoService.js` → adicionar `TrocaPeca` e o cálculo de MTBF como novo
  módulo de serviço (`mtbfService.js`), consumindo o histórico de
  `chamados` por `equipamentoId`.
- Rotas novas ficam em `backend/src/routes/`, seguindo o padrão de
  `asHandler` já existente para tratamento de erros de RN.

## 4. Débitos técnicos herdados

Ver lista completa e priorizada em `docs/debitos-tecnicos/debitos-tecnicos.md`.
Recomenda-se avaliar DT-01, DT-03 e DT-07 antes de iniciar a N2, pois
impactam diretamente a confiabilidade do cálculo de MTBF.

## 5. Contatos / papéis na N1

Ver seção "Papéis da equipe" no `README.md` e o detalhamento de
contribuições em `Matriz_de_Papeis_N1.docx`.

## 6. Critério sugerido de avaliação de viabilidade

Ao decidir se recebe o projeto, a próxima equipe deve considerar:

- [ ] O código roda localmente seguindo o README, sem passos faltando?
- [ ] A RN crítica está de fato implementada e testável?
- [ ] Os débitos técnicos são aceitáveis para o próximo ciclo, ou algum
      deles precisa ser pago antes de novas features (ex.: trocar
      persistência antes de implementar MTBF)?
- [ ] A cobertura de testes é suficiente para evoluir com segurança?
