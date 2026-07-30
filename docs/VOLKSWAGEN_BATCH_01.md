# Volkswagen batch 01

**Date checked:** 2026-07-26 (import) · **Production complete:** 2026-07-28 · **100% pass:** 2026-07-30  
**Brand:** Volkswagen  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion ≥**95%** (100% preferred) for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official Newsroom → Storage review copy → visual approve → gallery  
**Batch JSON:** `data/catalog-batch-02-volkswagen.json`  
**Production scripts:** `scripts/raise-vw-completion-95.ts`, `scripts/complete-volkswagen-100.ts`  
**Production reports:**  
- `docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID7_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID_BUZZ_PRODUCTION.json`

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| ID.3 | 100% | YES | YES | YES | Approved, unpublished |
| ID.4 | 100% | YES | YES | YES | Approved, unpublished |
| ID.7 | 100% | YES | YES | YES | Approved, unpublished |
| ID. Buzz | 100% | YES | YES | YES | Approved, unpublished |
| ID.5 | 32% | NO | NO | NO | **NOT_READY** |

## Completion definition

Finishable models (ID.3, ID.4, ID.7, ID. Buzz) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear present on all finishable; Interior where official assets existed)
- Editorial finalized (no Draft markers; editorial confidence ≥0.90)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Related models via `getRelatedCars`
- Official sources retained
- Specs counted from car **or** variants
- Documented honesty for gaps that official NO PDFs omit (e.g. consumption kWh, Buzz chemistry, ID.3 no-tow, missing interiors)
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Blocked:

- **ID.5 = NOT_READY** — insufficient official Norwegian tech PDF; no invented specs/images

## Sources

1. ID.3 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf  
2. ID.4 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf  
3. ID.4 prisliste (Modellår 2027) — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/prisliste_id4.pdf  
4. ID.7 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf  
5. ID.7 prisliste (Modellår 2027) — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/prisliste-id7.pdf  
6. ID. Buzz Pro PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf  
7. ID. Buzz GTX PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf  
8. Press images — Volkswagen Newsroom albums

## Image notes

- Album-order type labels were often wrong; every attach used **visual verification**.
- ID.7 true side sourced beyond first-5 heuristic (album `id-7-6594`).
- ID. Buzz true side sourced from album `volkswagen-id-buzz-3418`.
- Interior left empty where no verified cabin shot existed (ID.3, ID.7) — documented honesty in `score_notes`.

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| ID.3 | `towing_kg=0` (Tilhenger ikke mulig); interior documented unavailable; heat pump documented |
| ID.4 | `year=2027` from prisliste Modellår 2027 |
| ID.7 | `year=2027` from prisliste; interior documented unavailable; car-level tow 1800 kg (GTX) |
| ID. Buzz | Chemistry documented gap; heat_pump=false (ZW1 ekstrautstyr); car-level tow 1200 kg (Pro Kort) |
| ID.5 | Unchanged NOT_READY |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.
