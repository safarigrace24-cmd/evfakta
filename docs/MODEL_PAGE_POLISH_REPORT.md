# Model detail page polish report

**Date:** 2026-07-28  
**Scope:** `/modeller/[slug]` quality polish only  
**Locked:** Homepage, models catalog, Design System 2.0, IA, CMS, routes, launch gates  
**Commit / push:** Not performed

## Audit summary

| Area | Finding |
| --- | --- |
| Hero | Identity, gallery, and facts were stacked awkwardly; actions below the fold on desktop |
| Key facts | Missing forbruk in the first-screen fact set when available |
| Specs | Flat two-column dump — hard to scan |
| Gallery | No prev/next, no swipe, no focused keyboard nav |
| Pros/Cons | Plain lists without visual grouping |
| Sources | Paragraph blob; dates/source not scannable |
| Loading | No detail-route skeleton |
| FAQ | Not present in CMS-backed detail UI — not invented |
| Related | Functional but catalog cards not tuned for detail context |

## UX improvements

- Hero redesigned in structure only: media left / sticky identity + variant + key facts + **Sammenlign** / **Favoritt** on desktop
- Key facts now prioritize WLTP, batteri, DC, forbruk (when present), AC, drivlinje — missing values still omitted
- Technical data grouped into scannable sections (identitet, batteri, lading, ytelse, praktisk, utstyr)
- Charging and winter remain dedicated sections with existing sourced values only
- Sources presented as labeled meta (oppdatert / sjekket / kilde)

## Visual improvements

- Consistent 16:10 hero image plane and quieter meta chips
- Gallery thumb strip with clearer active/focus states
- Pros/cons side-by-side cards on tablet+
- Content sections as calm elevated cards
- Related models use premium compact card treatment aligned with catalog polish

## Accessibility improvements

- Fact grid uses `dl`/`dt`/`dd`
- Gallery region is focusable with arrow-key navigation when multiple images exist
- Prev/next controls with aria-labels; live region announces image position
- Breadcrumb separators `aria-hidden`
- Source block has a proper heading
- Reduced-motion disables image fade / skeleton shimmer on this page

## Responsive improvements

- Hero stacks on &lt;1024px; aside sticky only on desktop
- Key facts single column on small phones
- Tech groups 1 → 2 columns from ~900px
- Gallery thumbs horizontally scrollable on narrow screens

## Performance (perceived)

- Detail `loading.tsx` skeleton for hero + facts
- Thumbnail images `loading="lazy"`
- Main hero remains `priority`

## Unchanged

- Routes, CMS, database, publish/launch gates
- No invented editorial, FAQ, or fake specs
- Variant URL behavior (`?variant=`) unchanged

## Files changed

| File | Change |
| --- | --- |
| `app/modeller/[slug]/page.tsx` | `modelPage` shell + related polish |
| `app/modeller/[slug]/loading.tsx` | Detail skeleton (new) |
| `components/cars/car-variant-detail.tsx` | Hero layout, grouped specs, sources |
| `components/cars/car-gallery.tsx` | Nav, swipe, keyboard, a11y |
| `components/cars/fact-grid.tsx` | Semantic `dl` markup |
| `app/globals.css` | Model detail polish CSS |
| `docs/MODEL_PAGE_POLISH_REPORT.md` | This report |

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm test` | Passed (96 tests) |
| `npm run build` | Passed (Next.js 16.2.11) |
