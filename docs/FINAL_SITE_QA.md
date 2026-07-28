# EVFAKTA — Final site QA (production readiness)

**Date:** 2026-07-28  
**Scope:** Public website only  
**Method:** Code review + live route checks against local `next dev`  
**Constraints honored:** Audit only — no redesign, no feature work, no CMS/DB changes, no commit/push

---

## Executive summary

Core product surfaces (homepage, models, model detail, compare) feel close to launch-ready visually. Remaining risk is concentrated in **routing/SEO soft-404s**, **auth hygiene**, **nav advertising unfinished tools**, and **account/favorites polish lagging the catalog**.

Highest-impact cluster before go-live:

1. Catch-all `app/[slug]` returns **HTTP 200** “Kommer snart” for unknown URLs  
2. Sitemap lists pages marked `noindex`  
3. Root layout forces `canonical: "/"` for pages without their own canonical  
4. Login logs full auth responses to the browser console  
5. Five unfinished tools sit in main nav/footer without WIP labels  

---

## Coverage checklist

| Surface | Reviewed | Notes |
|---------|----------|--------|
| Homepage `/` | Yes | Polished; hub labels WIP correctly |
| Models `/modeller` | Yes | Strong filters, skeletons, empty states |
| Model detail `/modeller/[slug]` | Yes | Strong layout; image fallbacks fire 404s |
| Compare `/sammenlign` | Yes | Strong UX; weaker image error handling |
| Calculator `/kalkulator` | Yes | Honest coming-soon |
| Used EV `/bruktbil` | Yes | Solid guide; related models heuristic |
| Info `/info` | Yes | Content OK; contradicts live nav policy |
| Navigation | Yes | Dense; WIP unlabeled in chrome |
| Footer | Yes | Mirrors WIP nav; Merker missing |
| Search | Yes | Home/mobile OK; header icon is not search |
| Login `/login` | Yes | Works when env set; noisy logs; no metadata |
| Register `/registrer` | Yes | Same metadata/env gaps |
| Forgot password `/glemt-passord` | Yes | Missing from robots disallow |
| My page `/min-side` | Yes | Functional; thin empty favorites |
| Favorites | Yes | Toggle on cards; Min side list incomplete |
| Rimeligste / Verktøy / Testdata / Ladekart | Yes | Coming-soon; in nav + sitemap |
| Merker `/merker` | Yes | Works; underlinked in chrome |
| 404 | Yes | UI exists; catch-all often blocks it |
| Error pages | Yes | **No** `app/error.tsx` / `global-error.tsx` |
| SEO / OG / structured data | Yes | Root OG/Twitter OK; gaps on auth + WIP |
| Images | Yes | Brand/OG present; `/images/cars/*` missing on disk |
| Mobile / tablet / desktop | Yes | Breakpoint ~1180px; drawer a11y gaps |

---

## Critical

### C1 — Unknown URLs soft-404 via catch-all
- **Page:** global (`app/[slug]/page.tsx`)
- **Description:** Paths like `/personvern` and `/foobar-xyz` render a “Kommer snart” placeholder with **HTTP 200**. `app/not-found.tsx` never runs for those URLs. Confirmed live: `/foobar-xyz` → 200 + “Kommer snart”.
- **Suggested fix:** Call `notFound()` (or remove the catch-all) so unknown routes return a real 404.
- **Priority:** Critical

### C2 — Login logs full auth payloads
- **Page:** `/login` (`components/auth/login-form.tsx`)
- **Description:** Production path always `console.log`s the full `signInWithPassword` response (and errors). Session/user details can leak into browser consoles and monitoring.
- **Suggested fix:** Remove logs or gate strictly behind `NODE_ENV === "development"`; never log auth payloads.
- **Priority:** Critical

### C3 — Root layout canonical is always `/`
- **Page:** global SEO (`app/layout.tsx`)
- **Description:** Root metadata sets `alternates.canonical: "/"`. Auth, coming-soon, catch-all, and other pages without their own canonical can inherit homepage as canonical — wrong indexing signals.
- **Suggested fix:** Remove root-level canonical (set it only on `/`) and add per-route canonicals / `robots: noindex` where appropriate.
- **Priority:** Critical

