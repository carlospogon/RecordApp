alter table public.shopping_lists
add column if not exists shared boolean not null default false;

create table if not exists public.shopping_list_members (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  unique (list_id, user_id)
);

create table if not exists public.shopping_list_invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  share_code text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists shopping_list_members_user_idx
on public.shopping_list_members(user_id, created_at desc);

create index if not exists shopping_list_invites_list_idx
on public.shopping_list_invites(list_id, created_at desc);

alter table public.shopping_list_members enable row level security;
alter table public.shopping_list_invites enable row level security;

create or replace function public.ensure_list_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shopping_list_members (list_id, user_id, role)
  values (new.id, new.user_id, 'owner')
  on conflict (list_id, user_id) do update set role = 'owner';

  return new;
end;
$$;

create or replace function public.can_access_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_lists l
    where l.id = target_list_id
      and l.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.shopping_list_members m
    where m.list_id = target_list_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_list(target_list_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_lists l
    where l.id = target_list_id
      and l.user_id = auth.uid()
  );
$$;

insert into public.shopping_list_members (list_id, user_id, role)
select l.id, l.user_id, 'owner'
from public.shopping_lists l
on conflict (list_id, user_id) do update set role = 'owner';

drop trigger if exists shopping_lists_ensure_owner_membership on public.shopping_lists;
create trigger shopping_lists_ensure_owner_membership
after insert on public.shopping_lists
for each row execute function public.ensure_list_owner_membership();

drop policy if exists "lists_select_own" on public.shopping_lists;
drop policy if exists "lists_insert_own" on public.shopping_lists;
drop policy if exists "lists_update_own" on public.shopping_lists;
drop policy if exists "lists_delete_own" on public.shopping_lists;

create policy "lists_select_accessible" on public.shopping_lists
for select using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.shopping_list_members m
    where m.list_id = id
      and m.user_id = auth.uid()
  )
);

create policy "lists_insert_owner" on public.shopping_lists
for insert with check (auth.uid() = user_id);

create policy "lists_update_accessible" on public.shopping_lists
for update using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.shopping_list_members m
    where m.list_id = id
      and m.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  or exists (
    select 1
    from public.shopping_list_members m
    where m.list_id = id
      and m.user_id = auth.uid()
  )
);

create policy "lists_delete_owner" on public.shopping_lists
for delete using (auth.uid() = user_id);

drop policy if exists "items_select_own" on public.shopping_items;
drop policy if exists "items_insert_own" on public.shopping_items;
drop policy if exists "items_update_own" on public.shopping_items;
drop policy if exists "items_delete_own" on public.shopping_items;

create policy "items_select_accessible" on public.shopping_items
for select using (public.can_access_list(list_id));

create policy "items_insert_accessible" on public.shopping_items
for insert with check (
  auth.uid() = user_id
  and public.can_access_list(list_id)
);

create policy "items_update_accessible" on public.shopping_items
for update using (public.can_access_list(list_id))
with check (public.can_access_list(list_id));

create policy "items_delete_accessible" on public.shopping_items
for delete using (public.can_access_list(list_id));

create policy "list_members_select_accessible" on public.shopping_list_members
for select using (
  user_id = auth.uid()
  or public.can_manage_list(list_id)
);

create policy "list_members_insert_owner" on public.shopping_list_members
for insert with check (public.can_manage_list(list_id));

create policy "list_members_update_owner" on public.shopping_list_members
for update using (public.can_manage_list(list_id))
with check (public.can_manage_list(list_id));

create policy "list_members_delete_owner" on public.shopping_list_members
for delete using (public.can_manage_list(list_id));

create policy "list_invites_select_owner" on public.shopping_list_invites
for select using (public.can_manage_list(list_id));

create policy "list_invites_insert_owner" on public.shopping_list_invites
for insert with check (
  invited_by = auth.uid()
  and public.can_manage_list(list_id)
);

create policy "list_invites_update_owner" on public.shopping_list_invites
for update using (public.can_manage_list(list_id))
with check (public.can_manage_list(list_id));

create policy "list_invites_delete_owner" on public.shopping_list_invites
for delete using (public.can_manage_list(list_id));
