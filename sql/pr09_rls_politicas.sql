-- PR-09: RLS por oficina_id

-- ENABLE RLS em todas as tabelas funcionais
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_receber ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- Limpeza preventiva de politicas antigas (idempotente)
DROP POLICY IF EXISTS "Oficina users read" ON clientes;
DROP POLICY IF EXISTS "Oficina users insert" ON clientes;
DROP POLICY IF EXISTS "Oficina users update" ON clientes;
DROP POLICY IF EXISTS "Oficina users delete" ON clientes;
DROP POLICY IF EXISTS "Superadmin full access" ON clientes;

DROP POLICY IF EXISTS "Oficina users read" ON veiculos;
DROP POLICY IF EXISTS "Oficina users insert" ON veiculos;
DROP POLICY IF EXISTS "Oficina users update" ON veiculos;
DROP POLICY IF EXISTS "Oficina users delete" ON veiculos;
DROP POLICY IF EXISTS "Superadmin full access" ON veiculos;

DROP POLICY IF EXISTS "Oficina users read" ON ordens_servico;
DROP POLICY IF EXISTS "Oficina users insert" ON ordens_servico;
DROP POLICY IF EXISTS "Oficina users update" ON ordens_servico;
DROP POLICY IF EXISTS "Oficina users delete" ON ordens_servico;
DROP POLICY IF EXISTS "Superadmin full access" ON ordens_servico;

DROP POLICY IF EXISTS "Oficina users read" ON agendamentos;
DROP POLICY IF EXISTS "Oficina users insert" ON agendamentos;
DROP POLICY IF EXISTS "Oficina users update" ON agendamentos;
DROP POLICY IF EXISTS "Oficina users delete" ON agendamentos;
DROP POLICY IF EXISTS "Superadmin full access" ON agendamentos;

DROP POLICY IF EXISTS "Oficina users read" ON contas_pagar;
DROP POLICY IF EXISTS "Oficina users insert" ON contas_pagar;
DROP POLICY IF EXISTS "Oficina users update" ON contas_pagar;
DROP POLICY IF EXISTS "Oficina users delete" ON contas_pagar;
DROP POLICY IF EXISTS "Superadmin full access" ON contas_pagar;

DROP POLICY IF EXISTS "Oficina users read" ON contas_receber;
DROP POLICY IF EXISTS "Oficina users insert" ON contas_receber;
DROP POLICY IF EXISTS "Oficina users update" ON contas_receber;
DROP POLICY IF EXISTS "Oficina users delete" ON contas_receber;
DROP POLICY IF EXISTS "Superadmin full access" ON contas_receber;

DROP POLICY IF EXISTS "Oficina users read" ON contas_fixas;
DROP POLICY IF EXISTS "Oficina users insert" ON contas_fixas;
DROP POLICY IF EXISTS "Oficina users update" ON contas_fixas;
DROP POLICY IF EXISTS "Oficina users delete" ON contas_fixas;
DROP POLICY IF EXISTS "Superadmin full access" ON contas_fixas;

DROP POLICY IF EXISTS "Oficina users read" ON checklists;
DROP POLICY IF EXISTS "Oficina users insert" ON checklists;
DROP POLICY IF EXISTS "Oficina users update" ON checklists;
DROP POLICY IF EXISTS "Oficina users delete" ON checklists;
DROP POLICY IF EXISTS "Superadmin full access" ON checklists;

-- CLIENTES
CREATE POLICY "Oficina users read" ON clientes FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON clientes FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON clientes FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON clientes FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON clientes FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- VEICULOS
CREATE POLICY "Oficina users read" ON veiculos FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON veiculos FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON veiculos FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON veiculos FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON veiculos FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- ORDENS DE SERVICO
CREATE POLICY "Oficina users read" ON ordens_servico FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON ordens_servico FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON ordens_servico FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON ordens_servico FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON ordens_servico FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- AGENDAMENTOS
CREATE POLICY "Oficina users read" ON agendamentos FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON agendamentos FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON agendamentos FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON agendamentos FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON agendamentos FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- CONTAS PAGAR
CREATE POLICY "Oficina users read" ON contas_pagar FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON contas_pagar FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON contas_pagar FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON contas_pagar FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON contas_pagar FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- CONTAS RECEBER
CREATE POLICY "Oficina users read" ON contas_receber FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON contas_receber FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON contas_receber FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON contas_receber FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON contas_receber FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- CONTAS FIXAS
CREATE POLICY "Oficina users read" ON contas_fixas FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON contas_fixas FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON contas_fixas FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON contas_fixas FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON contas_fixas FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');

-- CHECKLISTS
CREATE POLICY "Oficina users read" ON checklists FOR SELECT USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users insert" ON checklists FOR INSERT WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users update" ON checklists FOR UPDATE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid) WITH CHECK (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Oficina users delete" ON checklists FOR DELETE USING (oficina_id = (NULLIF(auth.jwt()->>'oficina_id',''))::uuid);
CREATE POLICY "Superadmin full access" ON checklists FOR ALL USING (auth.jwt()->>'role' = 'superadmin') WITH CHECK (auth.jwt()->>'role' = 'superadmin');
