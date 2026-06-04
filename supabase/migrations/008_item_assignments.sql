alter table public.shopping_items
add column if not exists assigned_to_user_id uuid references auth.users(id) on delete set null;

create index if not exists shopping_items_assigned_to_idx
on public.shopping_items(assigned_to_user_id, created_at desc);
