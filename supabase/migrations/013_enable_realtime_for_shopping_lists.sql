do $$
begin
  begin
    alter publication supabase_realtime add table public.shopping_lists;
  exception
    when duplicate_object then null;
  end;
end
$$;

alter table public.shopping_lists replica identity full;
