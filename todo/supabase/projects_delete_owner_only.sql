-- Only info@bihtergames.com may DELETE projects (run once in Supabase SQL Editor)

drop policy if exists "projects_all_authenticated" on public.projects;
drop policy if exists "projects_select_authenticated" on public.projects;
drop policy if exists "projects_insert_authenticated" on public.projects;
drop policy if exists "projects_update_authenticated" on public.projects;
drop policy if exists "projects_delete_owner_only" on public.projects;

create policy "projects_select_authenticated"
  on public.projects for select to authenticated using (true);

create policy "projects_insert_authenticated"
  on public.projects for insert to authenticated with check (true);

create policy "projects_update_authenticated"
  on public.projects for update to authenticated
  using (true) with check (true);

create policy "projects_delete_owner_only"
  on public.projects for delete to authenticated
  using (
    lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@bihtergames.com'
  );
