-- PR-05 (executar manualmente no SQL Editor do Supabase)
-- Adiciona a coluna status na tabela oficinas apenas se ainda nao existir.

ALTER TABLE public.oficinas
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente';

-- Opcional: garantir que valores fora do fluxo nao sejam aceitos.
-- ALTER TABLE public.oficinas
-- ADD CONSTRAINT oficinas_status_check
-- CHECK (status IN ('pendente', 'aprovado', 'rejeitado'));
