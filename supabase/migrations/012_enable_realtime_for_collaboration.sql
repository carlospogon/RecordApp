do $$
begin
  begin
    alter publication supabase_realtime add table public.shopping_items;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.shopping_list_members;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.shopping_activity_events;
  exception
    when duplicate_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.shopping_list_email_invites;
  exception
    when duplicate_object then null;
  end;
end
$$;

alter table public.shopping_items replica identity full;
alter table public.shopping_list_members replica identity full;
alter table public.shopping_activity_events replica identity full;
alter table public.shopping_list_email_invites replica identity full;
