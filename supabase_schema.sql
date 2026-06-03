-- ============================================================
--  FrotaApp — Script completo do banco de dados (Supabase)
--  Execute este SQL no Supabase → SQL Editor → New Query
-- ============================================================

-- ── 1. CONDUTORES ─────────────────────────────────────────
CREATE TABLE condutores (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome          TEXT NOT NULL,
  email         TEXT UNIQUE, -- usado no Supabase Auth
  tipo_veiculo  TEXT NOT NULL CHECK (tipo_veiculo IN ('Carro','Moto')),
  marca_veiculo TEXT NOT NULL,
  placa         TEXT NOT NULL UNIQUE,
  cor_veiculo   TEXT,
  km_inicial    INTEGER NOT NULL DEFAULT 0,
  data_entrega  DATE,
  situacao_veiculo TEXT CHECK (situacao_veiculo IN ('Novo','Semi-novo')) DEFAULT 'Novo',
  cnh_numero    TEXT,
  cnh_categoria TEXT,
  cnh_vencimento DATE,
  cnh_pontos    INTEGER DEFAULT 0,
  is_admin      BOOLEAN DEFAULT FALSE,
  ativo         BOOLEAN DEFAULT TRUE,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. REGISTRO DE KM DIÁRIO ──────────────────────────────
CREATE TABLE km_diario (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id   UUID REFERENCES condutores(id) ON DELETE CASCADE,
  data          DATE NOT NULL,
  km_inicial    INTEGER NOT NULL,
  km_final      INTEGER,
  km_percorrido INTEGER GENERATED ALWAYS AS (km_final - km_inicial) STORED,
  destino       TEXT,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. ABASTECIMENTOS ─────────────────────────────────────
CREATE TABLE abastecimentos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id     UUID REFERENCES condutores(id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  tipo_combustivel TEXT NOT NULL CHECK (tipo_combustivel IN ('Gasolina','Etanol','Diesel')),
  litros          NUMERIC(8,2) NOT NULL,
  preco_litro     NUMERIC(8,2) NOT NULL,
  valor_total     NUMERIC(10,2) GENERATED ALWAYS AS (litros * preco_litro) STORED,
  km_abastecimento INTEGER NOT NULL,
  posto           TEXT,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. TROCA DE ÓLEO ──────────────────────────────────────
CREATE TABLE trocas_oleo (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id     UUID REFERENCES condutores(id) ON DELETE CASCADE,
  data            DATE NOT NULL,
  km_troca        INTEGER NOT NULL,
  km_proxima      INTEGER,
  tipo_oleo       TEXT NOT NULL,
  quantidade_litros NUMERIC(5,2),
  valor           NUMERIC(10,2),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. MANUTENÇÕES ────────────────────────────────────────
CREATE TABLE manutencoes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id     UUID REFERENCES condutores(id) ON DELETE CASCADE,
  tipo_reparo     TEXT NOT NULL, -- Pneu, Baú, Antena, Relação, Lâmpada, Pastilha de freio, Outro
  descricao_outro TEXT, -- preenchido quando tipo_reparo = 'Outro'
  tipo_manutencao TEXT CHECK (tipo_manutencao IN ('Preventiva','Corretiva','Revisão','Emergencial')),
  data_servico    DATE NOT NULL,
  km_reparo       INTEGER,
  oficina         TEXT,
  valor_total     NUMERIC(10,2),
  data_pagamento  DATE,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('Pix','Dinheiro','Débito','Crédito','Boleto','A prazo')),
  pecas_materiais TEXT,
  observacoes     TEXT,
  status_pagamento TEXT DEFAULT 'Pendente' CHECK (status_pagamento IN ('Pago','Pendente')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 6. LAUDOS DE VISTORIA ─────────────────────────────────
CREATE TABLE vistorias (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id     UUID REFERENCES condutores(id) ON DELETE CASCADE,
  data_vistoria   DATE NOT NULL,
  vistoriador     TEXT,
  km_vistoria     INTEGER,
  resultado       TEXT CHECK (resultado IN ('Aprovado','Aprovado com ressalvas','Reprovado')),
  observacoes     TEXT,
  proxima_vistoria DATE,
  arquivo_url     TEXT, -- URL do arquivo no Supabase Storage
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── 7. DOCUMENTOS DO VEÍCULO (admin) ──────────────────────
CREATE TABLE documentos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condutor_id     UUID REFERENCES condutores(id) ON DELETE CASCADE,
  tipo_documento  TEXT NOT NULL, -- IPVA, Seguro obrigatório, Seguro opcional, CRLV, etc.
  vencimento      DATE NOT NULL,
  valor_pago      NUMERIC(10,2),
  operadora       TEXT,
  numero_apolice  TEXT,
  alertar_dias    INTEGER DEFAULT 30, -- alertar X dias antes
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
--  ROW LEVEL SECURITY (RLS) — cada condutor vê só seus dados
-- ============================================================

ALTER TABLE km_diario      ENABLE ROW LEVEL SECURITY;
ALTER TABLE abastecimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trocas_oleo    ENABLE ROW LEVEL SECURITY;
ALTER TABLE manutencoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vistorias      ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE condutores     ENABLE ROW LEVEL SECURITY;

-- Condutores: vê só o próprio registro; admin vê todos
CREATE POLICY "condutor_ver_proprio" ON condutores
  FOR SELECT USING (
    email = auth.email()
    OR EXISTS (
      SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE
    )
  );

CREATE POLICY "admin_gerenciar_condutores" ON condutores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
  );

-- Macro para tabelas operacionais: condutor vê só os seus, admin vê todos
CREATE POLICY "km_condutor" ON km_diario FOR ALL USING (
  condutor_id = (SELECT id FROM condutores WHERE email = auth.email())
  OR EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);
CREATE POLICY "abast_condutor" ON abastecimentos FOR ALL USING (
  condutor_id = (SELECT id FROM condutores WHERE email = auth.email())
  OR EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);
CREATE POLICY "oleo_condutor" ON trocas_oleo FOR ALL USING (
  condutor_id = (SELECT id FROM condutores WHERE email = auth.email())
  OR EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);
CREATE POLICY "manut_condutor" ON manutencoes FOR ALL USING (
  condutor_id = (SELECT id FROM condutores WHERE email = auth.email())
  OR EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);
CREATE POLICY "vist_condutor" ON vistorias FOR ALL USING (
  condutor_id = (SELECT id FROM condutores WHERE email = auth.email())
  OR EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);
CREATE POLICY "doc_admin" ON documentos FOR ALL USING (
  EXISTS (SELECT 1 FROM condutores WHERE email = auth.email() AND is_admin = TRUE)
);

-- ============================================================
--  STORAGE — bucket para laudos de vistoria
-- ============================================================
-- Execute no Supabase → Storage → New Bucket → nome: "laudos"
-- Marcar como: Private
-- Depois adicione esta policy:

-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES (
--   'condutor_upload_laudo',
--   'laudos',
--   'INSERT',
--   'auth.uid() IS NOT NULL'
-- );

-- ============================================================
--  DADOS INICIAIS — admin padrão
--  ⚠️  Crie o usuário no Supabase Auth ANTES de rodar isso
--  Authentication → Users → Invite user → admin@suaempresa.com
-- ============================================================

-- INSERT INTO condutores (nome, email, tipo_veiculo, marca_veiculo, placa, is_admin)
-- VALUES ('Administrador', 'admin@suaempresa.com', 'Carro', '—', 'ADM-0000', TRUE);
