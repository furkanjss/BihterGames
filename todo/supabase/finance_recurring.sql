-- Run once in Supabase SQL Editor (after management.sql)
-- Marks entries that repeat every month in the 10-month forecast

alter table public.finance_entries
  add column if not exists recurring boolean not null default false;
