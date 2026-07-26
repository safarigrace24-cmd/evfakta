# Volkswagen batch 01

**Date checked:** 2026-07-26
**Brand:** Volkswagen
**Status rule:** every model `needs_review`, `is_published=false`
**Images:** candidates only — not attached, not approved
**Batch JSON:** `data/catalog-batch-02-volkswagen.json`
**Apply script:** `scripts/apply-volkswagen-batch-01.ts`

## Models processed

| Model | Slug | Car id | Variants | Completion % | Readiness |
|-------|------|--------|----------|--------------|-----------|
| ID.3 | `volkswagen-id-3` | `531fa6cc-a163-4b9d-963e-814bff2bffba` | 4 | 100% | partial — needs_review (not publish-ready; editor review required) |
| ID.4 | `volkswagen-id-4` | `c8c17bab-7248-46f9-8cc9-e7ed36a42706` | 2 | 100% | partial — needs_review (not publish-ready; editor review required) |
| ID.5 | `volkswagen-id-5` | `78d4d39b-af28-434e-9a26-8a1fc198c550` | 0 | 50% | shell_only — blocked on missing official NO tech PDF |
| ID.7 | `volkswagen-id-7` | `2d799eaf-774d-4d1c-9d38-09da217efaaa` | 3 | 81% | partial — needs_review (no image candidate stored) |
| ID. Buzz | `volkswagen-id-buzz` | `52e06fcd-2e61-4cd7-8916-1dcf6b841f88` | 4 | 88% | partial — needs_review (GTX range gaps; images not attached) |

## Sources

1. ID.3 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf
2. ID.4 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf
3. ID.7 tekniske data PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf
4. ID. Buzz Pro PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf
5. ID. Buzz GTX PDF — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf
6. Prislister — https://www.volkswagen.no/no/kjope-bil/prisliste.html
7. Modellside ID.3/ID.4/ID.7/ID. Buzz — volkswagen.no

## Per model

### ID.3 (`volkswagen-id-3`)

- **Car id:** `531fa6cc-a163-4b9d-963e-814bff2bffba`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volkswagen Norge — Tekniske data ID.3 (Desember 2025)
- **Completion:** 100%
- **Readiness:** partial — needs_review (not publish-ready; editor review required)
- **Editorial completion helper:** 56% (15/27 tracked items)

#### Variants

| Variant | Slug | Battery net/gross | WLTP | Power | DC | Status |
|---------|------|-------------------|------|-------|----|--------|
| Pure Businessline | `pure-businessline` | 52 / 58 kWh | 387 km | 170 hk | 145 kW | needs_review / inactive |
| Pro Highline | `pro-highline` | 59 / 62 kWh | 430 km | 204 hk | 165 kW | needs_review / inactive |
| Pro S Highline | `pro-s-highline` | 79 / 84 kWh | 561 km | 204 hk | 185 kW | needs_review / inactive |
| GTX Performance FIRE+ICE | `gtx-performance-fire-ice` | 79 / 84 kWh | 586 km | 326 hk | 185 kW | needs_review / inactive |

#### Populated car fields

- `length_mm`
- `width_mm`
- `height_mm`
- `wheelbase_mm`
- `cargo_l`
- `seats`
- `charging_connector_ac`
- `charging_connector_dc`
- `battery_chemistry`
- `warranty`
- `apple_carplay`
- `android_auto`
- `drivetrain`
- `description`
- `pros`
- `cons`
- `suitable_for`
- `score_notes`
- `source_name`
- `source_url`
- `data_last_checked_at`
- `field_sources`
- `warranty`

#### Missing fields

- price_nok (fra-priser finnes på prisliste, ikke lagret som enkeltpris)
- winter_range_km
- real_world_range_km
- frunk_l
- gross_weight_kg (variantavhengig — kun egenvekt lagret på varianter)
- heat_pump (variantavhengig)
- v2l
- primary approved image

#### Conflicts

- **car.length_mm:** Norsk måltabell vs tysk dimensjonsskisse i samme tekniske PDF.
  - `4264` (0.95) — Volkswagen Norge — Tekniske data ID.3 (Desember 2025)
  - `4261` (0.7) — Volkswagen Norge — Tekniske data ID.3 (Desember 2025) (tysk skisse)
- **car.range_km:** Modellside markedsfører «inntil 430 km», mens teknisk PDF har Pro S/GTX inntil 561/586 km. Variantverdier fra PDF er brukt; bilnivå range tomt.
  - `430` (0.7) — Volkswagen Norge — ID.3 modellside
  - `586` (0.95) — Volkswagen Norge — Tekniske data ID.3 (Desember 2025)

#### Image candidates

- https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0276-ID3-exterior-front-stage.jpg
  - source: https://www.volkswagen.no/no/alle-bilmodeller/id3.html
  - status: pending candidate (not attached)
- research job: `4e609967-4fbc-4cff-ade4-053b8fcda2a0` / item `e32cde18-d07f-4d47-9956-b2e859eb6c97`

