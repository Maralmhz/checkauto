-- PR-16: Funcionários com Login e Controle de Acesso por Plano
-- Executado em: 2026-03-19
--
-- O que esta PR faz:
--   1. Adiciona coluna `cargo` na tabela usuarios
--      (ex: Técnico, Pintor, Lanterneiro, Funileiro, Eletricista, Auxiliar)
--   2. Garante que a coluna `role` suporte o valor 'funcionario'
--      (valores válidos: superadmin, admin, funcionario)
--   3. Adiciona coluna `max_usuarios` na tabela oficinas
--      derivada automaticamente do plano:
--        TRIAL  → 1 (só o dono)
--        MENSAL → 2 (dono + 1 funcionário)
--        ANUAL  → 6 (dono + 5 funcionários)
--   4. Cria função + trigger para manter max_usuarios sincronizado com plano

-- ============================================
-- 1. COLUNA cargo NA TABELA usuarios
-- ============================================
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cargo text DEFAULT 'Técnico';

COMMENT ON COLUMN usuarios.cargo IS
  'Cargo/função do funcionário na oficina. Ex: Técnico, Pintor, Lanterneiro, Funileiro, Eletricista, Auxiliar';

-- ============================================
-- 2. COLUNA max_usuarios NA TABELA oficinas
-- ============================================
ALTER TABLE oficinas ADD COLUMN IF NOT EXISTS max_usuarios integer DEFAULT 1;

COMMENT ON COLUMN oficinas.max_usuarios IS
  'Máximo de usuários permitidos: TRIAL=1, MENSAL=2, ANUAL=6';

-- Sincroniza registros existentes com o plano atual
UPDATE oficinas SET max_usuarios =
  CASE
    WHEN UPPER(plano) = 'ANUAL'  THEN 6
    WHEN UPPER(plano) = 'MENSAL' THEN 2
    ELSE 1  -- TRIAL e qualquer outro
  END;

-- ============================================
-- 3. TRIGGER: atualiza max_usuarios ao mudar plano
-- ============================================
CREATE OR REPLACE FUNCTION sync_max_usuarios_por_plano()
RETURNS TRIGGER AS $$
BEGIN
  NEW.max_usuarios :=
    CASE
      WHEN UPPER(NEW.plano) = 'ANUAL'  THEN 6
      WHEN UPPER(NEW.plano) = 'MENSAL' THEN 2
      ELSE 1
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_max_usuarios ON oficinas;
CREATE TRIGGER trg_sync_max_usuarios
  BEFORE INSERT OR UPDATE OF plano ON oficinas
  FOR EACH ROW
  EXECUTE FUNCTION sync_max_usuarios_por_plano();

-- ============================================
-- 4. ÍNDICE para consultas por oficina + role
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuarios_oficina_role
  ON usuarios(oficina_id, role);

-- ============================================
-- REFERÊNCIA: estrutura atual da tabela usuarios
-- ============================================
-- id                uuid        PK
-- nome              text        NOT NULL
-- email             text
-- role              text        (superadmin | admin | funcionario)
-- oficina_id        uuid        FK → oficinas(id)
-- cpf               text
-- telefone          text
-- comissao          numeric     default 0
-- cargo             text        default 'Técnico'   ← NOVO
-- primeiro_acesso   boolean     default true
-- created_at        timestamptz default now()
--
-- REFERÊNCIA: estrutura atual da tabela oficinas
-- ============================================
-- id                uuid        PK
-- nome              text        NOT NULL
-- plano             text        (TRIAL | MENSAL | ANUAL)
-- max_usuarios      integer     default 1           ← NOVO
-- status            text        (trial | ativo | vencido)
-- trial_ate         timestamptz
-- ... demais campos (ver PR-15)
