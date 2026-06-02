create table if not exists public.shopping_spaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  share_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.shopping_spaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor')),
  created_at timestamptz not null default now(),
  unique (space_id, user_id)
);

alter table public.shopping_lists
add column if not exists space_id uuid references public.shopping_spaces(id) on delete set null;

create index if not exists shopping_spaces_user_idx
on public.shopping_spaces(user_id, created_at desc);

create index if not exists shopping_spaces_share_code_idx
on public.shopping_spaces(share_code);

create index if not exists shopping_space_members_user_idx
on public.shopping_space_members(user_id, created_at desc);

create index if not exists shopping_lists_space_idx
on public.shopping_lists(space_id, shopping_date desc);

alter table public.shopping_spaces enable row level security;
alter table public.shopping_space_members enable row level security;

create or replace function public.ensure_space_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.shopping_space_members (space_id, user_id, role)
  values (new.id, new.user_id, 'owner')
  on conflict (space_id, user_id) do update set role = 'owner';

  return new;
end;
$$;

create or replace function public.can_access_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_spaces s
    where s.id = target_space_id
      and s.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.shopping_space_members m
    where m.space_id = target_space_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_manage_space(target_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.shopping_spaces s
    where s.id = target_space_id
      and s.user_id = auth.uid()
  );
$$;

insert into public.shopping_space_members (space_id, user_id, role)
select s.id, s.user_id, 'owner'
from public.shopping_spaces s
on conflict (space_id, user_id) do update set role = 'owner';

drop trigger if exists shopping_spaces_ensure_owner_membership on public.shopping_spaces;
create trigger shopping_spaces_ensure_owner_membership
after insert on public.shopping_spaces
for each row execute function public.ensure_space_owner_membership();

create policy "spaces_select_accessible" on public.shopping_spaces
for select using (public.can_access_space(id));

create policy "spaces_insert_owner" on public.shopping_spaces
for insert with check (auth.uid() = user_id);

create policy "spaces_update_owner" on public.shopping_spaces
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "spaces_delete_owner" on public.shopping_spaces
for delete using (auth.uid() = user_id);

create policy "space_members_select_accessible" on public.shopping_space_members
for select using (
  user_id = auth.uid()
  or public.can_access_space(space_id)
);

create policy "space_members_insert_owner" on public.shopping_space_members
for insert with check (public.can_manage_space(space_id));

create policy "space_members_update_owner" on public.shopping_space_members
for update using (public.can_manage_space(space_id))
with check (public.can_manage_space(space_id));

create policy "space_members_delete_owner" on public.shopping_space_members
for delete using (public.can_manage_space(space_id));
