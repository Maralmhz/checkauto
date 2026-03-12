-- PR-12
-- Configuracoes de white-label por oficina + storage de logo no bucket logos

ALTER TABLE public.oficinas
  ADD COLUMN IF NOT EXISTS nome_exibicao text,
  ADD COLUMN IF NOT EXISTS cor_primaria text DEFAULT '#27ae60',
  ADD COLUMN IF NOT EXISTS rodape_pdf text DEFAULT 'Obrigado pela preferencia!',
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Opcional: valida hex #RRGGBB
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'oficinas_cor_primaria_hex_check'
  ) THEN
    ALTER TABLE public.oficinas
      ADD CONSTRAINT oficinas_cor_primaria_hex_check
      CHECK (cor_primaria ~ '^#[0-9A-Fa-f]{6}$');
  END IF;
END $$;

-- Bucket deve ser criado no painel/storage com nome "logos"
-- Caminho padrao adotado pelo app: logos/{oficina_id}.png
