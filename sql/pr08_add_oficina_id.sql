-- PR-08: Adicionar oficina_id em todas as tabelas funcionais (exceto oficinas e usuarios)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE contas_pagar ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE contas_receber ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE contas_fixas ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS oficina_id UUID REFERENCES oficinas(id);
