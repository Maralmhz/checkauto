ALTER TABLE oficinas
ADD COLUMN plano text DEFAULT 'Free'
CHECK (plano IN ('Free', 'Pro', 'Enterprise'));
