create table if not exists public.product_taxonomy (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null,
  normalized_name text not null unique,
  category text not null default 'otros' check (
    category in ('fruta', 'verdura', 'lacteos', 'huevos', 'panaderia', 'carne', 'pescado', 'despensa', 'bebidas', 'hogar', 'otros')
  ),
  default_unit text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_taxonomy_aliases (
  id uuid primary key default gen_random_uuid(),
  taxonomy_id uuid not null references public.product_taxonomy(id) on delete cascade,
  alias text not null,
  normalized_alias text not null unique,
  created_at timestamptz not null default now()
);

alter table public.product_taxonomy enable row level security;
alter table public.product_taxonomy_aliases enable row level security;

drop policy if exists "taxonomy_select_authenticated" on public.product_taxonomy;
create policy "taxonomy_select_authenticated" on public.product_taxonomy
for select using (auth.role() = 'authenticated');

drop policy if exists "taxonomy_aliases_select_authenticated" on public.product_taxonomy_aliases;
create policy "taxonomy_aliases_select_authenticated" on public.product_taxonomy_aliases
for select using (auth.role() = 'authenticated');

create unique index if not exists product_taxonomy_normalized_idx
on public.product_taxonomy(normalized_name);

create unique index if not exists product_taxonomy_aliases_normalized_idx
on public.product_taxonomy_aliases(normalized_alias);

insert into public.product_taxonomy (canonical_name, normalized_name, category, default_unit)
values
  ('platano', 'platano', 'fruta', 'uds'),
  ('manzana', 'manzana', 'fruta', 'uds'),
  ('pera', 'pera', 'fruta', 'uds'),
  ('naranja', 'naranja', 'fruta', 'uds'),
  ('limon', 'limon', 'fruta', 'uds'),
  ('fresa', 'fresa', 'fruta', 'bandeja'),
  ('uva', 'uva', 'fruta', 'bandeja'),
  ('melon', 'melon', 'fruta', 'uds'),
  ('sandia', 'sandia', 'fruta', 'uds'),
  ('kiwi', 'kiwi', 'fruta', 'uds'),
  ('aguacate', 'aguacate', 'fruta', 'uds'),
  ('melocoton', 'melocoton', 'fruta', 'uds'),
  ('tomate', 'tomate', 'verdura', 'kg'),
  ('lechuga', 'lechuga', 'verdura', 'uds'),
  ('cebolla', 'cebolla', 'verdura', 'kg'),
  ('ajo', 'ajo', 'verdura', 'cabeza'),
  ('zanahoria', 'zanahoria', 'verdura', 'kg'),
  ('pepino', 'pepino', 'verdura', 'uds'),
  ('calabacin', 'calabacin', 'verdura', 'uds'),
  ('berenjena', 'berenjena', 'verdura', 'uds'),
  ('brocoli', 'brocoli', 'verdura', 'uds'),
  ('pimiento', 'pimiento', 'verdura', 'uds'),
  ('patata', 'patata', 'verdura', 'kg'),
  ('champiñon', 'champinon', 'verdura', 'bandeja'),
  ('leche', 'leche', 'lacteos', 'l'),
  ('queso', 'queso', 'lacteos', 'pieza'),
  ('yogur', 'yogur', 'lacteos', 'pack'),
  ('mantequilla', 'mantequilla', 'lacteos', 'uds'),
  ('nata', 'nata', 'lacteos', 'ml'),
  ('huevo', 'huevo', 'huevos', 'docena'),
  ('pan', 'pan', 'panaderia', 'barra'),
  ('barra de pan', 'barra de pan', 'panaderia', 'barra'),
  ('mollete', 'mollete', 'panaderia', 'uds'),
  ('croissant', 'croissant', 'panaderia', 'uds'),
  ('galleta', 'galleta', 'panaderia', 'paquete'),
  ('pollo', 'pollo', 'carne', 'kg'),
  ('ternera', 'ternera', 'carne', 'kg'),
  ('cerdo', 'cerdo', 'carne', 'kg'),
  ('jamon', 'jamon', 'carne', 'paquete'),
  ('pavo', 'pavo', 'carne', 'kg'),
  ('salmon', 'salmon', 'pescado', 'kg'),
  ('atun', 'atun', 'pescado', 'lata'),
  ('merluza', 'merluza', 'pescado', 'kg'),
  ('bacalao', 'bacalao', 'pescado', 'kg'),
  ('gamba', 'gamba', 'pescado', 'kg'),
  ('arroz', 'arroz', 'despensa', 'kg'),
  ('pasta', 'pasta', 'despensa', 'paquete'),
  ('macarron', 'macarron', 'despensa', 'paquete'),
  ('espagueti', 'espagueti', 'despensa', 'paquete'),
  ('lenteja', 'lenteja', 'despensa', 'paquete'),
  ('garbanzo', 'garbanzo', 'despensa', 'paquete'),
  ('harina', 'harina', 'despensa', 'kg'),
  ('azucar', 'azucar', 'despensa', 'kg'),
  ('sal', 'sal', 'despensa', 'kg'),
  ('aceite', 'aceite', 'despensa', 'l'),
  ('cafe', 'cafe', 'bebidas', 'paquete'),
  ('te', 'te', 'bebidas', 'caja'),
  ('agua', 'agua', 'bebidas', 'l'),
  ('zumo', 'zumo', 'bebidas', 'l'),
  ('refresco', 'refresco', 'bebidas', 'l'),
  ('detergente', 'detergente', 'hogar', 'botella'),
  ('lejia', 'lejia', 'hogar', 'botella'),
  ('papel higienico', 'papel higienico', 'hogar', 'pack'),
  ('papel de cocina', 'papel de cocina', 'hogar', 'rollo'),
  ('servilleta', 'servilleta', 'hogar', 'paquete'),
  ('suavizante', 'suavizante', 'hogar', 'botella'),
  ('gel', 'gel', 'hogar', 'botella'),
  ('champu', 'champu', 'hogar', 'botella'),
  ('jabon', 'jabon', 'hogar', 'pastilla')
on conflict (normalized_name) do update
set category = excluded.category,
    default_unit = excluded.default_unit,
    canonical_name = excluded.canonical_name,
    active = true;

insert into public.product_taxonomy_aliases (taxonomy_id, alias, normalized_alias)
values
  ((select id from public.product_taxonomy where normalized_name = 'platano'), 'platanos', 'platano'),
  ((select id from public.product_taxonomy where normalized_name = 'platano'), 'banana', 'banana'),
  ((select id from public.product_taxonomy where normalized_name = 'platano'), 'bananas', 'banana'),
  ((select id from public.product_taxonomy where normalized_name = 'manzana'), 'manzanas', 'manzana'),
  ((select id from public.product_taxonomy where normalized_name = 'pera'), 'peras', 'pera'),
  ((select id from public.product_taxonomy where normalized_name = 'naranja'), 'naranjas', 'naranja'),
  ((select id from public.product_taxonomy where normalized_name = 'limon'), 'limones', 'limon'),
  ((select id from public.product_taxonomy where normalized_name = 'fresa'), 'fresas', 'fresa'),
  ((select id from public.product_taxonomy where normalized_name = 'uva'), 'uvas', 'uva'),
  ((select id from public.product_taxonomy where normalized_name = 'melon'), 'melones', 'melon'),
  ((select id from public.product_taxonomy where normalized_name = 'sandia'), 'sandias', 'sandia'),
  ((select id from public.product_taxonomy where normalized_name = 'aguacate'), 'aguacates', 'aguacate'),
  ((select id from public.product_taxonomy where normalized_name = 'melocoton'), 'melocotones', 'melocoton'),
  ((select id from public.product_taxonomy where normalized_name = 'tomate'), 'tomates', 'tomate'),
  ((select id from public.product_taxonomy where normalized_name = 'patata'), 'patatas', 'patata'),
  ((select id from public.product_taxonomy where normalized_name = 'champinon'), 'champiñones', 'champinon'),
  ((select id from public.product_taxonomy where normalized_name = 'leche'), 'leches', 'leche'),
  ((select id from public.product_taxonomy where normalized_name = 'queso'), 'quesos', 'queso'),
  ((select id from public.product_taxonomy where normalized_name = 'yogur'), 'yogures', 'yogur'),
  ((select id from public.product_taxonomy where normalized_name = 'huevo'), 'huevos', 'huevo'),
  ((select id from public.product_taxonomy where normalized_name = 'pan'), 'panes', 'pan'),
  ((select id from public.product_taxonomy where normalized_name = 'barra de pan'), 'barra', 'barra'),
  ((select id from public.product_taxonomy where normalized_name = 'pollo'), 'pechuga de pollo', 'pechuga de pollo'),
  ((select id from public.product_taxonomy where normalized_name = 'ternera'), 'filetes de ternera', 'filete de ternera'),
  ((select id from public.product_taxonomy where normalized_name = 'salmon'), 'salmon fresco', 'salmon fresco'),
  ((select id from public.product_taxonomy where normalized_name = 'atun'), 'atun en lata', 'atun en lata'),
  ((select id from public.product_taxonomy where normalized_name = 'arroz'), 'arroz integral', 'arroz integral'),
  ((select id from public.product_taxonomy where normalized_name = 'pasta'), 'pastas', 'pasta'),
  ((select id from public.product_taxonomy where normalized_name = 'macarron'), 'macarrones', 'macarron'),
  ((select id from public.product_taxonomy where normalized_name = 'espagueti'), 'espaguetis', 'espagueti'),
  ((select id from public.product_taxonomy where normalized_name = 'lenteja'), 'lentejas', 'lenteja'),
  ((select id from public.product_taxonomy where normalized_name = 'garbanzo'), 'garbanzos', 'garbanzo'),
  ((select id from public.product_taxonomy where normalized_name = 'cafe'), 'cafe molido', 'cafe molido'),
  ((select id from public.product_taxonomy where normalized_name = 'zumo'), 'jugo', 'jugo'),
  ((select id from public.product_taxonomy where normalized_name = 'zumo'), 'jugo de naranja', 'jugo de naranja'),
  ((select id from public.product_taxonomy where normalized_name = 'refresco'), 'cola', 'cola'),
  ((select id from public.product_taxonomy where normalized_name = 'detergente'), 'detergente ropa', 'detergente ropa'),
  ((select id from public.product_taxonomy where normalized_name = 'papel higienico'), 'papel baño', 'papel baño'),
  ((select id from public.product_taxonomy where normalized_name = 'champu'), 'shampoo', 'shampoo')
on conflict (normalized_alias) do nothing;
