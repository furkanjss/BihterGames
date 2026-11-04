-- Task start / completion timestamps
-- Run in Supabase SQL editor

alter table public.tasks
  add column if not exists started_at timestamptz,
  add column if not exists completed_at date;