### C4 — Sitemap includes noindex tool pages
- **Page:** SEO (`app/sitemap.ts` vs `/kalkulator`, `/rimeligste`, `/verktoy`, `/testdata`, `/ladekart`)
- **Description:** Sitemap lists unfinished tool routes while those pages set `robots: { index: false }`. Conflicting crawl instructions.
- **Suggested fix:** Drop noindex routes from the sitemap (keep URLs reachable if desired).
- **Priority:** Critical

---

## High

### H1 — No branded runtime error boundary
- **Page:** global
- **Description:** No `app/error.tsx` or `app/global-error.tsx`. Runtime failures fall to the default Next.js error experience.
- **Suggested fix:** Add a branded public `error.tsx` (and optionally `global-error.tsx`) with retry + home/catalog CTAs.
- **Priority:** High

### H2 — Auth and Min side lack page metadata
- **Page:** `/login`, `/registrer`, `/glemt-passord`, `/oppdater-passord`, `/min-side`
- **Description:** These routes export no `metadata`. Browser tabs and shares inherit homepage title/OG/Twitter; account pages look unfinished and may be treated as homepage duplicates.
- **Suggested fix:** Add titles/descriptions and `robots: { index: false }` on all account flows.
- **Priority:** High

### H3 — Header “search” is only a catalog link
- **Page:** Navigation / Search (`components/layout/site-header.tsx`)
- **Description:** Desktop search control is `<Link href="/modeller">` with a magnifying-glass icon. It looks like search but does not search. Home and mobile offer real `?q=` search.
- **Suggested fix:** Open an inline search field, or deep-link to `/modeller` with a focused search UI / query param and matching label.
- **Priority:** High

### H4 — Unfinished tools in nav/footer without WIP labels
- **Page:** Navigation, Footer, Calculator and related
- **Description:** Five destinations (`/kalkulator`, `/rimeligste`, `/verktoy`, `/testdata`, `/ladekart`) are unfinished. Homepage hub badges “Under utvikling”; header/footer show plain labels. Users hit dead ends from chrome.
- **Suggested fix:** Badge unfinished items in nav/footer (reuse hub pattern), or move them behind a secondary group.
- **Priority:** High

### H5 — Auth hard-fails when Supabase env is missing
- **Page:** `/login`, `/registrer` (and related forms)
- **Description:** `createClient()` → `requireSupabaseEnv()` throws. Forms crash instead of showing the soft “Autentisering er ikke konfigurert” message already used for `?error=config`.
- **Suggested fix:** Guard forms with a non-throwing env check and show a friendly config error in the UI.
- **Priority:** High

### H6 — Info page contradicts live navigation policy
- **Page:** `/info`
- **Description:** Kildepolicy states unfinished features are kept **out** of main navigation, while `config/site.ts` + `lib/public/feature-flags.ts` intentionally keep them **in** nav.
- **Suggested fix:** Align Info copy with the locked IA (or change IA to match the published policy).
- **Priority:** High

### H7 — Missing local car image assets cause request noise
- **Page:** Models, Model detail, Homepage, Favorites
- **Description:** `public/images/` does not exist. `CarImage` falls back to `/images/cars/{slug}.webp` → 404, then `onError` letter fallback. Live logs show e.g. `/images/cars/byd-seal-u.webp` 404. Extra failed requests and brief broken-image flashes.
- **Suggested fix:** Ensure every published car has a real `imageUrl`, or stop emitting missing local paths and use an immediate letter/placeholder.
- **Priority:** High

### H8 — Mobile drawer focus management incomplete
- **Page:** Navigation (mobile ≤1180px)
- **Description:** Closed drawer uses `aria-hidden` but remains in the layout (`translateX`); links can stay tabbable. No Escape-to-close or focus trap while open (`site-header.tsx`).
- **Suggested fix:** Use `inert`/visibility when closed; trap focus when open; close on Escape.
- **Priority:** High

### H9 — Desktop nav overcrowding
- **Page:** Navigation
- **Description:** Full 10-link platform nav + socials only collapses at ≤1180px. Between ~1181–1400px links wrap/crowd and feel unfinished (13px tight padding).
- **Suggested fix:** Raise hamburger breakpoint, shorten primary set, or add an overflow “Mer” for secondary tools.
- **Priority:** High

