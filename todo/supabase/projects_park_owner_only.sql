-- Only info@bihtergames.com may set / clear on-hold or cancelled (run once)

create or replace function public.enforce_project_park_owner()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status in ('on-hold', 'cancelled')
       and lower(coalesce(auth.jwt() ->> 'email', '')) <> 'info@bihtergames.com'
    then
      raise exception 'Only studio owner can park or cancel projects';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     and (
       new.status in ('on-hold', 'cancelled')
       or old.status in ('on-hold', 'cancelled')
     )
     and lower(coalesce(auth.jwt() ->> 'email', '')) <> 'info@bihtergames.com'
  then
    raise exception 'Only studio owner can park, cancel, or resume projects';
  end if;

  return new;
end;
$$;

drop trigger if exists projects_park_owner_only on public.projects;
create trigger projects_park_owner_only
  before insert or update of status on public.projects
  for each row execute function public.enforce_project_park_owner();