#### Editorial drafts

All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **Draft – Requires editor review.**

### ID.4 (`volkswagen-id-4`)

- **Car id:** `c8c17bab-7248-46f9-8cc9-e7ed36a42706`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
- **Completion:** 100%
- **Readiness:** partial — needs_review (not publish-ready; editor review required)
- **Editorial completion helper:** 67% (18/27 tracked items)

#### Variants

| Variant | Slug | Battery net/gross | WLTP | Power | DC | Status |
|---------|------|-------------------|------|-------|----|--------|
| Pro 4MOTION | `pro-4motion` | 77 / 82 kWh | 554 km | 299 hk | 165 kW | needs_review / inactive |
| GTX 4MOTION Exclusive | `gtx-4motion-exclusive` | 77 / 84 kWh | 524 km | 340 hk | 185 kW | needs_review / inactive |

#### Populated car fields

- `length_mm`
- `width_mm`
- `height_mm`
- `wheelbase_mm`
- `cargo_l`
- `seats`
- `towing_kg`
- `heat_pump`
- `v2l`
- `charging_connector_ac`
- `charging_connector_dc`
- `battery_chemistry`
- `warranty`
- `apple_carplay`
- `android_auto`
- `drivetrain`
- `ac_charging_kw`
- `description`
- `pros`
- `cons`
- `suitable_for`
- `score_notes`
- `source_name`
- `source_url`
- `data_last_checked_at`
- `field_sources`
- `warranty`

#### Missing fields

- price_nok
- winter_range_km
- real_world_range_km
- frunk_l
- torque_nm (todelt foran/bak)
- separate RWD Pro uten 4MOTION (ikke i denne PDF-tabellen)
- primary approved image

#### Conflicts

- **car.length_mm:** Pro 4MOTION 4584 mm vs GTX 4MOTION 4582 mm.
  - `4584` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
  - `4582` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
- **car.towing_kg:** To offisielle tilhengertall (med/uten brems).
  - `1800` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
  - `750` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
- **car.torque_nm:** PDF oppgir separate dreiemoment for for- og bakaksel — ikke én katalogverdi.
  - `134` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
  - `560` (0.95) — Volkswagen Norge — Tekniske data ID.4 (Mai 2026)

#### Image candidates

- https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/bjarne/16_9_2M3A0972.jpg
  - source: https://www.volkswagen.no/no/alle-bilmodeller/id4.html
  - status: pending candidate (not attached)
- research job: `0d921338-916d-4df7-93f7-c0aae493e81e` / item `5df5b657-9b57-43f7-aaff-d9871b33cc3a`

#### Editorial drafts

All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **Draft – Requires editor review.**

### ID.5 (`volkswagen-id-5`)

- **Car id:** `78d4d39b-af28-434e-9a26-8a1fc198c550`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volkswagen Norge — Prislister
- **Completion:** 50%
- **Readiness:** shell_only — blocked on missing official NO tech PDF
- **Editorial completion helper:** 37% (10/27 tracked items)

#### Variants

_None — shell only._

#### Populated car fields

- `warranty`
- `description`
- `pros`
- `cons`
- `suitable_for`
- `score_notes`
- `source_name`
- `source_url`
- `data_last_checked_at`
- `field_sources`
- `warranty`

#### Missing fields

- Alle tekniske felt — ingen gjeldende ID.5 tekniske-data-PDF på volkswagen.no/prisliste (2026-07-26)
- Modellside /alle-bilmodeller/id5.html redirecter til modelliste
- variants
- official image candidates on active NO model page
- price_nok

#### Conflicts

_None recorded._

#### Image candidates

_No official media URL captured in this batch (do not invent)._

#### Editorial drafts

All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **Draft – Requires editor review.**

### ID.7 (`volkswagen-id-7`)

- **Car id:** `2d799eaf-774d-4d1c-9d38-09da217efaaa`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volkswagen Norge — Tekniske data ID.7 (April 2026)
- **Completion:** 81%
- **Readiness:** partial — needs_review (no image candidate stored)
- **Editorial completion helper:** 56% (15/27 tracked items)

#### Variants

| Variant | Slug | Battery net/gross | WLTP | Power | DC | Status |
|---------|------|-------------------|------|-------|----|--------|
| Pro S Stasjonsvogn | `pro-s-stasjonsvogn` | 86 / 91 kWh | 676 km | 286 hk | 200 kW | needs_review / inactive |
| GTX Fastback | `gtx-fastback` | 86 / 91 kWh | 597 km | 340 hk | 200 kW | needs_review / inactive |
| GTX Stasjonsvogn | `gtx-stasjonsvogn` | 86 / 91 kWh | 590 km | 340 hk | 200 kW | needs_review / inactive |

#### Populated car fields

