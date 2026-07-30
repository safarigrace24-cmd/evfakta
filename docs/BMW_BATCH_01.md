# BMW batch 01

**Date checked:** 2026-07-30  
**Brand:** BMW  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** BMW PressClub mediapool → Storage gallery → visual verify  
**Production script:** `scripts/complete-bmw-100.ts`  
**Sources primary:** BMW PressClub technical specifications (ACEA / Germany sheets)  
**Market note:** `www.bmw.no` was unreachable in this production environment — PressClub + BMW Group Norge press used; not invented

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| iX1 | 100% | YES | YES | YES | Approved, unpublished |
| iX2 | 100% | YES | YES | YES | Approved, unpublished |
| i4 | 100% | YES | YES | YES | Approved, unpublished |
| i5 | 100% | YES | YES | YES | Approved, unpublished |
| i7 | 100% | YES | YES | YES | Approved, unpublished |
| iX | 100% | YES | YES | YES | Approved, unpublished |

## Completion definition

Finishable models (iX1, iX2, i4, i5, i7, iX) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified PressClub assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official PressClub technical sheets retained as `source_url`
- Specs counted from car **or** variants
- Documented honesty for winter range, heat-pump boolean, BMW.no live gap, and missing rear/interior where applicable
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Future / out of scope this batch:

- **iX3** — sold on some BMW Norge surfaces but not in the six-model mission list — not created
- Additional i5 (eDrive40 / M60 / Touring) and i7 (eDrive50 / M70) variant sheets — not invented; only PressClub-backed variants stored

## Sources

1. iX1 xDrive30 technical specifications — https://www.press.bmwgroup.com/global/article/attachment/T0393974EN/567425  
2. BMW Group Norge — iX1 eDrive20 press — https://www.mynewsdesk.com/no/bmw-no/pressreleases/nye-bmw-ix1-edrive20-ny-elektrisk-innstegsmodell-3276133  
3. iX2 xDrive30 technical specifications — https://www.press.bmwgroup.com/global/article/attachment/T0437451EN/608982  
4. iX2 eDrive20 specifications (03/2024) — https://www.press.bmwgroup.com/global/article/detail/T0439779EN/specifications-of-the-bmw-ix2-edrive20-valid-from-03/2024?language=en  
5. Technical data BMW i4 (valid July 2024) — https://www.press.bmwgroup.com/global/article/attachment/T0442767EN/617124  
6. i5 xDrive40 Sedan technical specifications — https://www.press.bmwgroup.com/global/article/attachment/T0439978EN/612522  
7. i7 xDrive60 technical specifications — https://www.press.bmwgroup.com/global/article/attachment/T0380173EN/568614  
8. iX technical specifications (01/2025: xDrive45 / xDrive60 / M70) — https://www.press.bmwgroup.com/global/article/attachment/T0447642EN/630684  
9. Press images — BMW PressClub mediapool (`mediapool.bmwgroup.com`)  
10. Market pointer (live blocked here): https://www.bmw.no

**Not used as facts:** EV-Database, EVKX, blogs, guessed WLTP/battery/DC, annotated infographic press assets.

## Image notes

- Every attach used **visual verification** (reject Motorrad, event-with-people, and infographic overlays).
- iX1: Front hero + true orthographic side + interior cabin; rear documented missing.
- iX2: Front 3/4 + rear 3/4 as side/rear gallery; interior documented missing.
- i4: Front hero + exterior gallery + true rear; interior documented missing.
- i5: Front hero + Touring rear-3/4 as side + rear; interior documented missing.
- i7: Front hero + front 3/4 as side; rear/interior documented missing.
- iX: Front hero + true orthographic side + true rear; interior documented missing.

## Variants stored

| Model | Variants |
|-------|----------|
| iX1 | xDrive30 (default), eDrive20 |
| iX2 | xDrive30 (default), eDrive20 |
| i4 | eDrive35, eDrive40 (default), xDrive40, M50 xDrive |
| i5 | xDrive40 Sedan (default) |
| i7 | xDrive60 (default) |
| iX | xDrive45 (default), xDrive60, M70 xDrive |

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| iX1 | PressClub dims/battery/DC/tow; eDrive20 from BMW Group Norge; gallery front+side+interior |
| iX2 | PressClub xDrive30 + eDrive20; gallery front+side+rear |
| i4 | Full July 2024 PressClub quartet; gallery front+side+rear |
| i5 | xDrive40 Sedan full sheet; honesty for other market variants; gallery front+side+rear |
| i7 | xDrive60 full sheet; honesty for other variants + missing media; gallery front+side |
| iX | xDrive45/60/M70 from 01/2025 sheet; gallery front+side+rear |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.

BMW production batch complete.
