-- PR-17: Busca de clientes por nome/telefone para vínculo em veículos

create index if not exists idx_clientes_nome_lower
  on clientes (lower(nome));

create index if not exists idx_clientes_telefone
  on clientes (telefone);

-- Exemplo de query para autocomplete no front:
-- select id, nome, telefone
-- from clientes
-- where oficina_id = :oficina_id
--   and (
--     nome ilike '%' || :termo || '%'
--     or telefone ilike '%' || :termo || '%'
--   )
-- order by nome
-- limit 20;
