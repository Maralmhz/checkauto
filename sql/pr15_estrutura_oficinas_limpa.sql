-- PR-15: Documentacao da estrutura final da tabela oficinas
-- Executado em: 2026-03-18
-- Campos removidos nesta limpeza:
--   trial_fim      (duplicava trial_ate)
--   nomeexibicao   (duplicava nome_exibicao)
--   plano_id       (nunca utilizado)
--   plano_status   (duplicava plano)
--
-- Policies removidas e recriadas sem dependencia de plano_status:
--   onboarding_public_insert
--   onboarding_trial_insert

-- ============================================
-- ESTRUTURA ATUAL DA TABELA oficinas
-- ============================================
-- id                 uuid        PK, default uuid_generate_v4()
-- nome               text        NOT NULL
-- responsavel        text
-- email              text
-- whatsapp           text
-- telefone           text
-- telefone2          text
-- telefone_whatsapp  boolean     default false
-- telefone2_whatsapp boolean     default false
-- cnpj               text        (obrigatorio no cadastro via app)
-- endereco           text
-- site               text
-- status             text        NOT NULL, default 'trial'
-- plano              text        default 'Free'  (valores: TRIAL, MENSAL, ANUAL)
-- trial_ate          timestamptz default now() + 15 days
-- aprovado_em        timestamptz
-- aprovado_por       uuid
-- criado_em          timestamptz default now()
-- atualizado_em      timestamptz default now()
-- nome_exibicao      text
-- subtitulo          text        default 'Sistema de Gestao'
-- cor_primaria       text        default '#27ae60'
-- rodape_pdf         text        default 'Obrigado pela preferencia!'
-- logo_url           text

-- ============================================
-- POLICY DE ONBOARDING (sem plano_status)
-- ============================================
DROP POLICY IF EXISTS "Public onboarding insert oficinas" ON public.oficinas;
CREATE POLICY "Public onboarding insert oficinas"
ON public.oficinas
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nome IS NOT NULL
  AND email IS NOT NULL
  AND (status IS NULL OR status IN ('pendente', 'aprovado'))
);