### H10 — Missing-model 404 status should be verified in production
- **Page:** `/modeller/[slug]`
- **Description:** Page calls `notFound()` and UI shows “Siden ble ikke funnet”, but local `next dev` responses for unknown model slugs were observed as **HTTP 200** while streaming. Soft-404 risk for crawlers if this persists in production.
- **Suggested fix:** Verify status with a production build; ensure `notFound()` yields HTTP 404 (and consider `notFound()` from `generateMetadata` when the car is missing).
- **Priority:** High

---

## Medium

### M1 — Favorites empty state on Min side is thin
- **Page:** `/min-side` / Favorites (`components/favorites/favorite-cars-list.tsx`)
- **Description:** Empty copy is a single line with no CTA to catalog or compare — weaker than catalog empty states.
- **Suggested fix:** Use shared `EmptyState` + links to `/modeller` and `/sammenlign`.
- **Priority:** Medium

### M2 — Cannot unfavorite from Min side list
- **Page:** `/min-side` / Favorites
- **Description:** List rows link to detail only; no remove/toggle. Users must leave Min side to unfavorite.
- **Suggested fix:** Add a favorite toggle/remove control on each row.
- **Priority:** Medium

### M3 — Loading skeletons missing outside catalog/compare
- **Page:** Homepage, Merker, Bruktbil, Info, Auth, Coming soon
- **Description:** Only `/modeller`, `/modeller/[slug]`, and `/sammenlign` have `loading.tsx`. Other `force-dynamic` routes can flash blank while data loads.
- **Suggested fix:** Add route-level skeletons for high-traffic public pages at minimum (home, merker, bruktbil).
- **Priority:** Medium

### M4 — Merker underlinked in chrome
- **Page:** `/merker`, Navigation, Footer
- **Description:** Merker is a real catalog surface but omitted from header and footer; only homepage features/brands deep-link it.
- **Suggested fix:** Add Merker to footer (and/or secondary nav) for discoverability.
- **Priority:** Medium

### M5 — Twitter cards rarely overridden per page
- **Page:** SEO (most public pages)
- **Description:** Only root layout sets `twitter:`. Child OG titles/descriptions may not fully propagate to Twitter card text for models/compare/info shares.
- **Suggested fix:** Set `twitter` (or rely on documented OG→Twitter inheritance) on important public pages.
- **Priority:** Medium

### M6 — robots.txt gaps for account recovery
- **Page:** SEO (`app/robots.ts`)
- **Description:** Disallows `/login`, `/registrer`, `/oppdater-passord`, `/min-side` but not `/glemt-passord` or `/auth/`.
- **Suggested fix:** Add `/glemt-passord` and `/auth/` to `disallow`.
- **Priority:** Medium

### M7 — Compare thumbnails lack image error fallback
- **Page:** `/sammenlign` (`components/compare/compare-client.tsx`)
- **Description:** Thumbs use raw `next/image` with `car.imageUrl` and no `onError`. Broken remotes stay broken (unlike `CarImage`).
- **Suggested fix:** Reuse `CarImage` or add letter/`onError` fallback.
- **Priority:** Medium

### M8 — Gallery thumbs lack onError
- **Page:** Model detail (`components/cars/car-gallery.tsx`)
- **Description:** Main image can fall back; a bad thumb can stay broken.
- **Suggested fix:** Add per-thumb error fallback.
- **Priority:** Medium

### M9 — Update-password page does not gate on recovery session
- **Page:** `/oppdater-passord`
- **Description:** Cold visits get a full form; failure only appears after submit via generic auth errors.
- **Suggested fix:** Require recovery session (or hash/code) and redirect to login/forgot with a clear message.
- **Priority:** Medium

### M10 — Auth / Min side visual tier lag
- **Page:** Login, Register, Forgot password, Min side
- **Description:** Thin `authPanel` / `accountCard` patterns feel less finished than DS2 catalog pages (spacing, empty states, page chrome).
- **Suggested fix:** Reuse pageHeader/prose patterns and stronger empty/error states without redesigning the system.
- **Priority:** Medium

