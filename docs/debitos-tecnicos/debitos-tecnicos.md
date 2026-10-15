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
| DT-03 | Cobertura automatizada restrita à RN crítica (atribuição de chamados Alta) | Priorizar a regra de negócio crítica na implantação inicial do CI | Outros fluxos ainda podem regredir sem detecção automatizada | Alta | QA + Dev Backend |
| DT-04 | Frontend sem framework/build (HTML/JS puro) | Reduzir tempo de setup e permitir avaliação sem passo de build | Difícil escalar telas conforme a N2/N3 cresce em complexidade | Média | Dev Frontend |
| DT-05 | Sem paginação nas listagens (`/api/chamados`, `/api/equipamentos`) | Volume de dados baixo na N1 | Degradação de performance com parque fabril grande | Baixa | Dev Backend |
| DT-06 | Sem validação de schema (ex.: Zod/Joi) nas rotas, apenas checagens manuais no service | Ganhar velocidade nas primeiras entregas | Mensagens de erro inconsistentes; risco de payloads malformados quebrarem o service | Média | Dev Backend |
| DT-07 | CI básico configurado; ainda sem lint ou deploy contínuo | Começar com instalação reproduzível e testes automatizados da RN crítica | Fluxos não cobertos e publicação continuam sem automação | Média | DevOps |

## Como registrar novos débitos

1. Abrir issue/card do tipo **Débito Técnico** no board da equipe.
2. Preencher: débito, motivo, impacto, prioridade sugerida.
3. Replicar a linha nesta tabela na próxima atualização do handoff.
