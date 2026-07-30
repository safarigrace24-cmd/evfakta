# Volvo batch 01

**Date checked:** 2026-07-26 (import) · **100% pass:** 2026-07-30  
**Brand:** Volvo  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official Volvo Cars Norge → Storage review copy → visual verify → gallery  
**Apply / production scripts:** `scripts/apply-volvo-batch-01.ts`, `scripts/complete-volvo-100.ts`  
**Batch JSON:** `data/catalog-batch-03-volvo.json`

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| EX30 | 100% | YES | YES | YES | Approved, unpublished |
| EX40 | 100% | YES | YES | YES | Approved, unpublished |
| EC40 | 100% | YES | YES | YES | Approved, unpublished |
| EX90 | 100% | YES | YES | YES | Approved, unpublished |
| ES90 | 100% | YES | YES | YES | Approved, unpublished |
| EX60 | 70% | NO | NO | NO | **NOT_READY** |

## Completion definition

Finishable models (EX30, EX40, EC40, EX90, ES90) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified official assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Volvo Cars Norge sources retained
- Specs counted from car **or** variants
- Documented honesty for gaps omitted from NO specs tables (chemistry, connectors, heat pump boolean, missing rear/interior, EX90 6–7 seats)
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Blocked:

- **EX60 = NOT_READY** — no Image Ready Storage gallery; production specs incomplete for launch; no invented assets

## Sources

- EX30 specs — https://www.volvocars.com/no/cars/ex30-electric/specifications/
- EX40 specs — https://www.volvocars.com/no/cars/ex40-electric/specifications/
- EC40 specs — https://www.volvocars.com/no/cars/ec40-electric/specifications/
- EX90 specs — https://www.volvocars.com/no/cars/ex90-electric/specifications/
- ES90 specs — https://www.volvocars.com/no/cars/es90-electric/specifications/
- EX60 specs — https://www.volvocars.com/no/cars/ex60-electric/specifications/ (NOT_READY)
- Battery warranty — https://www.volvocars.com/no/l/own/garanti-hybridbatteri/

## Image notes (2026-07-30)

| Model | Hero/Front | Side | Rear | Interior |
|-------|:----------:|:----:|:----:|:--------:|
| EX30 | YES (lifestyle front) | YES (studio) | Documented missing | Documented missing (seat-only rejected) |
| EX40 | YES | YES | YES | YES (cockpit) |
| EC40 | YES | YES | YES | YES (cockpit) |
| EX90 | YES | YES | Documented missing | YES (cockpit) |
| ES90 | YES (official hero) | YES | YES | Documented missing (seat-only rejected) |
| EX60 | — | — | — | — |

Visual verification used Storage review WebPs (converted to JPG for inspection). Seat-only interiors were not attached as cabin Interior.

## 100% pass notes

- Model year **2027** set from current NO MY27 lineup / press assets
- Draft markers removed from description / pros / cons / suitable_for / score_notes
- Variants `import_status=approved`; cars remain unpublished
- EX60 unpublished + `needs_review` + NOT_READY note

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.
