-- PR-14: SAAS completo com onboarding, planos e trial popup persuasivo

CREATE TABLE IF NOT EXISTS public.planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  preco decimal(10,2) NOT NULL DEFAULT 0,
  features text[] NOT NULL DEFAULT '{}',
  trial_dias int NOT NULL DEFAULT 0
);

INSERT INTO public.planos (nome, preco, features, trial_dias)
VALUES
  ('TRIAL', 0, ARRAY['Checklist básico','1 usuário'], 15),
  ('MENSAL', 99.90, ARRAY['Tudo ilimitado','Relatórios PRO'], 0),
  ('ANUAL', 999.90, ARRAY['Tudo + suporte','Economia R$197! 🔥'], 0)
ON CONFLICT (nome) DO UPDATE
SET preco = EXCLUDED.preco,
    features = EXCLUDED.features,
    trial_dias = EXCLUDED.trial_dias;

ALTER TABLE public.oficinas
  ADD COLUMN IF NOT EXISTS plano_id uuid REFERENCES public.planos(id),
  ADD COLUMN IF NOT EXISTS plano_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_fim date;

UPDATE public.oficinas
SET plano_status = COALESCE(plano_status, 'trial')
WHERE plano_status IS NULL;
