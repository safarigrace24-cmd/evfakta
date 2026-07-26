# AGENTS.md

## Cursor Cloud specific instructions

EVFAKTA.no is a single Next.js 16 (App Router, Turbopack, React 19) app backed by
Supabase (Postgres + Auth + Storage). It is a Norwegian EV catalog: public pages
under `app/` browse/compare published cars, and `/admin/*` manages the catalog.
Standard scripts live in `package.json`; migrations in `supabase/migrations/`.

### Commands (see `package.json`)
- Dev server: `npm run dev` (http://localhost:3000)
- Lint / typecheck: `npm run lint` (runs `tsc --noEmit`)
- Tests: `npm test` (node test runner via `tsx`, pure unit tests, no DB needed)
- Seed catalog: `npm run import:cars` (upserts `data/cars.ts` into `public.cars`)

### Supabase is required for real functionality
The app degrades gracefully with no Supabase env (pages return HTTP 200 but the
catalog, auth, favorites, and admin are empty). To exercise core functionality you
must run a local Supabase stack. Docker + the Supabase CLI are installed by the
environment setup, but are NOT started by the update script — start them manually:

1. Start the Docker daemon if it is not running (needs sudo in this VM):
   `sudo dockerd > /tmp/dockerd.log 2>&1 &` then `sudo chmod 666 /var/run/docker.sock`
2. `supabase start` (first run pulls images; applies `supabase/migrations/` and
   then `supabase/seed.sql`). Note the printed `API_URL`, `PUBLISHABLE_KEY`, and
   `SERVICE_ROLE_KEY`.
3. Create `.env.local` (gitignored) with:
   - `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY>`
   - `SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>`
   - `ADMIN_EMAIL=admin@evfakta.no` (any email you will register; grants `/admin`)
4. `npm run import:cars` to seed 4 demo cars.
5. Start (or restart) `npm run dev`. Next.js only reads `.env.local` at process
   start, so if the dev server was already running before you wrote `.env.local`,
   restart it or the catalog will stay empty.

### Non-obvious gotchas
- Grants: the current Supabase CLI does NOT grant DML on new `public` tables to the
  API roles, so without a fix every REST call fails with
  `permission denied for table ...` (even with the service role). `supabase/seed.sql`
  re-adds the standard grants and runs automatically on `supabase start` /
  `supabase db reset`. If you create tables outside a migration+reset cycle, re-run
  the grants from `supabase/seed.sql`.
- `supabase db reset` wipes data; re-run `npm run import:cars` afterward.
- Studio UI is at http://127.0.0.1:54323; email testing (Mailpit) at
  http://127.0.0.1:54324 (use it to confirm signup emails when testing auth).
- Admin access is email-based: sign up a user whose email equals `ADMIN_EMAIL`,
  then visit `/admin`. `/admin` and `/min-side` are gated in `middleware.ts`.