### M11 — Bruktbil related models are hard-coded filters
- **Page:** `/bruktbil`
- **Description:** Related cars filtered by string heuristics (Model Y/3, Leaf, e-Golf). Empty catalog yields a weak paragraph vs shared empty patterns.
- **Suggested fix:** Prefer data-driven related set + shared `EmptyState` when none match.
- **Priority:** Medium

### M12 — Footer always links Min side for guests
- **Page:** Footer
- **Description:** Guests clicking “Min side” are redirected to login — functional but unlabeled as an account gate.
- **Suggested fix:** Show “Logg inn” when logged out, or clarify Min side as account.
- **Priority:** Medium

### M13 — LinkedIn URL includes admin query param
- **Page:** Footer / social (`config/site.ts`)
- **Description:** LinkedIn href includes `?viewAsMember=true` — a personal admin view param on a public link.
- **Suggested fix:** Use the clean company URL.
- **Priority:** Medium

### M14 — Model Open Graph image optional
- **Page:** Model detail SEO
- **Description:** `openGraph.images` only set when `car.imageUrl` exists; otherwise shares fall back to site OG, not the car.
- **Suggested fix:** Fall back to brand OG or a stable default car card image.
- **Priority:** Medium

### M15 — Unused `--font-dm-sans` token
- **Page:** global (`app/globals.css`, `app/layout.tsx`)
- **Description:** CSS stack references `--font-dm-sans` but layout only loads Inter — dead token / incomplete type setup.
- **Suggested fix:** Load DM Sans or remove the unused variable.
- **Priority:** Medium

### M16 — Register logs signup failures in production
- **Page:** `/registrer` (`components/auth/register-form.tsx`)
- **Description:** Always `console.error`s signup failures — noisy and potentially sensitive in shared devices/monitoring.
- **Suggested fix:** Dev-only logging; mapped user-facing errors only in production.
- **Priority:** Medium

### M17 — Coming-soon pages feel over-advertised
- **Page:** Calculator and related tools
- **Description:** On-page copy is honest, but nav + sitemap advertise tools that immediately say “not ready” and are noindex — unfinished product feel at chrome level.
- **Suggested fix:** Keep URLs; exclude from sitemap; mark nav as WIP (ties to C4 / H4).
- **Priority:** Medium

---

## Low

### L1 — 404 page underused because of catch-all
- **Page:** 404 (`app/not-found.tsx`)
- **Description:** 404 UI is fine (eyebrow, CTAs to models/home) but many unknown paths never reach it (see C1).
- **Suggested fix:** Fix catch-all first; 404 then becomes real unknown-route UX.
- **Priority:** Low

### L2 — Homepage has no explicit page metadata export
- **Page:** Homepage
- **Description:** Relies entirely on root metadata — OK today, brittle if root defaults change.
- **Suggested fix:** Optional explicit homepage metadata for clarity.
- **Priority:** Low

### L3 — Organization JSON-LD on soft placeholders
- **Page:** global structured data
- **Description:** Org schema is injected on every page, including catch-all “coming soon” documents that should not be indexable.
- **Suggested fix:** Resolve soft-404s (C1); keep Org schema on real pages only as needed.
- **Priority:** Low

### L4 — Brand outbound `rel` inconsistency
- **Page:** `/merker/[slug]`
- **Description:** Brand site links use `rel="noreferrer"` only vs `noopener noreferrer` elsewhere.
- **Suggested fix:** Standardize `rel="noopener noreferrer"`.
- **Priority:** Low

### L5 — Winter range vs Testdata messaging
- **Page:** Model detail / `/testdata`
- **Description:** Detail can show `winterRangeKm` while Testdata says independent tests are not ready — users may read winter as EVFAKTA-tested.
- **Suggested fix:** Label winter as producer/source value, or hide until testdata policy allows.
- **Priority:** Low

### L6 — Sitemap base URL hard-coded
- **Page:** SEO (`app/sitemap.ts`)
- **Description:** Hardcodes `https://www.evfakta.no` instead of always deriving from `siteConfig` / env — brittle for staging.
- **Suggested fix:** Derive base URL from `siteConfig.url`.
- **Priority:** Low

