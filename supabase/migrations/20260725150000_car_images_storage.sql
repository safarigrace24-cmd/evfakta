-- Supabase Storage bucket for car images.
-- Run manually in the SQL Editor. Do not rely on app startup to create this.
--
-- Public read so image_url can be used on the site.
-- Writes go through the server with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'car-images',
  'car-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public can read objects in car-images
drop policy if exists "Public read car-images" on storage.objects;
create policy "Public read car-images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'car-images');

-- Optional: allow authenticated users to read as well (same as public).
-- Inserts/updates/deletes are performed with the service role from the server.
