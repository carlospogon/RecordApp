create table if not exists public.shopping_list_email_invites (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  email text not null,
  share_code text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz null,
  unique (list_id, email)
);

create index if not exists shopping_list_email_invites_list_idx
on public.shopping_list_email_invites(list_id, created_at desc);

create index if not exists shopping_list_email_invites_status_idx
on public.shopping_list_email_invites(status, created_at desc);

alter table public.shopping_list_email_invites enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_email_invites'
      and policyname = 'shopping_list_email_invites_select_owner'
  ) then
    create policy shopping_list_email_invites_select_owner
      on public.shopping_list_email_invites
      for select
      using (public.can_manage_list(list_id));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_email_invites'
      and policyname = 'shopping_list_email_invites_insert_owner'
  ) then
    create policy shopping_list_email_invites_insert_owner
      on public.shopping_list_email_invites
      for insert
      with check (
        invited_by = auth.uid()
        and public.can_manage_list(list_id)
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_email_invites'
      and policyname = 'shopping_list_email_invites_update_owner'
  ) then
    create policy shopping_list_email_invites_update_owner
      on public.shopping_list_email_invites
      for update
      using (public.can_manage_list(list_id))
      with check (public.can_manage_list(list_id));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_email_invites'
      and policyname = 'shopping_list_email_invites_delete_owner'
  ) then
    create policy shopping_list_email_invites_delete_owner
      on public.shopping_list_email_invites
      for delete
      using (public.can_manage_list(list_id));
  end if;
end $$;