- `length_mm`
- `cargo_l`
- `seats`
- `heat_pump`
- `v2l`
- `charging_connector_ac`
- `charging_connector_dc`
- `battery_chemistry`
- `warranty`
- `apple_carplay`
- `android_auto`
- `ac_charging_kw`
- `charge_time_10_80_minutes`
- `description`
- `pros`
- `cons`
- `suitable_for`
- `score_notes`
- `source_name`
- `source_url`
- `data_last_checked_at`
- `field_sources`
- `warranty`

#### Missing fields

- price_nok
- winter_range_km
- real_world_range_km
- width_mm / height_mm / wheelbase_mm (ikke sikkert ekstrahert)
- Pro Fastback / Pro uten S (ikke i talltabellen)
- torque_nm for GTX (todelt)
- official image candidate URL (ikke funnet i denne runden)
- primary approved image

#### Conflicts

- **car.cargo_l:** Fastback vs stasjonsvogn bagasjevolum.
  - `532` (0.95) — Volkswagen Norge — Tekniske data ID.7 (April 2026)
  - `605` (0.95) — Volkswagen Norge — Tekniske data ID.7 (April 2026)
- **car.dc_charging_kw:** PDF nevner DC 175 kW (77 kWh) / 200 kW (86 kWh); talltabellen for Pro S/GTX bruker 86 kWh-kolonnen.
  - `175` (0.8) — Volkswagen Norge — Tekniske data ID.7 (April 2026)
  - `200` (0.9) — Volkswagen Norge — Tekniske data ID.7 (April 2026)

#### Image candidates

_No official media URL captured in this batch (do not invent)._

#### Editorial drafts

All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **Draft – Requires editor review.**

### ID. Buzz (`volkswagen-id-buzz`)

- **Car id:** `52e06fcd-2e61-4cd7-8916-1dcf6b841f88`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volkswagen Norge — ID. Buzz prisliste/tekniske data
- **Completion:** 88%
- **Readiness:** partial — needs_review (GTX range gaps; images not attached)
- **Editorial completion helper:** 44% (12/27 tracked items)

#### Variants

| Variant | Slug | Battery net/gross | WLTP | Power | DC | Status |
|---------|------|-------------------|------|-------|----|--------|
| Pro Kort | `pro-kort` | 79 / 84 kWh | 455 km | 286 hk | 183 kW | needs_review / inactive |
| Pro Lang | `pro-lang` | 86 / 91 kWh | 492 km | 286 hk | 199 kW | needs_review / inactive |
| GTX Kort | `gtx-kort` | 79 / 84 kWh | — km | 340 hk | 183 kW | needs_review / inactive |
| GTX Lang | `gtx-lang` | 86 / 91 kWh | — km | 340 hk | 199 kW | needs_review / inactive |

#### Populated car fields

- `length_mm`
- `width_mm`
- `height_mm`
- `wheelbase_mm`
- `charging_connector_ac`
- `charging_connector_dc`
- `warranty`
- `top_speed_kmh`
- `ac_charging_kw`
- `charge_time_10_80_minutes`
- `description`
- `pros`
- `cons`
- `suitable_for`
- `score_notes`
- `source_name`
- `source_url`
- `data_last_checked_at`
- `field_sources`
- `warranty`

#### Missing fields

- price_nok (fra-priser på prisliste, ikke enkeltpris)
- winter_range_km
- real_world_range_km
- cargo_l (seterad-avhengig)
- seats (5/6/7)
- heat_pump (ikke bekreftet som standard i ekstrahert tabell)
- GTX WLTP range_km
- apple_carplay / android_auto
- primary approved image

#### Conflicts

- **car.length_mm:** Kort vs lang karosseri.
  - `4712` (0.95) — Volkswagen Norge — ID. Buzz prisliste/tekniske data
  - `4962` (0.95) — Volkswagen Norge — ID. Buzz prisliste/tekniske data
- **car.towing_kg:** Pro kort 1200 kg vs Pro lang 1000 kg (PDF).
  - `1200` (0.95) — Volkswagen Norge — ID. Buzz prisliste/tekniske data
  - `1000` (0.95) — Volkswagen Norge — ID. Buzz prisliste/tekniske data

#### Image candidates

- https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC03122.jpg
  - source: https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html
  - status: pending candidate (not attached)
- research job: `81dba745-8b4b-4348-9002-aab038674622` / item `3568a1e9-3b98-42b2-96ec-89dee6d3e9bc`

#### Editorial drafts

All of: short introduction (`description`), who for (`suitable_for`), strengths (`pros`), weaknesses (`cons`), winter / charging / daily usability (`score_notes`) — marked **Draft – Requires editor review.**

## Batch readiness summary

- **Publishable now:** no models
- **Ready for editor review:** ID.3, ID.4, ID.7, ID. Buzz
- **Blocked / shell:** ID.5 (no current official NO tech PDF / model page)
- **Next editor actions:** resolve conflicts, confirm variant defaults, attach/approve images manually, verify prices separately if needed, then approve — still do not auto-publish
