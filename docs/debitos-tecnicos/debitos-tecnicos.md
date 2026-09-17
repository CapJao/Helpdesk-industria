# Registro de Débitos Técnicos — N1

Política (conforme Acordo de Manutenibilidade, seção 2): todo atalho técnico
assumido durante o desenvolvimento é registrado aqui e como issue no board da
equipe. 15% do esforço de cada ciclo é reservado para liquidação de débitos;
débitos que afetem segurança, desempenho ou o trabalho de outro membro têm
prioridade máxima no ciclo seguinte.

| ID | Débito | Motivo do atalho na N1 | Impacto se não pago | Prioridade | Responsável pelo pagamento |
|---|---|---|---|---|---|
| DT-01 | Persistência em memória (`memoryDb.js`) em vez de banco relacional real | Acelerar entrega do escopo funcional da N1 sem custo de infraestrutura de banco | Dados perdidos a cada restart; inviabiliza histórico de peças e MTBF da N2 | Alta | Dev Backend + DevOps |
| DT-02 | Sem autenticação/autorização de usuários | N1 não exigia controle de acesso por perfil | Qualquer usuário pode atribuir/concluir chamados de qualquer técnico | Média | Dev Backend |
| DT-03 | Sem testes automatizados (unitários/integração) no repositório | Foco do ciclo em fechar o fluxo funcional fim a fim | Regressões na RN crítica podem passar despercebidas em mudanças futuras | Alta | QA + Dev Backend |
| DT-04 | Frontend sem framework/build (HTML/JS puro) | Reduzir tempo de setup e permitir avaliação sem passo de build | Difícil escalar telas conforme a N2/N3 cresce em complexidade | Média | Dev Frontend |
| DT-05 | Sem paginação nas listagens (`/api/chamados`, `/api/equipamentos`) | Volume de dados baixo na N1 | Degradação de performance com parque fabril grande | Baixa | Dev Backend |
| DT-06 | Sem validação de schema (ex.: Zod/Joi) nas rotas, apenas checagens manuais no service | Ganhar velocidade nas primeiras entregas | Mensagens de erro inconsistentes; risco de payloads malformados quebrarem o service | Média | Dev Backend |
| DT-07 | Sem CI/CD configurado (lint/test automático em PR) | Pipeline ainda não definido pela equipe no início da N1 | PRs podem ser aprovados sem verificação automática (viola item 6.3 do Acordo) | Alta | DevOps |

## Como registrar novos débitos

1. Abrir issue/card do tipo **Débito Técnico** no board da equipe.
2. Preencher: débito, motivo, impacto, prioridade sugerida.
3. Replicar a linha nesta tabela na próxima atualização do handoff.
