-- Run once in Supabase SQL Editor (after schema.sql)
-- Private idea inbox — only info@bihtergames.com

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.ideas enable row level security;

drop policy if exists "ideas_owner_only" on public.ideas;
create policy "ideas_owner_only"
  on public.ideas for all to authenticated
  using ((auth.jwt() ->> 'email') = 'info@bihtergames.com')
  with check ((auth.jwt() ->> 'email') = 'info@bihtergames.com');
