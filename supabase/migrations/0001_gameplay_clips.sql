-- PlayZone: gameplay clip storage setup
-- Anonymous users (no auth) upload short webcam gameplay clips and
-- read them back via public URLs for share cards.

-- 1. Bucket (public so getPublicUrl works for share cards).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'gameplay-clips',
  'gameplay-clips',
  true,
  52428800, -- 50 MB per clip
  array['video/mp4','video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2. RLS policies on storage.objects (idempotent).
drop policy if exists "gameplay_clips_anon_insert" on storage.objects;
drop policy if exists "gameplay_clips_public_read"  on storage.objects;

create policy "gameplay_clips_anon_insert"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'gameplay-clips');

create policy "gameplay_clips_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gameplay-clips');
