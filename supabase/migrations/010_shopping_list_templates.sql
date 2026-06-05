create table if not exists public.shopping_list_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  space_id uuid null references public.shopping_spaces(id) on delete set null,
  source_list_id uuid null references public.shopping_lists(id) on delete set null,
  title text not null,
  description text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.shopping_list_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.shopping_list_templates(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  quantity text null,
  unit text null,
  section text null,
  notes text null,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists shopping_list_templates_user_idx on public.shopping_list_templates(user_id, created_at desc);
create index if not exists shopping_list_templates_space_idx on public.shopping_list_templates(space_id);
create index if not exists shopping_list_template_items_template_idx on public.shopping_list_template_items(template_id, position asc);

alter table public.shopping_list_templates enable row level security;
alter table public.shopping_list_template_items enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_templates'
      and policyname = 'shopping_list_templates_select_access'
  ) then
    create policy shopping_list_templates_select_access
      on public.shopping_list_templates
      for select
      using (
        auth.uid() = user_id
        or (
          space_id is not null
          and exists (
            select 1
            from public.shopping_space_members members
            where members.space_id = shopping_list_templates.space_id
              and members.user_id = auth.uid()
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_templates'
      and policyname = 'shopping_list_templates_insert_owner'
  ) then
    create policy shopping_list_templates_insert_owner
      on public.shopping_list_templates
      for insert
      with check (
        auth.uid() = user_id
        and (
          space_id is null
          or exists (
            select 1
            from public.shopping_space_members members
            where members.space_id = shopping_list_templates.space_id
              and members.user_id = auth.uid()
          )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_templates'
      and policyname = 'shopping_list_templates_update_owner'
  ) then
    create policy shopping_list_templates_update_owner
      on public.shopping_list_templates
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_templates'
      and policyname = 'shopping_list_templates_delete_owner'
  ) then
    create policy shopping_list_templates_delete_owner
      on public.shopping_list_templates
      for delete
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_template_items'
      and policyname = 'shopping_list_template_items_select_access'
  ) then
    create policy shopping_list_template_items_select_access
      on public.shopping_list_template_items
      for select
      using (
        exists (
          select 1
          from public.shopping_list_templates templates
          where templates.id = shopping_list_template_items.template_id
            and (
              templates.user_id = auth.uid()
              or (
                templates.space_id is not null
                and exists (
                  select 1
                  from public.shopping_space_members members
                  where members.space_id = templates.space_id
                    and members.user_id = auth.uid()
                )
              )
            )
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'shopping_list_template_items'
      and policyname = 'shopping_list_template_items_modify_owner'
  ) then
    create policy shopping_list_template_items_modify_owner
      on public.shopping_list_template_items
      for all
      using (
        exists (
          select 1
          from public.shopping_list_templates templates
          where templates.id = shopping_list_template_items.template_id
            and templates.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1
          from public.shopping_list_templates templates
          where templates.id = shopping_list_template_items.template_id
            and templates.user_id = auth.uid()
        )
      );
  end if;
end $$;
