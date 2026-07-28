# Legacy Content Migration Report

**Date:** 2026-07-28  
**Source IA:** Old EVFAKTA public pages  
**Target:** Design System 2.0 public rebuild  
**Constraint:** No old visual copy; no admin/schema/publish changes; no commit/push

---

## Migration table

| Page | Existing content | Migrated | Hidden | Removed | Reason |
|------|------------------|----------|--------|---------|--------|
| `/` | Hero, search CTAs, popular models, marketing claims | Hero, search, CTAs, popular models/brands (CMS), key metrics, charging explainer, FAQ, about, trust | — | “2 minutter”, “ekte testdata”, App Store, static counts, unsupported popularity | Unsupported claims stripped; counts are dynamic |
| `/modeller` | Catalog + static “57 av 57” style claims | Dynamic published count, search/filters, cards with year/drive/WLTP/consumption/DC + “Se fakta →” | — | Static totals | CMS-only published models |
| `/sammenlign` | Compare tool | Preserved working compare + DS2 layout | — | — | No new backend |
| `/kalkulator` | Working calculator on old site | Route kept with honest “under utvikling” | Yes (nav) | Fake results | No calculation engine in this codebase |
| `/rimeligste` | Cheapest list | Route kept; temporary state | Yes (nav) | Hard-coded “15 rimeligste” | `PUBLIC_SHOW_PRICES === false` |
| `/verktoy` | Tool hub | Route kept; development notice | Yes (nav) | Ads for unfinished tools | Tools not functional |
| `/testdata` | Test data marketing | Route kept; blocked until sourced | Yes (nav) | Generic % / “measured” without sources | Data model not ready for public test claims |
| `/ladekart` | Small station list as “map” | Route kept; honest placeholder | Yes (nav) | Misleading station totals | No live dataset |
| `/bruktbil` | Used EV guide + checklist | Guide, checklist, SOH explanation, related **published** models only | — | Draft guide links, battery degradation calculator | Only link what exists; no fake calculator |
| `/info` | Sources/about | Full trust page: policy, method, terms, contact `post@evfakta.no`, socials | — | `kontakt@…` | Official contact + socials from `config/site.ts` |
| `/merker` | Brand index | Already DS2; unchanged this wave | — | — | Already dynamic |
| Auth / Min side | Account | Untouched beyond prior DS2 restyle | — | Unfinished feature ads (earlier) | Out of this IA set |

---

## Unsupported claims removed / blocked

- “Finn riktig elbil på 2 minutter”
- “Ekte testdata fra norske forhold” / independent measured claims without sources
- App Store / app promotion
- Static model counts (“57 av 57”)
- Hard-coded cheapest rankings
- National charging map implied by a short station list
- Battery degradation calculator (not functional)
- Model-specific used-EV guide links that do not exist as pages

---

## Dynamic values replacing static text

| Location | Dynamic source |
|----------|----------------|
| Homepage hero meta | `getPublishedCars().length`, brands with published models |
| Popular models | First N published CMS cars |
| Popular brands | Active brands × published model counts |
| `/modeller` intro + result count | Published cars + filtered length |
| `/bruktbil` related models | Published cars matching known candidate names |
| Card specs | Variant-aware CMS fields; omit/`—` when missing |

---

## Routes hidden from navigation

Controlled by `lib/public/feature-flags.ts`:

- `/kalkulator`
- `/rimeligste`
- `/verktoy`
- `/testdata`
- `/ladekart`

Visible in nav (finished):

- Modeller, Merker, Sammenlign, Bruktbil  
- Kilder (`/info`) in mobile nav + desktop “Mer”

Footer: Modeller, Merker, Sammenlign, Bruktbil, Kilder og metode.

Sitemap includes `/`, `/modeller`, `/merker`, `/sammenlign`, `/bruktbil`, `/info` only (not unfinished stubs).

---

## Pages needing editorial review

- Homepage FAQ / about copy (safe defaults; refine with editors)
- `/bruktbil` checklist and SOH wording
- `/info` method text
- Future model-specific used-EV guides (Tesla Y/3, Leaf, e-Golf) — not published yet

---

## Pages needing real data integrations

| Page | Needed |
|------|--------|
| `/kalkulator` | Verified cost/range calculation engine + assumptions UI |
| `/rimeligste` | Public price policy ON + sourced prices + checked dates |
| `/verktoy` | Working range / charging / TCO tools |
| `/testdata` | Per-vehicle measured fields with source + checked date |
| `/ladekart` | Maintained live charging dataset |

---

## Exact public routes tested (build + typecheck)

```
/
/modeller
/modeller/[slug]
/merker
/merker/[slug]
/sammenlign
/bruktbil
/info
/kalkulator
/rimeligste
/verktoy
/testdata
/ladekart
/login
/registrer
/min-side
```

Responsive CSS targets: 375 / 768 / 1024 / 1440 (existing DS2 breakpoints + new section grids).

---

## Verification

| Check | Result |
|-------|--------|
| Admin / CMS / schema / migrations | Unchanged |
| Auto-publish / approvals | Unchanged |
| `npm run lint` | Pass |
| `npm test` | Pass (96) |
| `npm run build` | Pass |
| Commit / push | Not performed |
