# EVFAKTA — Final launch blockers resolved

**Date:** 2026-08-02  
**Source:** `docs/FINAL_LAUNCH_QA.md`  
**Scope:** Fix listed launch blockers only — no redesign, no new product features, no schema changes, no commit/push

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | **PASS** |
| `npm test` | **PASS** (182 / 182) |
| `npm run build` | **PASS** (`/personvern` route present) |

---

## Resolutions

### 1. Homepage calculator WIP (C1)
- **Done:** Hub copy for `/kalkulator` no longer says «under utvikling».
- **Copy now:** «Estimer ladekostnad og månedlig strømbruk med egne priser.»
- **Link:** Existing hub card still routes to live `/kalkulator`.
- **Files:** `components/home/platform-hub-section.tsx`

### 2. Privacy policy (C2)
- **Done:** Public page at `/personvern` covering authentication, cookies, Google Maps, browser geolocation, NOBIL, Gemini editorial assistant, Supabase, user accounts, and contact `post@evfakta.no`.
- **Footer:** Linked under Kontakt and in the copyright row.
- **SEO:** Canonical + Open Graph; included in sitemap.
- **Files:** `app/personvern/page.tsx`, `components/layout/site-footer.tsx`, `app/sitemap.ts`

### 3. SEO (H1–H3)
- **Auth metadata:** Added Norwegian titles/descriptions + `robots: { index: false, follow: false }` on `/login`, `/registrer`, `/glemt-passord`, `/oppdater-passord`, `/min-side`.
- **robots.txt:** Added `/glemt-passord` to disallow.
- **Sitemap:** Added `/kalkulator` and `/personvern`; comment updated.
- **Files:** auth pages, `app/robots.ts`, `app/sitemap.ts`

### 4. Charging map WIP conflict (H4)
- **Done:** Removed hardcoded «always WIP» signal for `/ladekart`.
- Nav/hub use `isNavRouteUnderDevelopment()`; map chrome defaults to not showing WIP.
- Optional sync: `NEXT_PUBLIC_CHARGING_MAP_ENABLED=false` forces WIP badge when the public map is intentionally off.
- Server page still hard-gates on `CHARGING_MAP_ENABLED` + keys (Coming Soon when not ready).
- Hub description updated to live NOBIL/kart wording.
- **Files:** `lib/public/feature-flags.ts`, `components/home/platform-hub-section.tsx`, `.env.local.example`

### 5. Header search (H5)
- **Done:** Replaced icon-only `/modeller` link with a real desktop search form (`GET /modeller?q=…`), matching mobile behaviour.
- **Files:** `components/layout/site-header.tsx`, `app/globals.css`

### 6. Image fallback 404 noise (H6)
- **Done:** Missing `imageUrl` no longer requests `/images/cars/{slug}.webp`.
- Immediate letter fallback on cards/heroes; gallery only uses real URLs.
- **Files:** `components/cars/car-image.tsx`, `components/cars/car-gallery.tsx`

### 7. Admin Norwegian UI (H7–H8)
- **Image Review:** UI strings, checklist labels, actions, readiness labels translated to Bokmål (internal status enums unchanged for tests).
- **Editorial Assistant:** Remaining English chrome translated; AI status messages Norwegian.
- **Files:** `components/admin/admin-image-review-workspace.tsx`, `components/admin/admin-editorial-assistant.tsx`, `lib/admin/ai-image-candidates.ts` (checklist labels), `app/admin/editorial-actions.ts` (status text)

### 8. Gemini images (H9)
- **Done:** Kept disabled by default (`GOOGLE_AI_IMAGES_ENABLED=false` in `.env.local.example`).
- No new integration work; existing safe-fail path unchanged.
- **Ops note:** Keep production env `GOOGLE_AI_IMAGES_ENABLED=false` until a real successful image generation is verified. Do not mark images PASS otherwise.

---

## Remaining (non-blocking / out of scope)

- Unfinished tools still in nav with honest WIP: `/rimeligste`, `/verktoy`, `/testdata`
- Gemini image quota/billing remains an external blocker
- Local `.env.local` may still enable experimental flags for development — production should follow `.env.local.example` defaults for images

---

## Database changes

None

## Commit / push

None (per instructions)