### L7 — Favorite icon feedback is easy to miss
- **Page:** Models / Model detail
- **Description:** Icon-only favorite success can feel transient on dense grids.
- **Suggested fix:** Keep icon; ensure short, clear live-region feedback (detail already has stronger labeled control).
- **Priority:** Low

### L8 — Admin header has no mobile treatment
- **Page:** Admin chrome (out of public launch scope)
- **Description:** Admin header branch has no hamburger treatment on small screens.
- **Suggested fix:** Minimal admin mobile nav if admins use phones.
- **Priority:** Low

---

## Nice to have

### N1 — Instagram header vs footer
- **Page:** Navigation / Footer
- **Description:** Instagram is in footer `socialLinks` but omitted from `headerSocialLinks` — documented as intentional in `config/site.ts`.
- **Suggested fix:** Keep as-is, or add Instagram to header if parity is desired.
- **Priority:** Nice to have

### N2 — Reuse hub WIP badges in chrome
- **Page:** Navigation / Footer
- **Description:** Platform hub correctly badges unfinished tools; chrome does not.
- **Suggested fix:** Reuse the same badge copy in header/footer for consistency.
- **Priority:** Nice to have

### N3 — Skip link vs sticky header
- **Page:** Accessibility
- **Description:** Skip link to `#main-content` exists with focus styles — solid baseline.
- **Suggested fix:** Optionally ensure sticky header does not obscure the focused first heading.
- **Priority:** Nice to have

### N4 — OG asset present and referenced
- **Page:** SEO
- **Description:** `/brand/og-image.png` exists and is wired in root metadata — good.
- **Suggested fix:** Keep paths in sync with `siteConfig.brand.ogImage`.
- **Priority:** Nice to have

### N5 — Compare is indexable (no conflict)
- **Page:** `/sammenlign`
- **Description:** Compare is indexable and in sitemap without a robots conflict (unlike coming-soon tools).
- **Suggested fix:** No change unless empty-state indexing becomes a concern.
- **Priority:** Nice to have

---

## What already feels finished

These areas do **not** need redesign; they read as production-quality for a real user:

- Homepage composition, search, section rhythm, platform hub honesty  
- Models catalog: sticky filters, debounce, skeletons, empty states, card polish  
- Model detail: sticky aside, gallery controls, grouped tech, sources, related  
- Compare: picker, search, grouped rows, sticky header/first column, “Best” markers  
- Bruktbil / Info: clear editorial tone and useful structure  
- Coming-soon pages: honest on-page copy and CTAs back to catalog/compare  
- Brand assets, root OG/Twitter, Organization JSON-LD, Car JSON-LD on model pages  
- Skip link, many focus-visible treatments on polished catalog surfaces  

---

## Suggested fix order (for a later pass — not done here)

1. **Routing/SEO:** C1, C3, C4, H10  
2. **Auth hygiene:** C2, H2, H5, M6, M16  
3. **Chrome honesty:** H4, H3, H6, M17  
4. **Images/a11y:** H7, H8, M7, M8  
5. **Account polish:** M1, M2, M10, M9  
6. **Remainder:** H1, H9, Medium/Low/Nice  

---

## Verification notes

Live checks against local `next dev` (2026-07-28):

| Route | HTTP | Observation |
|-------|------|-------------|
| `/` | 200 | OK |
| `/modeller` | 200 | OK |
| `/sammenlign` | 200 | OK |
| `/kalkulator` | 200 | Coming soon |
| `/bruktbil` | 200 | OK |
| `/info` | 200 | OK |
| `/login` | 200 | OK |
| `/registrer` | 200 | OK |
| `/glemt-passord` | 200 | OK |
| `/min-side` | 307 | Redirects to login when logged out |
| `/merker` | 200 | OK |
| `/rimeligste` | 200 | Coming soon |
| `/foobar-xyz` | 200 | Soft “Kommer snart” (should be 404) |
| `/personvern` | 200 | Soft “Kommer snart” (should be 404) |
| `/modeller/nonexistent-car-zzz` | 200* | 404 UI present; status needs prod verification |
| `/brand/og-image.png` | 200 | Present |
| `/images/cars/byd-seal-u.webp` | 404 | Missing local asset |

\*Observed under `next dev` streaming; re-check with production build before launch.

---

*End of audit. No code changes were made for this report.*
