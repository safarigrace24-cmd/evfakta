# Compare page polish report

**Date:** 2026-07-28  
**Scope:** `/sammenlign` quality polish only  
**Locked:** Homepage, models catalog, model detail, Design System 2.0, IA, CMS, routes  
**Commit / push:** Not performed

## Audit summary

| Area | Finding |
| --- | --- |
| Selection | Flat chip cloud; hard to scan when many models; no search |
| Selected state | Active chips only — no clear remove affordance / selected cards |
| Table | Flat Excel-like list; no grouping |
| Best marker | “Best” text existed; strengthened to “✓ Best” (not color-only) |
| Empty state | Minimal copy; no guided next step |
| Loading | No route skeleton |
| Mobile | Sticky first column existed; needed denser polish + scroll feel |
| Recently viewed | Not supported in codebase — omitted (no invention) |

## UX improvements

- Search field filters available models instantly (client-side)
- Selected models shown as removable cards (`Fjern`)
- Chip list: pressed state + ✓ mark; disabled when 3 already selected
- Empty state guides users with popular-model quick-add + catalog link
- One-selected state prompts to add a second car
- Variant selects remain in table header; clearer labels

## Visual improvements

- Spec rows grouped: Identitet, Batteri, Rekkevidde, Lading, Ytelse, Dimensjoner, Praktisk, Garanti, Score
- Soft group headers, generous cell padding, sticky header + sticky first column
- “✓ Best” badge (text + symbol, not color alone)
- Pending opacity while URL updates
- Premium empty/popular cards

## Accessibility improvements

- Live pending text; table caption; stronger control labels
- Focus rings on chips, search, remove, popular cards, variant selects
- Best label includes visually hidden “verdi i raden”
- Reduced-motion disables pending fade / skeleton shimmer

## Responsive improvements

- Selected cards 1→3 columns; popular cards 1→2→3
- Table horizontal scroll with sticky labels preserved
- Tighter padding on small phones

## Unchanged

- Max 3 cars, URL `?biler=` tokens, variant resolution
- Row hiding when all values missing
- No CMS/DB/backend changes
- No recently-viewed feature invented

## Files changed

| File | Change |
| --- | --- |
| `lib/compare/comparison.ts` | Row `group` + `groupComparisonRows()` |
| `components/compare/compare-client.tsx` | Search, selected cards, grouped table, empty UX |
| `app/sammenlign/page.tsx` | Page shell / landmark |
| `app/sammenlign/loading.tsx` | Skeleton (new) |
| `app/globals.css` | Compare polish CSS |
| `tests/comparison.test.ts` | Assert group metadata |
| `docs/COMPARE_PAGE_POLISH_REPORT.md` | This report |

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm test` | Passed (96 tests) |
| `npm run build` | Passed (Next.js 16.2.11) |
