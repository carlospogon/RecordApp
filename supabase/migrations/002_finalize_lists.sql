alter table public.shopping_lists
add column if not exists completed_at timestamptz;

create index if not exists shopping_lists_user_completed_idx
on public.shopping_lists(user_id, completed_at desc nulls last);
