# Hyundai batch 01

**Date checked:** 2026-07-30  
**Brand:** Hyundai  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Hyundai DAM (`dmassets.hyundai.com`) → Storage gallery → visual verify  
**Production script:** `scripts/complete-hyundai-100.ts`  
**Sources primary:** Hyundai Norge tekniske ark + prislister 06.07.2026 (`dmassets.hyundai.com`)

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| Kona Electric | 100% | YES | YES | YES | Approved, unpublished |
| Ioniq 5 | 100% | YES | YES | YES | Approved, unpublished |
| Ioniq 6 | 100% | YES | YES | YES | Approved, unpublished |
| Ioniq 9 | 100% | YES | YES | YES | Approved, unpublished |
| INSTER | 100% | YES | YES | YES | Approved, unpublished |
| Ioniq 9 Varebil | 81% | NO | NO | NO | **NOT_READY** |
| Staria Electric | 68% | NO | NO | NO | **NOT_READY** |
| Ioniq 3 | 68% | NO | NO | NO | **NOT_READY** |

## Completion definition

Finishable models (Kona Electric, Ioniq 5, Ioniq 6, Ioniq 9, INSTER) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified DAM assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Hyundai Norge teknisk ark retained as `source_url`
- Specs counted from car **or** variants
- Documented honesty for winter range, peak DC kW, battery chemistry, INSTER tow/frunk, Ioniq 9 6/7 seats
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Blocked:

- **Ioniq 9 Varebil = NOT_READY** — full NO tech sheet stored; Image Ready blocked (no verified Front+Side gallery); no invented images; `needs_review`
- **Staria Electric = NOT_READY** — modellside marketing only (400 km WLTP); NO pricelist/tech PDF not retrieved (DAM «Image not found»); no invented specs/images
- **Ioniq 3 = NOT_READY** — premiere/marketing page only; no NO pricelist; no invented specs/images

## Sources

1. Teknisk KONA Electric — https://dmassets.hyundai.com/is/content/hyundaiautoever/KONA-Electric-TekniskNYpdf-1  
2. Prisliste KONA Electric 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/KONA+Electric+06.07.2026pdf  
3. Tekniske data IONIQ 5 PE — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ-5-PE_Tekniske-Data_16-07-2024pdf  
4. Prisliste IONIQ 5 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+5+06.07.2026pdf  
5. Teknisk IONIQ 5 N — https://dmassets.hyundai.com/is/content/hyundaiautoever/15-01-2024c_IONIQ-5-N-tekniskpdf  
6. Prisliste IONIQ 5 N 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+5+N+06.07.2026pdf  
7. Tekniske data IONIQ 6 PE — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+6+PE+Tekniske+Data+NYpdf  
8. Prisliste IONIQ 6 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+6+06.07.2026pdf  
9. Prisliste IONIQ 6 N 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+6+N+06.07.2026pdf  
10. IONIQ 6 N modellside (84 kWt / 487 km / 10–80 18 min) — https://www.hyundai.com/no/no/bilmodeller/ioniq-6-n  
11. Tekniske data IONIQ 9 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ-9_Tekniske-Datapdf  
12. Prisliste IONIQ 9 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+9+06.07.2026pdf  
13. Tekniske data IONIQ 9 Varebil — https://dmassets.hyundai.com/is/content/hyundaiautoever/IONIQ+9+Varebil+-+Tekniske+Datapdf  
14. Teknisk ark INSTER — https://dmassets.hyundai.com/is/content/hyundaiautoever/INSTER-Teknisk-Ark-versjon-4_02-12-24pdf  
15. Prisliste INSTER 06.07.2026 — https://dmassets.hyundai.com/is/content/hyundaiautoever/INSTER+06.07.2026pdf  
16. Press/product images — Hyundai DAM `dmassets.hyundai.com/is/image/hyundaiautoever/…`  
17. Market pointer: https://www.hyundai.com/no

**Not used as facts:** EV-Database, dealer blogs, guessed peak DC kW, Google/Pinterest/social/dealer/AI images, Staria/Ioniq 3 marketing as complete specs.

## Image notes

- Every attach used **visual verification** (reject accessory collages, INSTEROID concept, wrong-model tiles).
- Kona Electric: Studio front 3/4 + lifestyle side + driving rear + cabin interior.
- Ioniq 5: Lifestyle front + exterior side 3/4 + rear 3/4 + dual-screen interior.
- Ioniq 6: N Line front + true side profile + rear 3/4 + relaxation-seat interior.
- Ioniq 9: Front lifestyle + true side + rear 3/4 + three-row interior.
- INSTER: Front 3/4 + side-capable front lifestyle + rear 3/4 + cabin interior.
- Ioniq 9 Varebil / Staria / Ioniq 3: no verified gallery — NOT_READY.

## Variants stored

| Model | Variants |
|-------|----------|
| Kona Electric | Standard Range FWD (default), Long Range FWD |
| Ioniq 5 | SR RWD (default), LR RWD, LR AWD, Ioniq 5 N AWD |
| Ioniq 6 | SR RWD (default), LR RWD, LR AWD, Ioniq 6 N AWD |
| Ioniq 9 | LR RWD (default), LR AWD, LR Performance AWD |
| INSTER | SR FWD (default), LR FWD, LR Cross FWD |
| Ioniq 9 Varebil | LR AWD (specs only) |
| Staria Electric | pending shell (marketing range only) |
| Ioniq 3 | pending shell (marketing range only) |

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| Kona Electric | Full NO tech (48,4/65,4 kWt); DAM gallery; DC peak honesty |
| Ioniq 5 | PE tech + N tech as variant; DAM gallery |
| Ioniq 6 | PE tech + N from prisliste/modellside; DAM gallery |
| Ioniq 9 | Full tech 110,3 kWt; seats honesty 6/7; DAM gallery |
| INSTER | Full tech; tow none honesty; DAM gallery |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.

Hyundai production batch complete (finishable locked; Varebil/Staria/Ioniq 3 NOT_READY).
