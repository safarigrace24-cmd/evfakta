-- Ingestion / review metadata for public.cars (all nullable for existing rows).
-- Approval (import_status) is separate from publishing (is_published).
-- New cars keep is_published default false; import_status defaults to draft.

alter table public.cars
  add column if not exists source_url text,
  add column if not exists source_name text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists data_last_checked_at timestamptz,
  add column if not exists import_status text,
  add column if not exists import_notes text;

alter table public.cars drop constraint if exists cars_import_status_check;

alter table public.cars
  add constraint cars_import_status_check
  check (
    import_status is null
    or import_status in ('draft', 'needs_review', 'approved')
  );

alter table public.cars
  alter column import_status set default 'draft';

-- Existing rows: treat missing status as draft without changing publish state.
update public.cars
set import_status = 'draft'
where import_status is null;

-- Ensure publish default remains false for new inserts.
alter table public.cars
  alter column is_published set default false;
