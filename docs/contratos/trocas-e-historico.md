# Contrato: trocas de peça e histórico por equipamento

- **Status:** proposta, aguardando o frontend
- **Data:** 2026-10-22
- **Relacionado:** FR-12, FR-13, DT-01

O banco já guarda as trocas (`trocas_peca`, ligada ao chamado e ao
equipamento), e o backend já grava a conclusão e as trocas na mesma transação.
**Nenhuma rota abaixo existe ainda.** Elas só serão implementadas depois que o
frontend concordar com este formato, ou propuser outro.

Até lá, a conclusão continua aceitando `pecasTrocadas` como texto livre, como
o modal faz hoje.

## 1. Concluir chamado com trocas

`PATCH /api/chamados/:id/concluir`

O que muda: entra a lista `trocas` no lugar do texto livre `pecasTrocadas`.

```json
{
  "laudo": "Rolamento do eixo principal substituído.",
  "causaRaiz": "Desgaste Natural / Fim de vida útil",
  "trocas": [
    { "pecaNome": "Rolamento 6205", "quantidade": 2 },
    { "pecaNome": "Correia em V", "observacao": "Tensionada após a troca" }
  ]
}
```

| Campo | Obrigatório | Regra |
|---|---|---|
| `trocas` | não | lista; pode ser vazia ou ausente quando nada foi trocado |
| `trocas[].pecaNome` | sim | 1 a 100 caracteres |
| `trocas[].quantidade` | não | inteiro a partir de 1; padrão `1` |
| `trocas[].observacao` | não | até 500 caracteres |

**Resposta `200`:** o `Chamado` de sempre, com as trocas gravadas:

```ts
interface TrocaPeca {
  id: string;
  pecaNome: string;
  quantidade: number;
  observacao: string | null;
  registradoEm: string; // ISO 8601
}

interface Chamado {
  // ...campos atuais
  trocas: TrocaPeca[]; // [] quando não houve troca
}
```

**Erros** (corpo `{ "erro": "mensagem" }`):
- `422`: peça sem nome, quantidade menor que 1 ou chamado já concluído. Nesse
  caso **nada é gravado**: o chamado continua aberto e nenhuma troca é salva.
- `404`: chamado inexistente.

**Transição de `pecasTrocadas`:** o backend continua aceitando o texto livre
enquanto o front migra. Depois que o modal enviar `trocas`, o campo sai do
contrato.

## 2. Histórico de peças por equipamento

`GET /api/equipamentos/:id/pecas`

Lista as trocas daquele equipamento, **da mais recente para a mais antiga**,
com o chamado de origem e o técnico.

```ts
interface TrocaHistorico {
  id: string;
  pecaNome: string;
  quantidade: number;
  observacao: string | null;
  registradoEm: string;
  chamado: {
    id: string;
    tipo: 'Corretiva' | 'Preventiva';
    urgencia: 'Alta' | 'Media' | 'Baixa';
    causaRaiz: string | null;
    finalizadoEm: string;
  };
  tecnico: { id: string; nome: string } | null;
}
```

**Respostas:**
- `200` com `TrocaHistorico[]`. Equipamento sem trocas → `[]` (a tela mostra
  "Nenhuma troca registrada", como pede o FR-13).
- `404` para equipamento inexistente.

## Perguntas para o frontend

1. **Modal de conclusão:** dá para trocar o campo de texto "Peças trocadas" por
   uma lista de linhas (nome + quantidade, com botão de adicionar e remover)?
2. **Onde mostrar o histórico:** um modal aberto a partir da linha do
   equipamento em `EquipmentsView`, ou uma tela própria?
3. **Card do chamado concluído:** mostrar as trocas como lista no lugar do
   texto `Peças: ...`?
4. **Causa raiz:** hoje é uma lista fixa no modal. Querem que o backend valide
   essa lista (e devolva as opções num `GET`), ou ela continua livre?

## Diferenças em relação ao `spec.md`

- A spec previa registrar a troca **durante o atendimento**
  (`POST /chamados/:id/pecas`). Esta proposta grava as trocas **na conclusão**,
  junto do laudo e na mesma transação. Assim o técnico preenche tudo num lugar
  só, e não sobra troca registrada num chamado que nunca foi fechado.
- A spec guardava `registradoPorId` (quem registrou). Isso depende do login
  (FR-08 a FR-11) e entra quando a autenticação existir. Até lá, o técnico do
  chamado aparece no histórico.
