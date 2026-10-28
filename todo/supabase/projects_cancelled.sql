-- Allow project status: cancelled (run once in Supabase SQL editor)
alter table public.projects drop constraint if exists projects_status_check;

alter table public.projects
  add constraint projects_status_check check (
    status in (
      'idea',
      'preprod',
      'production',
      'polish',
      'released',
      'on-hold',
      'cancelled'
    )
  );
