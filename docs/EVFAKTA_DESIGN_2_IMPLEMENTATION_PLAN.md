# EVFAKTA Design System 2.0 — Implementation Plan

**Status:** Ready for implementation  
**Scope:** Public website only  
**Source of truth:** `docs/EVFAKTA_DESIGN_SYSTEM_2.md`  
**Related:** `docs/LAUNCH_CHECKLIST.md`  
**Note:** `docs/PUBLIC_VISUAL_MIGRATION_CHECKLIST.md` is not present in the repo (removed earlier).

---

## 1. Brand asset inventory

| Asset | Status | Action |
|-------|--------|--------|
| EVFAKTA logo (SVG/PNG in `public/`) | **Missing** — no `public/` brand files found | Keep existing text wordmark (`EV` mark + `FAKTA.no`); do not invent a logo |
| Favicon / app icons | **Missing** | Document gap; do not invent |
| Brand logos (manufacturer) | Exist via Supabase `brand-logos` | Continue using CMS `logo_url` |
| Social media URLs | **Not in repo** (`config/site.ts` only has email) | Do not invent handles; footer omits social until real URLs exist |
| Contact email | Present: `kontakt@evfakta.no` | Reuse |

---

## 2. Files to change

### Foundations
- `app/layout.tsx` — Geist/Inter font, public/admin body class isolation
- `app/globals.css` — DS2 tokens + public component restyle (preserve `.admin*` visuals via `.adminApp` token lock)
- `config/site.ts` — Nav: Modeller, Merker, Sammenlign; no unfinished tools

### Chrome
- `components/layout/site-header.tsx` — DS2 nav, search entry, wordmark
- `components/layout/site-footer.tsx` — Real links only, disclaimer, no invented socials
- `components/layout/app-shell.tsx` *(new)* — Path-based `publicApp` / `adminApp`
- `components/brand/wordmark.tsx` *(new)* — Reusable text wordmark

### Homepage
- `app/page.tsx` — Counts from published data; brands section
- `components/home/hero-section.tsx` — Headline, search, CTAs; remove unfinished tool promo
- `components/home/popular-models-section.tsx` — Compact cards
- `components/home/popular-brands-section.tsx` *(new)*
- `components/home/trust-section.tsx` *(new)* — Trust messaging without fake stats
- `components/home/features-section.tsx` — Remove calculator promo; keep real paths
- `components/home/home-search.tsx` *(new)* — Hero search → `/modeller?q=`

### Cards / cars
- `components/cars/car-card.tsx` — Specs, “Se fakta →”, no zero/price/score leaks
- `components/cars/car-variant-detail.tsx` — Premium section order, sanitize draft copy
- `components/cars/car-gallery.tsx` / `car-hero.tsx` / `fact-grid.tsx` — Visual polish only
- `lib/public/sanitize-public-copy.ts` *(new)* — Strip draft markers from public strings

### Catalog / brands / compare / auth
- `app/modeller/models-client.tsx` — Chips, mobile filter sheet, zero state
- `app/modeller/page.tsx` — Metadata copy (no price/score claims)
- `app/merker/page.tsx`, `app/merker/[slug]/page.tsx` — DS2 brand cards
- `components/compare/compare-client.tsx` — Sticky headers/column, Best label, hide empty rows
- `app/login|registrer|glemt-passord|oppdater-passord|min-side/page.tsx` + auth forms — Calm single-column
- `app/kalkulator/page.tsx` — Leave as stub; keep out of nav (no redesign of unfinished tool)

### Docs (this wave)
- `docs/EVFAKTA_DESIGN_2_IMPLEMENTATION_PLAN.md` (this file)
- `docs/EVFAKTA_DESIGN_2_IMPLEMENTATION_REPORT.md` (after implementation)

---

## 3. Reusable components to create

| Component | Purpose |
|-----------|---------|
| `AppShell` | Isolates public vs admin CSS variable sets |
| `Wordmark` | Official text brand treatment until logo file exists |
| `HomeSearch` | Large hero search field |
| `PopularBrandsSection` | Published brand cards + counts |
| `TrustSection` | Sources / independence messaging |
| `sanitizePublicCopy` | Hide draft markers on public pages |
| Filter chip row / mobile filter drawer (in models-client) | Catalog UX |

---

## 4. Page migration order

1. Tokens + typography + AppShell isolation  
2. Header / footer / wordmark  
3. Homepage (hero, search, models, brands, trust)  
4. Model cards + grids  
5. Catalog `/modeller`  
6. Brands index + detail  
7. Model detail  
8. Compare  
9. Auth + Min side  
10. Metadata / trust copy cleanup  
11. Report + lint/test/build  

---

## 5. Risks

| Risk | Mitigation |
|------|------------|
| Shared `globals.css` bleeds into admin | Lock legacy tokens under `.adminApp` |
| Missing logo file | Text wordmark only; document gap |
| Draft markers on published content | Sanitize at render; launch gates still block new publish |
| Features section links to `/kalkulator` | Remove from marketing; stub route remains |
| Large CSS churn | Prefer token + section updates over rewriting admin CSS |
| Image domains | Keep existing `**.supabase.co` remotePatterns |

---

## 6. Compatibility notes

- Do **not** change schema, migrations, publish rules, image approval, or admin workflows  
- Keep `PUBLIC_SHOW_PRICES` / `PUBLIC_SHOW_SCORES` false  
- Variant URL `?variant=` and compare shareable URLs stay  
- Favorites / auth behavior unchanged  
- Admin routes stay functional; visual tokens locked to pre-DS2 values  

---

## 7. Test plan

- `npm run lint`  
- `npm test`  
- `npm run build`  
- Manual routes: `/`, `/modeller`, `/merker`, `/merker/[slug]`, `/modeller/[slug]`, `/sammenlign`, `/login`, `/registrer`, `/glemt-passord`, `/oppdater-passord`, `/min-side`, `/admin` (unchanged)  
- Viewports: 375 / 768 / 1024 / 1440  
- A11y: skip link, focus rings, labels, reduced motion  
- Confirm no horizontal overflow except compare table  
- Confirm no draft marker text, no fake counts, no unfinished nav items  

---

## 8. Explicit non-goals

- No commit / push  
- No new backend features  
- No guide/calculator product build  
- No invented social URLs or logo artwork  
`}