-- Brand management for EVFAKTA.
-- cars.brand text remains for backwards compatibility.
-- Optional cars.brand_id links to public.brands.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  logo_url text,
  country text,
  website_url text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_key unique (name),
  constraint brands_slug_key unique (slug)
);

create index if not exists brands_is_active_idx on public.brands (is_active);
create index if not exists brands_name_idx on public.brands (name);

create or replace function public.set_brands_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists brands_set_updated_at on public.brands;

create trigger brands_set_updated_at
before update on public.brands
for each row
execute function public.set_brands_updated_at();

alter table public.brands enable row level security;

drop policy if exists "Anyone can select active brands" on public.brands;

create policy "Anyone can select active brands"
  on public.brands
  for select
  to anon, authenticated
  using (is_active = true);

-- No public INSERT / UPDATE / DELETE policies.
-- Admin writes use the service role key on the server only.

alter table public.cars
  add column if not exists brand_id uuid references public.brands (id) on delete set null;

create index if not exists cars_brand_id_idx on public.cars (brand_id);

-- Storage bucket for brand logos (public read).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-logos',
  'brand-logos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read brand-logos" on storage.objects;
create policy "Public read brand-logos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'brand-logos');
