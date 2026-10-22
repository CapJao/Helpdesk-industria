# Contrato: trocas de peça e histórico por equipamento

- **Status:** acordado e implementado (frontend no PR #6, backend no PR seguinte)
- **Data:** 2026-10-22
- **Relacionado:** FR-12, FR-13, DT-01

As trocas ficam em `trocas_peca`, ligada ao chamado e ao equipamento. A
conclusão e as trocas são gravadas na mesma transação.

## 1. Concluir chamado com trocas

`PATCH /api/chamados/:id/concluir`

As peças trocadas vão como a lista estruturada `trocas` (o texto livre
`pecasTrocadas` continua aceito; ver "Campo legado" abaixo).

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
- `422`: peça sem nome ou com mais de 100 caracteres, quantidade fora de
  1 a 2147483647, observação com mais de 500 caracteres ou chamado já concluído. Nesse
  caso **nada é gravado**: o chamado continua aberto e nenhuma troca é salva.
- `404`: chamado inexistente.

**Ordem das trocas:** as trocas do chamado voltam na ordem em que foram
enviadas.

**Campo legado `pecasTrocadas`:** o modal envia `trocas` e também um resumo em
texto (`"2 × Rolamento 6205; 1 × Correia"`), e o backend grava os dois. O card
mostra `trocas` quando a lista existe e cai no texto só para chamados antigos.
O campo continua no contrato até a integração ser confirmada em uso; a remoção
fica para depois.

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

## Decisões de interface

1. **Modal de conclusão:** o texto livre virou uma lista de peças (nome,
   quantidade e observação opcional), com botões de adicionar e remover. Dá
   para concluir sem peças.
2. **Histórico:** modal aberto pelo botão "Histórico de peças" no card do
   equipamento, no Parque Fabril.
3. **Card do chamado concluído:** mostra as trocas como lista.
4. **Causa raiz:** continua texto livre no backend, sem validação de lista. As
   opções ficam só no `<select>` do modal. Revisitar se o MTBF ou algum
   relatório precisar agrupar falhas por causa; nesse caso, o backend passa a
   validar a lista e a devolver as opções num `GET`.

## Fora deste contrato

O MTBF (FR-14) não faz parte desta entrega e entra como etapa própria.

## Diferenças em relação ao `spec.md`

- A spec previa registrar a troca **durante o atendimento**
  (`POST /chamados/:id/pecas`). Esta proposta grava as trocas **na conclusão**,
  junto do laudo e na mesma transação. Assim o técnico preenche tudo num lugar
  só, e não sobra troca registrada num chamado que nunca foi fechado.
- A spec guardava `registradoPorId` (quem registrou). Isso depende do login
  (FR-08 a FR-11) e entra quando a autenticação existir. Até lá, o técnico do
  chamado aparece no histórico.
