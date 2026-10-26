-- Run once in Supabase SQL Editor
-- Important links (team) + Yönetim finance (owner only)

-- ——— Important links (all authenticated) ———
create table if not exists public.important_links (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text,
  body text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

alter table public.important_links enable row level security;

drop policy if exists "links_all_authenticated" on public.important_links;
create policy "links_all_authenticated"
  on public.important_links for all to authenticated
  using (true) with check (true);

-- Seed GitHub rules (skip if already present)
insert into public.important_links (title, url, body, sort_order)
select
  'GitHub push kuralları',
  'https://github.com/furkanjss/BihterGames',
  E'• master’a doğrudan force-push yok\n• Feature branch aç, PR ile birleştir\n• Commit mesajı net olsun (ne / neden)\n• .env / secret asla commitleme\n• Deploy öncesi lokal build kontrol et\n• Studio Hub değişikliklerinde todo/ altında çalış',
  0
where not exists (
  select 1 from public.important_links where title = 'GitHub push kuralları'
);

-- ——— Finance / Yönetim (info@ only) ———
create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income', 'expense', 'payroll')),
  label text not null,
  amount numeric(14, 2) not null check (amount >= 0),
  currency text not null default 'TRY',
  entry_date date not null default current_date,
  category text,
  notes text,
  recurring boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index if not exists finance_entries_date_idx
  on public.finance_entries (entry_date desc);

alter table public.finance_entries enable row level security;

drop policy if exists "finance_owner_only" on public.finance_entries;
create policy "finance_owner_only"
  on public.finance_entries for all to authenticated
  using ((auth.jwt() ->> 'email') = 'info@bihtergames.com')
  with check ((auth.jwt() ->> 'email') = 'info@bihtergames.com');
