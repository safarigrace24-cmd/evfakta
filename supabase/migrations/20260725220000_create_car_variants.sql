-- Model variants: one public car page, multiple selectable trims.
-- Existing public.cars columns remain for backwards compatibility.
-- Cars without variants continue to work unchanged.

create table if not exists public.car_variants (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  name text not null,
  slug text not null,
  trim_level text,
  model_year integer,
  price_nok integer,
  battery_total_kwh numeric,
  battery_usable_kwh numeric,
  range_km integer,
  winter_range_km integer,
  real_world_range_km integer,
  consumption_kwh_100km numeric,
  ac_charging_kw numeric,
  dc_charging_kw integer,
  charge_time_10_80_minutes integer,
  drivetrain text,
  power_hp integer,
  torque_nm integer,
  acceleration_0_100 numeric,
  top_speed_kmh integer,
  towing_kg integer,
  curb_weight_kg integer,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  source_name text,
  source_url text,
  data_last_checked_at timestamptz,
  import_status text not null default 'needs_review'
    check (import_status in ('draft', 'needs_review', 'approved')),
  import_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint car_variants_car_id_slug_key unique (car_id, slug)
);

comment on table public.car_variants is
  'Selectable trims/variants for a catalog car. Headline public specs use the default active variant when present.';

comment on column public.car_variants.is_default is
  'At most one default variant per car (enforced by partial unique index).';

comment on column public.car_variants.import_status is
  'Review workflow for variants (draft | needs_review | approved). Never auto-publishes the parent car.';

-- One default variant per car.
create unique index if not exists car_variants_one_default_per_car
  on public.car_variants (car_id)
  where is_default = true;

create index if not exists car_variants_car_id_sort_idx
  on public.car_variants (car_id, sort_order asc, name asc);

create index if not exists car_variants_car_id_active_idx
  on public.car_variants (car_id, is_active);

create index if not exists car_variants_import_status_idx
  on public.car_variants (import_status);

create or replace function public.set_car_variants_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists car_variants_set_updated_at on public.car_variants;
create trigger car_variants_set_updated_at
  before update on public.car_variants
  for each row
  execute function public.set_car_variants_updated_at();

alter table public.car_variants enable row level security;

drop policy if exists "Anyone can select active variants for published cars" on public.car_variants;

create policy "Anyone can select active variants for published cars"
  on public.car_variants
  for select
  to anon, authenticated
  using (
    is_active = true
    and exists (
      select 1
      from public.cars c
      where c.id = car_id
        and c.is_published = true
    )
  );

-- No public INSERT / UPDATE / DELETE policies.
-- Admin writes use the service role key on the server only.
