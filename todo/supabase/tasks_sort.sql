-- Run once in Supabase SQL Editor (after schema.sql)
-- Enables drag-reorder of kanban cards within / across columns

alter table public.tasks
  add column if not exists sort_order int not null default 0;

-- Newest first within each status (matches previous UI)
with ranked as (
  select id,
    (row_number() over (partition by status order by created_at desc) - 1)::int as rn
  from public.tasks
)
update public.tasks t
set sort_order = ranked.rn
from ranked
where t.id = ranked.id;
