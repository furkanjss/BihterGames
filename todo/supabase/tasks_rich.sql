-- Task subtasks + images (+ storage bucket)
-- Run in Supabase SQL editor

alter table public.tasks
  add column if not exists subtasks jsonb not null default '[]'::jsonb,
  add column if not exists images jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public)
values ('task-images', 'task-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "task_images_public_read" on storage.objects;
create policy "task_images_public_read"
  on storage.objects for select
  using (bucket_id = 'task-images');

drop policy if exists "task_images_auth_insert" on storage.objects;
create policy "task_images_auth_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'task-images');

drop policy if exists "task_images_auth_update" on storage.objects;
create policy "task_images_auth_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'task-images')
  with check (bucket_id = 'task-images');

drop policy if exists "task_images_auth_delete" on storage.objects;
create policy "task_images_auth_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'task-images');
