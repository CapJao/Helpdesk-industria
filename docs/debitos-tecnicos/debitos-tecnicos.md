# Registro de Débitos Técnicos — N1

Política (conforme Acordo de Manutenibilidade, seção 2): todo atalho técnico
assumido durante o desenvolvimento é registrado aqui e como issue no board da
equipe. 15% do esforço de cada ciclo é reservado para liquidação de débitos;
débitos que afetem segurança, desempenho ou o trabalho de outro membro têm
prioridade máxima no ciclo seguinte.

| ID | Débito | Motivo do atalho na N1 | Impacto se não pago | Prioridade | Responsável pelo pagamento |
|---|---|---|---|---|---|
| DT-01 | Persistência em memória (`memoryDb.js`) em vez de banco relacional real — quitado com PostgreSQL (`embedded-postgres` local, migrations em `backend/migrations`) | Acelerar entrega do escopo funcional da N1 sem custo de infraestrutura de banco | Débito resolvido; dados persistem e a RN crítica roda em transação com lock | Quitado | Dev Backend |
| DT-02 | Sem autenticação/autorização de usuários | N1 não exigia controle de acesso por perfil | Qualquer usuário pode atribuir/concluir chamados de qualquer técnico | Média | Dev Backend |
| DT-03 | Cobertura automatizada limitada à RN crítica do backend | Priorizar a regra de negócio crítica na implantação inicial do CI | Regressões nos demais endpoints e fluxos da interface podem passar despercebidas | Alta | QA + Dev Backend |
| DT-04 | Frontend sem framework/build (HTML/JS puro) — quitado com React, TypeScript e Vite | Simplificar a entrega inicial da N1; atualizado na evolução do frontend | Débito resolvido; frontend agora possui build e lint | Quitado | Dev Frontend |
| DT-05 | Sem paginação nas listagens (`/api/chamados`, `/api/equipamentos`) | Volume de dados baixo na N1 | Degradação de performance com parque fabril grande | Baixa | Dev Backend |
| DT-06 | Sem validação de schema (ex.: Zod/Joi) nas rotas, apenas checagens manuais no service | Ganhar velocidade nas primeiras entregas | Mensagens de erro inconsistentes; risco de payloads malformados quebrarem o service | Média | Dev Backend |
| DT-07 | CI configurado para testes do backend e lint/build do frontend; sem deploy contínuo (CD) | Implantação inicial priorizou validações automatizadas antes de definir hospedagem | Publicação das versões ainda depende de processo manual | Média | DevOps |

## Como registrar novos débitos

1. Abrir issue/card do tipo **Débito Técnico** no board da equipe.
2. Preencher: débito, motivo, impacto, prioridade sugerida.
3. Replicar a linha nesta tabela na próxima atualização do handoff.
