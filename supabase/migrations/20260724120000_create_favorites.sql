-- Favorites: logged-in users can save cars by slug.
-- Cars themselves remain in the app (data/cars.ts), not in the database.

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  car_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, car_slug)
);

create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists favorites_user_id_created_at_idx on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

create policy "Users can select own favorites"
  on public.favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on public.favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on public.favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);
