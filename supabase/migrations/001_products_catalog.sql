create table if not exists public.shopping_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  default_unit text,
  category text not null default 'otros' check (
    category in ('fruta', 'verdura', 'lacteos', 'huevos', 'panaderia', 'carne', 'pescado', 'despensa', 'bebidas', 'hogar', 'otros')
  ),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shopping_products enable row level security;

create policy "products_select_own" on public.shopping_products
for select using (auth.uid() = user_id);

create policy "products_insert_own" on public.shopping_products
for insert with check (auth.uid() = user_id);

create policy "products_update_own" on public.shopping_products
for update using (auth.uid() = user_id);

create policy "products_delete_own" on public.shopping_products
for delete using (auth.uid() = user_id);

create unique index if not exists shopping_products_user_normalized_idx
on public.shopping_products(user_id, normalized_name);
