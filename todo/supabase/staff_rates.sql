-- Run once in Supabase SQL Editor
-- Hourly wage per staff member (owner-only)

create table if not exists public.staff_rates (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  hourly_rate numeric(12, 2) not null default 0 check (hourly_rate >= 0),
  currency text not null default 'TRY',
  updated_at timestamptz not null default now()
);

alter table public.staff_rates enable row level security;

create or replace function public.is_studio_owner()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = 'info@bihtergames.com'
$$;

drop policy if exists "staff_rates_owner" on public.staff_rates;
create policy "staff_rates_owner"
  on public.staff_rates for all to authenticated
  using (public.is_studio_owner())
  with check (public.is_studio_owner());
