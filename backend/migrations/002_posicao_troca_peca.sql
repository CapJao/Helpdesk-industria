-- Trocas da mesma conclusão têm o mesmo registrado_em (now() da transação).
-- A posição guarda a ordem em que o técnico listou as peças.
ALTER TABLE trocas_peca ADD COLUMN posicao integer NOT NULL DEFAULT 1 CHECK (posicao >= 1);
