-- EVFAKTA Score fields (manual editorial scores only — never auto-generated).
-- All score columns are nullable. Overall score is also manually set.

alter table public.cars
  add column if not exists range_score numeric,
  add column if not exists charging_score numeric,
  add column if not exists winter_score numeric,
  add column if not exists comfort_score numeric,
  add column if not exists space_score numeric,
  add column if not exists value_score numeric,
  add column if not exists reliability_score numeric,
  add column if not exists overall_score numeric,
  add column if not exists score_notes text,
  add column if not exists score_methodology text;

alter table public.cars drop constraint if exists cars_range_score_check;
alter table public.cars drop constraint if exists cars_charging_score_check;
alter table public.cars drop constraint if exists cars_winter_score_check;
alter table public.cars drop constraint if exists cars_comfort_score_check;
alter table public.cars drop constraint if exists cars_space_score_check;
alter table public.cars drop constraint if exists cars_value_score_check;
alter table public.cars drop constraint if exists cars_reliability_score_check;
alter table public.cars drop constraint if exists cars_overall_score_check;

alter table public.cars
  add constraint cars_range_score_check
    check (range_score is null or (range_score >= 0 and range_score <= 10)),
  add constraint cars_charging_score_check
    check (charging_score is null or (charging_score >= 0 and charging_score <= 10)),
  add constraint cars_winter_score_check
    check (winter_score is null or (winter_score >= 0 and winter_score <= 10)),
  add constraint cars_comfort_score_check
    check (comfort_score is null or (comfort_score >= 0 and comfort_score <= 10)),
  add constraint cars_space_score_check
    check (space_score is null or (space_score >= 0 and space_score <= 10)),
  add constraint cars_value_score_check
    check (value_score is null or (value_score >= 0 and value_score <= 10)),
  add constraint cars_reliability_score_check
    check (reliability_score is null or (reliability_score >= 0 and reliability_score <= 10)),
  add constraint cars_overall_score_check
    check (overall_score is null or (overall_score >= 0 and overall_score <= 10));

comment on column public.cars.range_score is 'Manual EVFAKTA score 0–10 for range.';
comment on column public.cars.overall_score is 'Manual overall EVFAKTA score 0–10. Not auto-derived.';
comment on column public.cars.score_methodology is 'Editorial methodology text shown publicly when scores exist.';
