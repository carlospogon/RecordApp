create extension if not exists pgcrypto;

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  shopping_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  quantity text,
  unit text,
  status text not null default 'pending' check (status in ('pending', 'bought')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  checked_at timestamptz
);

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;

create policy "lists_select_own" on public.shopping_lists
for select using (auth.uid() = user_id);

create policy "lists_insert_own" on public.shopping_lists
for insert with check (auth.uid() = user_id);

create policy "lists_update_own" on public.shopping_lists
for update using (auth.uid() = user_id);

create policy "lists_delete_own" on public.shopping_lists
for delete using (auth.uid() = user_id);

create policy "items_select_own" on public.shopping_items
for select using (auth.uid() = user_id);

create policy "items_insert_own" on public.shopping_items
for insert with check (auth.uid() = user_id);

create policy "items_update_own" on public.shopping_items
for update using (auth.uid() = user_id);

create policy "items_delete_own" on public.shopping_items
for delete using (auth.uid() = user_id);

create index if not exists shopping_lists_user_date_idx
on public.shopping_lists(user_id, shopping_date desc);

create index if not exists shopping_items_user_normalized_idx
on public.shopping_items(user_id, normalized_name);
