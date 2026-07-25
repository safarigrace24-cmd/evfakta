-- Catalog Management System: import jobs, field source tracking, catalog indexes.
-- Approval (import_status) remains separate from publishing (is_published).
-- Imported cars must never auto-publish.

-- ---------------------------------------------------------------------------
-- Cars: country + import provenance
-- ---------------------------------------------------------------------------

alter table public.cars
  add column if not exists country text,
  add column if not exists last_import_job_id uuid,
  add column if not exists field_sources jsonb not null default '{}'::jsonb,
  add column if not exists imported_at timestamptz;

comment on column public.cars.country is
  'Market/country code or name for catalog filtering (e.g. NO, Norge).';
comment on column public.cars.field_sources is
  'Per-field provenance: { field: { source_name, source_url, imported_at, import_job_id } }.';
comment on column public.cars.imported_at is
  'Timestamp of the most recent catalog import that touched this row.';
comment on column public.cars.last_import_job_id is
  'Most recent import_jobs.id that created or updated this car.';

update public.cars
set country = coalesce(nullif(trim(country), ''), 'NO')
where country is null or trim(country) = '';

alter table public.cars
  alter column country set default 'NO';

create index if not exists cars_brand_idx on public.cars (brand);
create index if not exists cars_import_status_idx on public.cars (import_status);
create index if not exists cars_country_idx on public.cars (country);
create index if not exists cars_year_idx on public.cars (year);
create index if not exists cars_body_style_idx on public.cars (body_style);
create index if not exists cars_drivetrain_idx on public.cars (drivetrain);
create index if not exists cars_is_published_idx on public.cars (is_published);
create index if not exists cars_slug_trgm_ready_idx on public.cars (slug);

-- ---------------------------------------------------------------------------
-- Import jobs + per-row results
-- ---------------------------------------------------------------------------

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  method text not null check (method in ('csv', 'json', 'api', 'images')),
  status text not null default 'preview'
    check (status in ('preview', 'running', 'completed', 'failed', 'cancelled')),
  filename text,
  source_name text,
  source_url text,
  connector_key text,
  options jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  error_message text
);

comment on table public.import_jobs is
  'Catalog import runs (CSV/JSON/API/images). Preview then apply; history + reports.';

create table if not exists public.import_job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.import_jobs (id) on delete cascade,
  row_number integer,
  slug text,
  car_id uuid references public.cars (id) on delete set null,
  action text not null
    check (action in ('import', 'update', 'skip', 'error', 'warning', 'image')),
  message text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists import_jobs_created_at_idx
  on public.import_jobs (created_at desc);

create index if not exists import_jobs_status_idx
  on public.import_jobs (status);

create index if not exists import_job_items_job_id_idx
  on public.import_job_items (job_id);

create index if not exists import_job_items_slug_idx
  on public.import_job_items (slug);

create index if not exists import_job_items_action_idx
  on public.import_job_items (action);

-- Soft FK from cars → import_jobs (added after jobs table exists)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cars_last_import_job_id_fkey'
  ) then
    alter table public.cars
      add constraint cars_last_import_job_id_fkey
      foreign key (last_import_job_id)
      references public.import_jobs (id)
      on delete set null;
  end if;
end $$;

create index if not exists cars_last_import_job_id_idx
  on public.cars (last_import_job_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for import_jobs
-- ---------------------------------------------------------------------------

create or replace function public.set_import_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists import_jobs_set_updated_at on public.import_jobs;
create trigger import_jobs_set_updated_at
  before update on public.import_jobs
  for each row
  execute function public.set_import_jobs_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: service role manages imports; no public access
-- ---------------------------------------------------------------------------

alter table public.import_jobs enable row level security;
alter table public.import_job_items enable row level security;

drop policy if exists "import_jobs_no_public" on public.import_jobs;
create policy "import_jobs_no_public"
  on public.import_jobs
  for select
  to anon, authenticated
  using (false);

drop policy if exists "import_job_items_no_public" on public.import_job_items;
create policy "import_job_items_no_public"
  on public.import_job_items
  for select
  to anon, authenticated
  using (false);
