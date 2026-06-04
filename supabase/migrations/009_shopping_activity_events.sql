create table if not exists public.shopping_activity_events (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  space_id uuid references public.shopping_spaces(id) on delete set null,
  item_id uuid references public.shopping_items(id) on delete set null,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  subject_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists shopping_activity_events_list_created_idx
on public.shopping_activity_events(list_id, created_at desc);

create index if not exists shopping_activity_events_space_created_idx
on public.shopping_activity_events(space_id, created_at desc);

alter table public.shopping_activity_events enable row level security;

create policy "activity_events_select_accessible" on public.shopping_activity_events
for select using (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_activity_events.list_id
      and l.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.shopping_list_members m
    where m.list_id = shopping_activity_events.list_id
      and m.user_id = auth.uid()
  )
);
