-- PR-08: Migrar dados antigos para a oficina atual
-- Assumindo que existe apenas 1 oficina ativa atualmente.

UPDATE clientes SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE veiculos SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE ordens_servico SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE agendamentos SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE contas_pagar SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE contas_receber SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE contas_fixas SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
UPDATE checklists SET oficina_id = (SELECT id FROM oficinas LIMIT 1) WHERE oficina_id IS NULL;
