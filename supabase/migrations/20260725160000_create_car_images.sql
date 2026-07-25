-- Multi-image gallery for cars.
-- Existing public.cars.image_url remains for backwards compatibility.

create table if not exists public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  image_type text not null default 'other',
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint car_images_image_type_check check (
    image_type in ('front', 'rear', 'side', 'interior', 'cargo', 'detail', 'other')
  )
);

create index if not exists car_images_car_id_sort_idx
  on public.car_images (car_id, sort_order asc);

-- At most one primary image per car.
create unique index if not exists car_images_one_primary_per_car
  on public.car_images (car_id)
  where is_primary = true;

alter table public.car_images enable row level security;

drop policy if exists "Anyone can select images for published cars" on public.car_images;

create policy "Anyone can select images for published cars"
  on public.car_images
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.cars c
      where c.id = car_id
        and c.is_published = true
    )
  );

-- No public INSERT / UPDATE / DELETE policies.
-- Admin writes use the service role key on the server only.
