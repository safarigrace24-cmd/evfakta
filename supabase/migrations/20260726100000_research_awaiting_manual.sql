-- Allow research jobs blocked by manufacturer anti-bot to await manual input
-- instead of ending as a hard failure.

alter table public.research_jobs
  drop constraint if exists research_jobs_status_check;

alter table public.research_jobs
  add constraint research_jobs_status_check
  check (status in (
    'queued',
    'running',
    'awaiting_manual',
    'needs_review',
    'applying',
    'completed',
    'failed',
    'cancelled'
  ));

comment on column public.research_jobs.status is
  'queued|running|awaiting_manual|needs_review|applying|completed|failed|cancelled. awaiting_manual = live fetch blocked; admin continues with paste/upload.';
