-- PR-14.1: permitir solicitacao de onboarding publica (anon/authenticated)
-- Necessario para o fluxo "SOLICITAR CHECKAUTO" na tela de login.

ALTER TABLE public.oficinas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public onboarding insert oficinas" ON public.oficinas;
CREATE POLICY "Public onboarding insert oficinas"
ON public.oficinas
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL
  AND email IS NOT NULL
  AND (
    status IS NULL OR status IN ('pendente', 'aprovado')
  )
);
