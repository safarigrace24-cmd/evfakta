# Launch blockers fix report

**Date:** 2026-07-28  
**Source:** `docs/FINAL_SITE_QA.md` P0 items  
**Constraints:** No redesign, no new features, no CMS/DB changes, no commit/push

---

## Summary

All five launch-blocking P0 items plus a basic public `error.tsx` are fixed. Lint, 96 tests, and production build pass. Manual production-server checks confirm real 404s, honest WIP nav, cleaned sitemap, and route-specific canonicals.

---

## Blockers fixed

### 1. Catch-all soft 404

| | |
|---|---|
| **Blocker** | Unknown routes (`/foobar-xyz`, `/personvern`) returned HTTP 200 “Kommer snart” |
| **Files changed** | `app/[slug]/page.tsx`, `app/not-found.tsx`, `app/modeller/[slug]/page.tsx` |
| **Fix implemented** | Catch-all now calls `notFound()`. `not-found.tsx` keeps Norwegian empty-state UI + `robots: noindex`. Missing models also call `notFound()` from `generateMetadata`. Known unfinished routes keep their own pages. |
| **Verification** | Production `next start`: `/foobar-xyz` → **404** “Siden ble ikke funnet”; `/personvern` → **404**; `/kalkulator`–`/ladekart` → **200** with “Under utvikling” |

### 2. Sitemap includes noindex tools

| | |
|---|---|
| **Blocker** | Sitemap listed unfinished tools that set `robots: { index: false }` |
| **Files changed** | `app/sitemap.ts` |
| **Fix implemented** | Removed `/kalkulator`, `/rimeligste`, `/verktoy`, `/testdata`, `/ladekart`. Kept indexable static routes (`/`, `/modeller`, `/sammenlign`, `/bruktbil`, `/info`, `/merker`) plus published cars/brands. Base URL from `siteConfig.url`. |
| **Verification** | `/sitemap.xml` contains home/catalog/guides/merker + published models/brands; unfinished tools **absent** |

### 3. Root canonical forced to `/`

| | |
|---|---|
| **Blocker** | Root layout set `alternates.canonical: "/"`, wrong signals on pages without own canonical |
| **Files changed** | `app/layout.tsx`, `app/page.tsx` |
| **Fix implemented** | Removed global canonical from root layout; kept `metadataBase`. Homepage sets `canonical: "/"`. Existing route canonicals unchanged for modeller, sammenlign, bruktbil, info, merker, model/brand detail. |
| **Verification** | Live HTML: `/` → `https://www.evfakta.no`; `/modeller` → `…/modeller`; `/sammenlign` → `…/sammenlign`; `/bruktbil` → `…/bruktbil`; `/info` → `…/info` |

### 4. Authentication response logging

| | |
|---|---|
| **Blocker** | Login `console.log`’d full Supabase auth responses; register logged signup errors |
| **Files changed** | `components/auth/login-form.tsx`, `components/auth/register-form.tsx` |
| **Fix implemented** | Removed all auth `console.log` / `console.error` of responses, errors, and exceptions. User-facing errors still via `mapAuthError`. Login/register behavior unchanged. |
| **Verification** | `rg` on `components/auth` shows no console logging left |

### 5. Unfinished navigation honesty

| | |
|---|---|
| **Blocker** | Unfinished tools in header/footer without “Under utvikling” |
| **Files changed** | `lib/public/feature-flags.ts`, `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`, `app/globals.css`, `app/info/page.tsx` |
| **Fix implemented** | Added `isNavRouteUnderDevelopment()`. Desktop nav, mobile nav, and footer show restrained “Under utvikling” badges + `aria-label` for Kalkulator, Rimeligste, Verktøy, Testdata, Ladestasjoner. Routes kept. Info kildepolicy updated to match IA (uferdige synlige og merket). Admin chrome unchanged. |
| **Verification** | Homepage HTML includes `navWipBadge` / “Under utvikling”; full platform link set retained |

### 6. Public error boundary (in-scope)

| | |
|---|---|
| **Blocker** | No branded public `error.tsx` |
| **Files changed** | `app/error.tsx` |
| **Fix implemented** | Norwegian copy, “Prøv igjen” (`reset`), “Til forsiden”. No stack traces in UI. Digest-only server log if present. |
| **Verification** | Build includes route; component is client error boundary per Next.js conventions |

---

## Verification commands

```text
npm run lint   → pass (tsc --noEmit)
npm test       → 96 pass / 0 fail
npm run build  → pass
```

Manual (`next start` on port 3010):

| Check | Result |
|-------|--------|
| Unknown route 404 | Pass |
| Known unfinished routes 200 | Pass |
| Unfinished tools absent from sitemap | Pass |
| Canonicals for `/`, modeller, sammenlign, bruktbil, info | Pass |
| No sensitive auth console logs | Pass |
| Nav WIP labels present | Pass |
| Admin header untouched | Pass (admin branch unchanged) |

---

## Remaining non-blocking QA items

From `docs/FINAL_SITE_QA.md` — **not** fixed in this pass:

- Header search icon still links to `/modeller` (not inline search)
- Auth/min-side missing page-level `robots: noindex` metadata
- Auth hard-fail when Supabase env missing (friendly UI guard)
- Mobile drawer focus trap / Escape / `inert`
- Desktop nav density / breakpoint crowding
- Favorites empty state + unfavorite on Min side
- Loading skeletons outside catalog/compare
- Merker underlinked in chrome
- Compare/gallery image `onError` fallbacks
- Missing local `/images/cars/*` fallback request noise
- Twitter card overrides per page
- `robots.ts` gaps (`/glemt-passord`, `/auth/`)
- Update-password session gating
- LinkedIn `?viewAsMember=true` query param
- Unused `--font-dm-sans` token

---

*No commit or push was made.*
