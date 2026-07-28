# Models page polish report

**Date:** 2026-07-28  
**Scope:** `/modeller` quality polish only  
**Locked:** Homepage, Design System 2.0, IA, CMS, routes, filter fields/logic  
**Commit / push:** Not performed

## Audit summary

| Issue | Finding |
| --- | --- |
| Hierarchy | Page header OK; card titles were `h2` under page `h1` |
| Search | Typed directly into URL on every keystroke; focus/size felt utilitarian |
| Filters | Flat single grid; no sticky context; mobile sheet lacked Escape / scroll lock |
| Cards | Fixed 160px image height vs aspect ratio conflict; uneven padding |
| Specs | Always 3-column grid even with 1–2 values |
| Empty states | One message for empty catalog and no matches; empty used `h1` |
| Loading | Text-only “Laster modeller…” — not a catalog skeleton |
| A11y | Result count not live; filter controls missing some labels; reduced motion incomplete |
| Hover / focus | Generic lift; favorite hit target could be clearer |

## UX improvements

- Debounced search (200ms) with local input state — typing feels instant; URL still stores filters
- Sticky filter/toolbar band under the header on scroll
- Filter fields grouped: search row + meta/sort row (same fields, clearer scan)
- Mobile filter sheet: Escape closes, body scroll locked while open
- Result count uses `aria-live="polite"` with pending “Oppdaterer…”
- Distinct empty states: empty catalog vs no filter matches
- Soft pending opacity on results while URL transition runs

## Visual improvements

- Larger search field (56px) with focus ring matching DS tokens
- Premium filter labels (small uppercase) and 48px controls
- Card layout: edge-to-edge 16:10 image, padded body, quieter badge
- Spec blocks: tabular nums, adaptive columns via `data-count`
- Favorite button: 44×44, clearer hover/focus/favorite states
- CTA “Se fakta →” emphasized on card hover
- Loading skeletons mimic header + 6 cards with shimmer

## Accessibility improvements

- Page `aria-labelledby` + stable heading id
- Card titles → `h3` (correct under page `h1`)
- Spec row exposed as list with label “Nøkkeltall”
- Filter selects/inputs: explicit `aria-label`s
- Filter chips / toggle: visible `:focus-visible`
- Skeleton: `role="status"` + visually hidden “Laster modeller…”
- `prefers-reduced-motion`: disable card lift, pending fade, skeleton animation

## Responsive improvements

- Grid: 1 col → 2 (≥640) → 3 (≥1100)
- Filter meta: 1 → 2 → 4 columns across breakpoints
- Sticky bar adjusts for smaller header offset on mobile
- Safe-area padding on bottom sheet

## Unchanged (by design)

- Filter parameters, sort options, and URL encoding
- Routes (`/modeller`, model detail)
- No invented specs; zeros / missing still omitted via existing formatters + `omitDash`
- CMS / admin / database

## Files changed

| File | Change |
| --- | --- |
| `app/modeller/models-client.tsx` | Structure, debounce search, sticky shell, a11y, empty states |
| `app/modeller/loading.tsx` | Catalog skeleton loading UI |
| `components/cars/car-card.tsx` | Heading level, drive trim, CTA aria |
| `components/cars/spec-row.tsx` | List semantics + adaptive count |
| `app/globals.css` | Models page polish CSS block |
| `docs/MODELS_PAGE_POLISH_REPORT.md` | This report |

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm test` | Passed (96 tests) |
| `npm run build` | Passed (Next.js 16.2.11) |
