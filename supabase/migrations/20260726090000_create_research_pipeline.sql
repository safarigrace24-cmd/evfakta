-- Automated research pipeline (separate from publishing).
-- Findings land as reviewable drafts; never auto-publish cars or images.

-- ---------------------------------------------------------------------------
-- research_jobs
-- ---------------------------------------------------------------------------

create table if not exists public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  brand_name text,
  model_query text,
  provider_key text not null default 'manual'
    check (provider_key in ('manual', 'manufacturer_http', 'structured_json', 'stub')),
  source_mode text not null default 'manual_paste'
    check (source_mode in ('live', 'manual_paste', 'manual_upload', 'structured')),
  status text not null default 'queued'
    check (status in (
      'queued',
      'running',
      'needs_review',
      'applying',
      'completed',
      'failed',
      'cancelled'
    )),
  source_name text,
  source_url text,
  filename text,
  raw_input text,
  options jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  error_message text,
  progress_message text,
  progress_pct integer not null default 0
    check (progress_pct >= 0 and progress_pct <= 100)
);

comment on table public.research_jobs is
  'Automated / manual research runs. Collects draft data for human review; never publishes.';

create index if not exists research_jobs_created_at_idx
  on public.research_jobs (created_at desc);
create index if not exists research_jobs_status_idx
  on public.research_jobs (status);
create index if not exists research_jobs_brand_id_idx
  on public.research_jobs (brand_id);

create or replace function public.set_research_jobs_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists research_jobs_set_updated_at on public.research_jobs;
create trigger research_jobs_set_updated_at
  before update on public.research_jobs
  for each row
  execute function public.set_research_jobs_updated_at();

-- ---------------------------------------------------------------------------
-- research_items — one proposed model (and nested variants in payload)
-- ---------------------------------------------------------------------------

create table if not exists public.research_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.research_jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  sort_order integer not null default 0,
  slug text,
  brand text,
  model text,
  existing_car_id uuid references public.cars (id) on delete set null,
  decision text not null default 'pending'
    check (decision in ('pending', 'approved', 'rejected', 'applied', 'skipped')),
  warnings text[] not null default '{}',
  missing_fields text[] not null default '{}',
  conflicts jsonb not null default '[]'::jsonb,
  proposed_car jsonb not null default '{}'::jsonb,
  proposed_variants jsonb not null default '[]'::jsonb,
  message text
);

comment on table public.research_items is
  'Proposed models/variants from a research job pending admin approve/reject/apply.';

create index if not exists research_items_job_id_idx
  on public.research_items (job_id, sort_order);
create index if not exists research_items_decision_idx
  on public.research_items (decision);
create index if not exists research_items_slug_idx
  on public.research_items (slug);

create or replace function public.set_research_items_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists research_items_set_updated_at on public.research_items;
create trigger research_items_set_updated_at
  before update on public.research_items
  for each row
  execute function public.set_research_items_updated_at();

-- ---------------------------------------------------------------------------
-- research_field_candidates — field-level values with source + confidence
-- ---------------------------------------------------------------------------

create table if not exists public.research_field_candidates (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.research_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  entity_type text not null default 'car'
    check (entity_type in ('car', 'variant')),
  variant_slug text,
  field_key text not null,
  proposed_value jsonb,
  source_name text,
  source_url text,
  retrieved_at timestamptz,
  confidence numeric
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'conflict', 'applied')),
  conflict_group text,
  notes text
);

comment on table public.research_field_candidates is
  'Per-field research values. Conflicts stay as warnings until an admin chooses.';

create index if not exists research_field_candidates_item_id_idx
  on public.research_field_candidates (item_id);
create index if not exists research_field_candidates_status_idx
  on public.research_field_candidates (status);
create index if not exists research_field_candidates_field_idx
  on public.research_field_candidates (item_id, field_key);

-- ---------------------------------------------------------------------------
-- research_image_candidates — never auto-published to gallery
-- ---------------------------------------------------------------------------

create table if not exists public.research_image_candidates (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.research_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  original_url text not null,
  source_name text,
  source_url text,
  license_note text,
  usage_terms text,
  alt_text text,
  image_type text default 'other',
  is_primary_candidate boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'applied')),
  applied_image_id uuid references public.car_images (id) on delete set null,
  storage_path text,
  notes text
);

comment on table public.research_image_candidates is
  'Image candidates for human approval. Applied images upload to Supabase Storage.';

create index if not exists research_image_candidates_item_id_idx
  on public.research_image_candidates (item_id);
create index if not exists research_image_candidates_status_idx
  on public.research_image_candidates (status);

-- ---------------------------------------------------------------------------
-- RLS: admin via service role only; no public policies
-- ---------------------------------------------------------------------------

alter table public.research_jobs enable row level security;
alter table public.research_items enable row level security;
alter table public.research_field_candidates enable row level security;
alter table public.research_image_candidates enable row level security;

-- No anon/authenticated policies — server uses service role.
