-- Schema inicial: substitui o banco em memória da N1 (DT-01).
-- Valores de domínio ficam em CHECK para o banco recusar o que o service deixar passar.

CREATE TABLE setores (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (length(trim(nome)) > 0)
);

CREATE TABLE equipamentos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome              text NOT NULL CHECK (length(trim(nome)) > 0),
  setor_id          uuid NOT NULL REFERENCES setores (id),
  codigo_patrimonio text
);

CREATE TABLE tecnicos (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome      text NOT NULL,
  matricula text NOT NULL UNIQUE
);

CREATE TABLE chamados (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid NOT NULL REFERENCES equipamentos (id),
  tecnico_id     uuid REFERENCES tecnicos (id),
  urgencia       text NOT NULL CHECK (urgencia IN ('Alta', 'Media', 'Baixa')),
  tipo           text NOT NULL DEFAULT 'Corretiva' CHECK (tipo IN ('Corretiva', 'Preventiva')),
  status         text NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto', 'Em Andamento', 'Concluído')),
  descricao      text NOT NULL DEFAULT '',
  laudo          text,
  causa_raiz     text,
  pecas_trocadas text,
  criado_em      timestamptz NOT NULL DEFAULT now(),
  atribuido_em   timestamptz,
  finalizado_em  timestamptz,
  -- Alvo da FK composta de trocas_peca: garante que a troca aponta para o
  -- mesmo equipamento do chamado.
  UNIQUE (id, equipamento_id)
);

-- RN crítica: contagem de chamados abertos por técnico.
CREATE INDEX chamados_tecnico_status_idx ON chamados (tecnico_id, status);
-- Histórico e MTBF por equipamento (N2).
CREATE INDEX chamados_equipamento_criado_idx ON chamados (equipamento_id, criado_em);

-- Trocas de peça vinculadas ao chamado e ao equipamento (FR-12/FR-13).
CREATE TABLE trocas_peca (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id     uuid NOT NULL,
  equipamento_id uuid NOT NULL REFERENCES equipamentos (id),
  peca_nome      text NOT NULL CHECK (length(trim(peca_nome)) BETWEEN 1 AND 100),
  quantidade     integer NOT NULL DEFAULT 1 CHECK (quantidade >= 1),
  observacao     text CHECK (length(observacao) <= 500),
  registrado_em  timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (chamado_id, equipamento_id) REFERENCES chamados (id, equipamento_id)
);

CREATE INDEX trocas_peca_equipamento_idx ON trocas_peca (equipamento_id, registrado_em DESC);

CREATE VIEW tecnicos_com_carga AS
SELECT
  t.id,
  t.nome,
  t.matricula,
  (
    SELECT count(*)::int
    FROM chamados c
    WHERE c.tecnico_id = t.id
      AND c.urgencia = 'Alta'
      AND c.status IN ('Aberto', 'Em Andamento')
  ) AS chamados_alta_abertos
FROM tecnicos t;
