-- Run once in Supabase SQL Editor
-- Daily work-hour reports; owner sees all in Yönetim

create table if not exists public.work_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  hours numeric(5, 2) not null check (hours > 0 and hours <= 24),
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, work_date)
);

create index if not exists work_logs_date_idx on public.work_logs (work_date desc);
create index if not exists work_logs_user_id_idx on public.work_logs (user_id);

alter table public.work_logs enable row level security;

create or replace function public.is_studio_owner()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@bihtergames.com'
$$;

drop policy if exists "work_logs_select" on public.work_logs;
create policy "work_logs_select"
  on public.work_logs for select to authenticated
  using (user_id = auth.uid() or public.is_studio_owner());

drop policy if exists "work_logs_insert_own" on public.work_logs;
create policy "work_logs_insert_own"
  on public.work_logs for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "work_logs_update_own" on public.work_logs;
create policy "work_logs_update_own"
  on public.work_logs for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "work_logs_delete" on public.work_logs;
create policy "work_logs_delete"
  on public.work_logs for delete to authenticated
  using (user_id = auth.uid() or public.is_studio_owner());
