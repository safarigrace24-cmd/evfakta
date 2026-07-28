# EVFAKTA Design System 2.0 — Implementation Report

**Date:** 2026-07-28  
**Scope:** Public website redesign only  
**Source of truth:** `docs/EVFAKTA_DESIGN_SYSTEM_2.md`  
**Plan:** `docs/EVFAKTA_DESIGN_2_IMPLEMENTATION_PLAN.md`

---

## Verification

| Check | Result |
|-------|--------|
| `npm run lint` | Pass |
| `npm test` | Pass (96 tests) |
| `npm run build` | Pass |
| Schema / migrations | None changed |
| Publish / image approval rules | Unchanged |
| Commit / push | Not performed |

---

## Pages completed

| Route | Status | Notes |
|-------|--------|-------|
| `/` | Done | DS2 hero, search, published model/brand counts, trust |
| `/modeller` | Done | Filters, chips, mobile filter sheet, zero state |
| `/modeller/[slug]` | Done | Sectioned layout, sanitize, sources, related |
| `/merker` | Done | Logo cards + published model counts |
| `/merker/[slug]` | Done | Logo, sanitized intro, published models |
| `/sammenlign` | Done | Sticky column/headers CSS, «Best» label |
| `/login` | Done | Calm auth panel copy |
| `/registrer` | Done | Calm auth panel copy |
| `/glemt-passord` | Done | Existing layout + DS2 auth styles |
| `/oppdater-passord` | Done | Existing layout + DS2 auth styles |
| `/min-side` | Done | Favorites only; unfinished claims removed |
| `/kalkulator` | Stub kept | Out of nav; honest “kommer senere” copy |
| `/[slug]` | Stub kept | Existing public placeholders only |
| `/admin/**` | Untouched workflows | Legacy tokens via `.adminApp`; simplified chrome |

---

## Components created / updated

### Created
- `components/layout/app-shell.tsx` — public vs admin token isolation
- `components/brand/wordmark.tsx` — text wordmark (no invented logo file)
- `components/home/home-search.tsx`
- `components/home/popular-brands-section.tsx`
- `components/home/trust-section.tsx`
- `lib/public/sanitize-public-copy.ts`
- `tests/sanitize-public-copy.test.ts`

### Updated (public)
- Header / footer / homepage sections
- Model cards, model detail, catalog client, brands pages, compare UI
- `app/layout.tsx` (Inter + AppShell)
- `config/site.ts` (finished nav only)
- `app/globals.css` (DS2 public tokens + additions; admin locked)

---

## Assets reused

| Asset | Action |
|-------|--------|
| Text wordmark pattern (`EV` + `FAKTA.no`) | Reused / refined as `Wordmark` |
| Manufacturer logos from Supabase `brand-logos` | Reused on brand pages/cards |
| Approved car images via existing gallery helpers | Unchanged workflow |
| Contact email `kontakt@evfakta.no` | Reused in footer |

---

## Missing brand assets (documented — not invented)

| Missing | Notes |
|---------|-------|
| Official EVFAKTA logo SVG/PNG in `public/` | No `public/` brand files in repo |
| Favicon / app icons | Not present |
| Social media URLs / handles | Not present in `config/site.ts` or elsewhere |

Footer omits social links until real URLs exist.

---

## Remaining visual gaps

- No official logo file yet — text wordmark is the interim brand mark
- Homepage lacks large photography hero until approved public hero assets exist
- Guide/article marketing sections omitted (no real guide content)
- Compare sticky headers work via CSS; very small screens still need intentional horizontal scroll
- Some legacy public CSS (pre-DS2 orbs/shadows) remains unused in `globals.css` but is overridden under `.publicApp`
- Auth forms keep existing behavior; visual polish is CSS-level, not a full redesign of form internals

---

## Accessibility checks

| Item | Status |
|------|--------|
| Skip-to-content link | Present |
| Visible `:focus-visible` rings (public) | Added under `.publicApp` |
| Semantic headings | Preserved / improved on model detail |
| Form labels | Catalog + search + auth keep labels |
| Icon button names | Menu / search / favorite aria labels retained |
| Norwegian alt text | Brand logos and card aria-labels updated |
| `prefers-reduced-motion` | Honored for `.publicApp` |
| Touch targets ≥ 44px | Search, menu, filter toggle, CTAs |

---

## Responsive checks (implemented targets)

Designed/verified via CSS breakpoints for:

- **375px** — single-column hero/cards; mobile nav + filter sheet
- **768px** — 2-col brand/home grids
- **1024px** — desktop nav + desktop filters; 3–4 col grids
- **1440px** — same 12-col container system (max ~1200px)

Intentional horizontal overflow: compare table only.

---

## Performance notes

- Inter via `next/font` with `display: swap`
- Existing Next/Image remote patterns for `**.supabase.co` unchanged
- Card/gallery images keep existing lazy/`unoptimized` patterns where already used
- Homepage data from published cars + active brands only (dynamic)
- Minimal new client JS: AppShell, HomeSearch, filter sheet, existing compare/variant clients

---

## Launch blockers (content — not design)

From `docs/LAUNCH_CHECKLIST.md` (still apply):

- Draft markers must be cleared before publish (gates + public sanitize as safety net)
- Hero + Front + Side images required for publish
- No auto-publish / auto-approve

Design itself is not a launch blocker once content passes gates.

---

## Exact routes covered by this wave

```
/
/modeller
/modeller/[slug]
/merker
/merker/[slug]
/sammenlign
/login
/registrer
/glemt-passord
/oppdater-passord
/min-side
/kalkulator          (stub only)
/[slug]              (existing stubs)
/admin/**            (functional; visual tokens locked)
```

---

## Trust enforcement shipped

- No static fake model counts — homepage counts from published CMS data
- Calculator / unfinished tools removed from nav and homepage CTAs
- Prices/scores still gated by `PUBLIC_SHOW_PRICES` / `PUBLIC_SHOW_SCORES`
- Missing numeric values omitted or shown as `—` (never `0` as a claim)
- Draft markers stripped at public render via `sanitizePublicCopy`
- Spec disclaimer in footer
