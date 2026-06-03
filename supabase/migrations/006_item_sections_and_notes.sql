alter table public.shopping_items
add column if not exists section text check (
  section in ('fruta', 'verdura', 'lacteos', 'huevos', 'panaderia', 'carne', 'pescado', 'despensa', 'bebidas', 'hogar', 'otros')
),
add column if not exists notes text;

create index if not exists shopping_items_list_section_idx
on public.shopping_items(list_id, section, status, created_at);
