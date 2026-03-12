-- PR-13: Histórico, Relatórios, Estoque, Fornecedores e Funcionários

create table if not exists estoque (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid references oficinas(id) on delete cascade,
  nome text not null,
  codigo text unique,
  qtd numeric default 0,
  valor_unit numeric default 0,
  qtd_min numeric default 0,
  created_at timestamptz default now()
);

create table if not exists movimentos_estoque (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid references oficinas(id) on delete cascade,
  item_id uuid not null references estoque(id) on delete cascade,
  tipo text not null check (tipo in ('entrada','saida')),
  qtd numeric not null,
  os_id uuid references ordens_servico(id) on delete set null,
  cliente_id uuid references clientes(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists fornecedores (
  id uuid primary key default gen_random_uuid(),
  oficina_id uuid references oficinas(id) on delete cascade,
  nome text not null,
  cnpj text,
  contato text,
  tel text,
  email text,
  created_at timestamptz default now()
);

alter table usuarios add column if not exists cpf text;
alter table usuarios add column if not exists telefone text;
alter table usuarios add column if not exists comissao numeric default 0;

create index if not exists idx_estoque_oficina_id on estoque(oficina_id);
create index if not exists idx_mov_estoque_oficina_id on movimentos_estoque(oficina_id);
create index if not exists idx_fornecedores_oficina_id on fornecedores(oficina_id);
