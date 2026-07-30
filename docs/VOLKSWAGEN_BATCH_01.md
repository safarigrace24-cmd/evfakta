# Volkswagen batch 01

**Date checked:** 2026-07-26 (import) · **Production complete:** 2026-07-28 · **≥95% gate:** 2026-07-28  
**Brand:** Volkswagen  
**Batch status:** **COMPLETE** (finishable models ≥95% Launch/Publish Ready; ID.5 NOT_READY)  
**Quality standard:** Review Assistant completion ≥**95%** required for Launch Ready / Publish Ready (100% preferred)  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official Newsroom → Storage review copy → visual approve → gallery  
**Batch JSON:** `data/catalog-batch-02-volkswagen.json`  
**Production reports:**  
- `docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID7_PRODUCTION.md`  
- `docs/PHASE1_VOLKSWAGEN_ID_BUZZ_PRODUCTION.json`

## Models processed

| Model | Slug | Car id | Variants | Completion | Image Ready | Draft | Launch/Publish Ready | Status |
|-------|------|--------|----------|:----------:|:-----------:|:-----:|:--------------------:|--------|
| ID.3 | `volkswagen-id-3` | `531fa6cc-a163-4b9d-963e-814bff2bffba` | 4 | 95% | YES | No | YES / YES | Approved, unpublished |
| ID.4 | `volkswagen-id-4` | `c8c17bab-7248-46f9-8cc9-e7ed36a42706` | 2 | 97% | YES (+interior) | No | YES / YES | Approved, unpublished |
| ID.7 | `volkswagen-id-7` | `2d799eaf-774d-4d1c-9d38-09da217efaaa` | 3 | 95% | YES | No | YES / YES | Approved, unpublished |
| ID. Buzz | `volkswagen-id-buzz` | `52e06fcd-2e61-4cd7-8916-1dcf6b841f88` | 4 | 97% | YES (+interior) | No | YES / YES | Approved, unpublished |
| ID.5 | `volkswagen-id-5` | `78d4d39b-af28-434e-9a26-8a1fc198c550` | 0 | 32% | No | No | No | **NOT_READY** |

## Completion definition (this batch)

Finishable models (ID.3, ID.4, ID.7, ID. Buzz) each have:

- Review Assistant completion **≥95%** (Launch Ready floor)
- Hero + Front + Side gallery (Rear / Interior where official assets existed)
- Editorial finalized (no Draft markers; editorial field_sources confidence ≥0.90)
- FAQ section in `score_notes` (no dedicated FAQ column)
- Related models via existing `getRelatedCars` (no schema field)
- Official sources retained (`source_name` / `source_url` / `field_sources`)
- Specs counted from car **or** variants
- `import_status=approved`
- Publish gates pass (`getPublishIssues` empty, including completion threshold)
- `is_published=false` (intentional — no auto-publish)

Blocked:

- **ID.5 = NOT_READY** — insufficient official Norwegian tech PDF; no invented specs/images
- Any model **below 95%** completion cannot be Launch Ready / Publish Ready

## Sources

1. ID.3 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf
2. ID.4 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf
3. ID.7 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf
4. ID. Buzz Pro PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf
5. ID. Buzz GTX PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf
6. Press images — Volkswagen Newsroom albums (ID.3/ID.4/ID.7/ID. Buzz + ID. Buzz 3418 for true side)

## Image notes

- Album-order type labels were often wrong; every attach used **visual verification**.
- ID.7 true side sourced beyond first-5 heuristic (album `id-7-6594`).
- ID. Buzz true side sourced from album `volkswagen-id-buzz-3418` (LWB album lacked a true side).
- Interior left empty where no verified cabin shot existed (ID.3, ID.7).

## Per-model gallery (2026-07-28)

### ID.3
- Front + Hero, Side, Rear — Image Ready  
- Interior: missing (honest)

### ID.4
- Front + Hero, Side, Rear, Interior — Image Ready

### ID.7
- Front + Hero, Side, Rear — Image Ready  
- Interior: missing (honest)

### ID. Buzz
- Front + Hero, Side, Rear, Interior — Image Ready  
- Model year 2027, seats 5 (6/7 packages), cargo 1038 L (Pro Kort bak 2. rad) from Pro PDF

### ID.5
- No gallery — NOT_READY

## Next manufacturer

Do **not** start Volvo / Tesla / Toyota until this document shows COMPLETE and human chooses the next brand.
