# Homepage polish report

**Date:** 2026-07-28  
**Scope:** `/` only — quality polish on locked Design System 2.0 + locked IA  
**Commit / push:** Not performed

## Audit — what felt unfinished

| Area | Issue |
| --- | --- |
| Hero | Tight padding, weak aside hierarchy, search focus unclear, aside link only to merker |
| Search | No elevated focus state; mobile CTA cramped beside input |
| Section rhythm | Consecutive `sectionAlt` blocks (charging → features → …) felt flat |
| Copy accuracy | About/Features still claimed unfinished tools were hidden from nav |
| Popular models | Empty catalog rendered a blank grid (no empty state) |
| Cards | Uneven hover/focus, brand logo alt noise, FAQ summary marker unstyled |
| Typography | Section headers lacked consistent letter-spacing / breathing room |
| Accessibility | Missing `aria-labelledby` on many sections; FAQ summary focus weak; brand logos had redundant alts |
| Motion | Hover transforms ignored `prefers-reduced-motion` on homepage cards |

## Visual improvements

- Generous hero padding (desktop ~96–112px; mobile ~56–64px)
- Aside card as a quiet trust panel with primary + secondary links
- Search focus ring via `focus-within` (brand border + soft glow)
- Homepage section padding aligned to DS scale (72 / 96)
- Card hover: 1px lift + soft shadow (platform hub, brands, features, metrics, explainers)
- Car cards on home: clearer brand label, body padding, subtle image gradient
- FAQ open state + custom chevron (no default triangle)
- Alternating section backgrounds restored to a calmer rhythm

## UX improvements

- Corrected outdated copy so unfinished areas are described as visible + marked «Under utvikling»
- Hero CTA hierarchy: primary models / secondary compare; aside points to **Kilder og metode** and **Utforsk merker**
- Popular models empty state with honest messaging + actions (no invented stats)
- Platform hub / feature cards: clearer accessible names (`aria-label`)

## Responsive improvements

- Home search stacks full-width on ≤640px
- Section / hero padding scaled down on small screens
- Brand / hub / metric grids keep existing breakpoints; denser gaps refined on home card grid

## Accessibility improvements

- Section landmarks via `aria-labelledby` + stable heading ids
- FAQ summaries: custom marker, visible `:focus-visible`
- Brand card logos: decorative `alt=""` (name in adjacent text)
- Empty state supports `titleAs` (`h1`/`h2`/`h3`) to avoid duplicate page h1s
- `prefers-reduced-motion`: disable homepage card transform transitions

## Screenshots

Not captured in this pass (dev server may already be running locally). Suggested check:

1. Desktop ≥1280 — hero + hub + model cards  
2. Tablet ~768 — stacked search / brand grid  
3. Mobile ~390 — full-width search, FAQ tap targets  

## Files changed

| File | Change |
| --- | --- |
| `app/page.tsx` | `homePage` wrapper |
| `app/globals.css` | Homepage polish CSS block |
| `components/home/hero-section.tsx` | Structure, aside links, a11y |
| `components/home/home-search.tsx` | Search a11y attributes |
| `components/home/platform-hub-section.tsx` | Header/a11y polish |
| `components/home/popular-models-section.tsx` | Empty state |
| `components/home/popular-brands-section.tsx` | Logo a11y, section label |
| `components/home/key-metrics-section.tsx` | Rhythm + a11y |
| `components/home/charging-explainer-section.tsx` | Structure + a11y |
| `components/home/features-section.tsx` | Accurate lead, rhythm, a11y |
| `components/home/home-faq-section.tsx` | FAQ polish + a11y |
| `components/home/about-section.tsx` | Accurate bullet, a11y |
| `components/home/trust-section.tsx` | a11y |
| `components/ui/section-heading.tsx` | Optional `titleId` |
| `components/ui/empty-state.tsx` | `titleAs` + `className` |

## Not changed (locked)

- Colors, typography families, navigation IA, route set  
- No fake marketing, stats, or ratings  
- No content removed from the homepage section set  

## Verification

| Command | Result |
| --- | --- |
| `npm run lint` | Passed (`tsc --noEmit`) |
| `npm test` | Passed (96 tests) |
| `npm run build` | Passed (Next.js 16.2.11) |
