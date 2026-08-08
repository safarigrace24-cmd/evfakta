-- Local development seed.
-- Runs automatically after migrations on `supabase start` and `supabase db reset`.
--
-- The current Supabase CLI does NOT grant DML on new public tables to the
-- API roles by default, so REST calls (including the service role used by the
-- app and import scripts) fail with "permission denied for table ...".
-- Hosted Supabase projects already have these grants; this re-creates them
-- locally so the app works out of the box. This file is local-only and is
-- never applied to a remote/hosted database.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;
