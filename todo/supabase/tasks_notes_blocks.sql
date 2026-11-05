-- Notion-like notes blocks on tasks
-- Run in Supabase SQL editor

alter table public.tasks
  add column if not exists notes_blocks jsonb not null default '[]'::jsonb;
