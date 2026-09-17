# Modelo de Dados (DER) — Helpdesk de Manutenção Industrial

## Escopo N1 (implementado)

```mermaid
erDiagram
    SETOR ||--o{ EQUIPAMENTO : possui
    EQUIPAMENTO ||--o{ CHAMADO : gera
    TECNICO ||--o{ CHAMADO : atende

    SETOR {
        uuid id PK
        string nome
    }
    EQUIPAMENTO {
        uuid id PK
        string nome
        uuid setorId FK
        string codigoPatrimonio
    }
    TECNICO {
        uuid id PK
        string nome
        string matricula
    }
    CHAMADO {
        uuid id PK
        uuid equipamentoId FK
        uuid tecnicoId FK "nullable ate a atribuicao"
        string urgencia "Alta | Media | Baixa"
        string tipo "Corretiva | Preventiva"
        string status "Aberto | Em Andamento | Concluido"
        string descricao
        datetime criadoEm
        datetime atribuidoEm
        datetime finalizadoEm
    }
```

### Regra de negócio crítica representada no modelo

`CHAMADO.urgencia = 'Alta' AND CHAMADO.status IN ('Aberto','Em Andamento')`
agrupado por `tecnicoId` não pode ultrapassar **2 registros simultâneos**.
Na N1 essa contagem é feita em memória (`contarChamadosAltaAbertos`); em
produção, com banco relacional, isso deveria virar uma constraint de
aplicação (transação) ou um `CHECK`/trigger, pois SQL puro não expressa bem
"no máximo N linhas relacionadas" via constraint declarativa simples.

## Visão de evolução N2/N3 (não implementada nesta entrega)

```mermaid
erDiagram
    EQUIPAMENTO ||--o{ CHAMADO : gera
    CHAMADO ||--o{ TROCA_PECA : registra
    EQUIPAMENTO ||--o{ TROCA_PECA : sofre
    EQUIPAMENTO ||--o{ AGENDAMENTO_PREVENTIVA : possui

    TROCA_PECA {
        uuid id PK
        uuid chamadoId FK
        uuid equipamentoId FK
        string pecaNome
        date dataTroca
    }
    AGENDAMENTO_PREVENTIVA {
        uuid id PK
        uuid equipamentoId FK
        date proximaData
        int periodicidadeDias
        string origem "manual | calculo-mtbf"
    }
```

- **MTBF (Tempo Médio Entre Falhas)** = soma dos intervalos entre falhas
  corretivas consecutivas do mesmo equipamento / número de falhas no
  período. Requer histórico consistente de `CHAMADO` por `EQUIPAMENTO`
  (já suportado pela FK `equipamentoId` desde a N1).
- **Agendamento automático de preventivas** consome o MTBF calculado para
  sugerir `proximaData` em `AGENDAMENTO_PREVENTIVA`.
