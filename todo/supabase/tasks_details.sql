-- Task links + linked documents
-- Run in Supabase SQL editor

alter table public.tasks
  add column if not exists links jsonb not null default '[]'::jsonb,
  add column if not exists document_ids jsonb not null default '[]'::jsonb;
