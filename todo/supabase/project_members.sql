-- Run once in Supabase SQL Editor
-- Project assignment: only info@ sees all projects; others see assigned only

create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists project_members_user_id_idx
  on public.project_members (user_id);

alter table public.project_members enable row level security;

create or replace function public.is_studio_owner()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@bihtergames.com'
$$;

create or replace function public.is_project_member(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_studio_owner()
    or exists (
      select 1
      from public.project_members m
      where m.project_id = pid
        and m.user_id = auth.uid()
    )
$$;

-- project_members: everyone reads rows for projects they can access; owner writes
drop policy if exists "pm_select" on public.project_members;
create policy "pm_select"
  on public.project_members for select to authenticated
  using (
    public.is_studio_owner()
    or user_id = auth.uid()
  );

drop policy if exists "pm_insert_owner" on public.project_members;
create policy "pm_insert_owner"
  on public.project_members for insert to authenticated
  with check (public.is_studio_owner());

drop policy if exists "pm_delete_owner" on public.project_members;
create policy "pm_delete_owner"
  on public.project_members for delete to authenticated
  using (public.is_studio_owner());

-- Projects: tighten select / update
drop policy if exists "projects_select_authenticated" on public.projects;
create policy "projects_select_authenticated"
  on public.projects for select to authenticated
  using (public.is_project_member(id));

drop policy if exists "projects_insert_authenticated" on public.projects;
create policy "projects_insert_authenticated"
  on public.projects for insert to authenticated
  with check (public.is_studio_owner());

drop policy if exists "projects_update_authenticated" on public.projects;
create policy "projects_update_authenticated"
  on public.projects for update to authenticated
  using (public.is_studio_owner())
  with check (public.is_studio_owner());

-- Tasks / documents: only via membership
drop policy if exists "tasks_all_authenticated" on public.tasks;
create policy "tasks_all_authenticated"
  on public.tasks for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

drop policy if exists "documents_all_authenticated" on public.documents;
create policy "documents_all_authenticated"
  on public.documents for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));
