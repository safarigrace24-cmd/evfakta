-- Admin cars table (Admin Panel v1).
-- Public pages still read from data/cars.ts until the next migration phase.

create table if not exists public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  model text not null,
  year integer,
  price_nok integer,
  range_km integer,
  battery_kwh numeric,
  dc_charging_kw integer,
  drivetrain text,
  image_url text,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cars_is_published_idx on public.cars (is_published);
create index if not exists cars_updated_at_idx on public.cars (updated_at desc);

create or replace function public.set_cars_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cars_set_updated_at on public.cars;

create trigger cars_set_updated_at
before update on public.cars
for each row
execute function public.set_cars_updated_at();

alter table public.cars enable row level security;

drop policy if exists "Anyone can select published cars" on public.cars;

create policy "Anyone can select published cars"
  on public.cars
  for select
  to anon, authenticated
  using (is_published = true);

-- No public INSERT / UPDATE / DELETE policies.
-- Admin writes use the service role key on the server only.
