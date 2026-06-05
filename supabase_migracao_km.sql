-- ============================================================
--  MIGRAÇÃO — Suporte ao fluxo de jornada (saída + chegada)
--  Execute no Supabase → SQL Editor
-- ============================================================

-- A tabela km_diario já existe, mas a coluna km_percorrido
-- é GENERATED e não aceita km_final nulo. Precisamos recriar
-- a coluna como calculada via view ou usar uma função.
-- A solução mais simples: remover a coluna gerada e recalcular na query.

-- 1. Remova a coluna gerada (se existir)
ALTER TABLE km_diario DROP COLUMN IF EXISTS km_percorrido;

-- 2. Adicione index para busca de jornadas em aberto
CREATE INDEX IF NOT EXISTS idx_km_diario_em_aberto
  ON km_diario (condutor_id, km_final)
  WHERE km_final IS NULL;

-- 3. (Opcional) View com km_percorrido calculado
CREATE OR REPLACE VIEW km_diario_view AS
SELECT
  *,
  CASE WHEN km_final IS NOT NULL THEN km_final - km_inicial ELSE NULL END AS km_percorrido
FROM km_diario;

-- Pronto! O app agora:
-- - Insere com km_final = NULL ao registrar saída
-- - Atualiza km_final ao encerrar a jornada
