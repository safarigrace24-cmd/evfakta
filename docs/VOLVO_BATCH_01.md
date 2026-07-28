# Volvo batch 01

**Date checked:** 2026-07-26T15:00:00.000Z
**Brand:** Volvo
**Rule:** Official Volvo Cars Norge sources only. Never invent. Never auto-publish.
**Images:** candidates only — not attached, not approved  
**Image refresh (2026-07-28):** failed OEM/CDN candidates superseded; Storage-backed replacements in [`VW_VOLVO_IMAGE_REFRESH_REPORT.md`](./VW_VOLVO_IMAGE_REFRESH_REPORT.md) (EX60 not included).
**Apply script:** `scripts/apply-volvo-batch-01.ts`
**Batch JSON:** `data/catalog-batch-03-volvo.json`

## Models processed

| Model | Slug | Car id | Variants | Completion % | Final status |
|-------|------|--------|----------|--------------|--------------|
| EX30 | `volvo-ex30` | `e491e460-4fb5-48d9-b7ce-bb87bddc4394` | 3 | 100% | **READY_FOR_HUMAN_APPROVAL** |
| EX40 | `volvo-ex40` | `0c67bdb4-b11d-4a69-a03b-78e8a23c5da9` | 4 | 100% | **READY_FOR_HUMAN_APPROVAL** |
| EC40 | `volvo-ec40` | `99406a6e-1480-4620-8932-2362d4025a0d` | 4 | 100% | **READY_FOR_HUMAN_APPROVAL** |
| EX90 | `volvo-ex90` | `9f43ec39-0764-42ea-a42d-53727393a32f` | 2 | 100% | **READY_FOR_HUMAN_APPROVAL** |
| ES90 | `volvo-es90` | `fed4fc5c-383e-4c9d-8876-6739d84a8e76` | 3 | 100% | **READY_FOR_HUMAN_APPROVAL** |
| EX60 | `volvo-ex60` | `a256d583-1984-4310-b217-e66f07f3a298` | 3 | 100% | **READY_FOR_HUMAN_APPROVAL** |

## Sources

- **ex30Specs:** Volvo Cars Norge — EX30 spesifikasjoner — https://www.volvocars.com/no/cars/ex30-electric/specifications/
- **ex30Page:** Volvo Cars Norge — EX30 modellside — https://www.volvocars.com/no/cars/ex30-electric/
- **ex40Specs:** Volvo Cars Norge — EX40 spesifikasjoner — https://www.volvocars.com/no/cars/ex40-electric/specifications/
- **ex40Page:** Volvo Cars Norge — EX40 modellside — https://www.volvocars.com/no/cars/ex40-electric/
- **ec40Specs:** Volvo Cars Norge — EC40 spesifikasjoner — https://www.volvocars.com/no/cars/ec40-electric/specifications/
- **ec40Page:** Volvo Cars Norge — EC40 modellside — https://www.volvocars.com/no/cars/ec40-electric/
- **ex90Specs:** Volvo Cars Norge — EX90 spesifikasjoner — https://www.volvocars.com/no/cars/ex90-electric/specifications/
- **ex90Page:** Volvo Cars Norge — EX90 modellside — https://www.volvocars.com/no/cars/ex90-electric/
- **es90Specs:** Volvo Cars Norge — ES90 spesifikasjoner — https://www.volvocars.com/no/cars/es90-electric/specifications/
- **es90Page:** Volvo Cars Norge — ES90 modellside — https://www.volvocars.com/no/cars/es90-electric/
- **es90Press:** Volvo Cars Media NO — ES90 pressemelding — https://www.volvocars.com/no/media/press-releases/E9CE08417671E121/
- **ex60Specs:** Volvo Cars Norge — EX60 spesifikasjoner — https://www.volvocars.com/no/cars/ex60-electric/specifications/
- **ex60Page:** Volvo Cars Norge — EX60 modellside — https://www.volvocars.com/no/cars/ex60-electric/
- **ex60Press:** Volvo Cars Media NO — EX60 pressemelding — https://www.volvocars.com/no/media/press-releases/66BC87BAF48EA777/
- **batteryWarranty:** Volvo Cars Norge — Batterigaranti for elbil og ladbar hybrid — https://www.volvocars.com/no/l/own/garanti-hybridbatteri/

## Per model

### EX30 (`volvo-ex30`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `e491e460-4fb5-48d9-b7ce-bb87bddc4394`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — EX30 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/e491e460-4fb5-48d9-b7ce-bb87bddc4394/rediger](/admin/biler/e491e460-4fb5-48d9-b7ce-bb87bddc4394/rediger)
- **Variants admin:** [/admin/biler/e491e460-4fb5-48d9-b7ce-bb87bddc4394/varianter](/admin/biler/e491e460-4fb5-48d9-b7ce-bb87bddc4394/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-ex30](/modeller/volvo-ex30)
- **Research images job:** [/admin/import/research/50a26664-102c-4263-bdc6-1c7c125c9cbb](/admin/import/research/50a26664-102c-4263-bdc6-1c7c125c9cbb)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| P5 Elektrisk | `p5-elektrisk` | 51 / — | 337 | 272 | 150 | 26 | 1400 |
| P5 Long Range Elektrisk | `p5-long-range-elektrisk` | 69 / — | 475 | 272 | 175 | 27 | 1600 |
| P8 AWD Elektrisk | `p8-awd-elektrisk` | 69 / — | 450 | 428 | 175 | 27 | 1600 |

#### Missing fields

- battery_usable_kwh
- ac_charging_kw
- charging_connector_ac/dc
- heat_pump
- v2l/v2g
- winter_range_km
- price_nok
- approved gallery

#### Conflicts

- **car.towing_kg:** Tilhengervekt er variantavhengig (1400 vs 1600 kg) — bilnivå tomt.
  - `1400` — Volvo Cars Norge — EX30 spesifikasjoner
  - `1600` — Volvo Cars Norge — EX30 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2027/416/exterior/studio/front/exterior-studio-front_F8E01D79B36C25D664D42846503C09E53C24E6B7.png
- `rear`: https://wizz.volvocars.com/images/2027/416/exterior/studio/rear/exterior-studio-rear_E389043609B2B1D802EBF322C5DBB53AC42E783B.png
- `side`: https://wizz.volvocars.com/images/2027/416/exterior/studio/right/exterior-studio-right_6F6CD1FDC984468B6C66F1E170524E7DBF3867C6.png
- `exterior`: https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/bltc1ede7d0b1c955ff/694150ec1b1306a472365b21/my27ex30-hero-21-9.jpg

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

### EX40 (`volvo-ex40`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `0c67bdb4-b11d-4a69-a03b-78e8a23c5da9`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — EX40 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/0c67bdb4-b11d-4a69-a03b-78e8a23c5da9/rediger](/admin/biler/0c67bdb4-b11d-4a69-a03b-78e8a23c5da9/rediger)
- **Variants admin:** [/admin/biler/0c67bdb4-b11d-4a69-a03b-78e8a23c5da9/varianter](/admin/biler/0c67bdb4-b11d-4a69-a03b-78e8a23c5da9/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-ex40](/modeller/volvo-ex40)
- **Research images job:** [/admin/import/research/604454bd-acf4-4c23-b44b-3cf4504c8d69](/admin/import/research/604454bd-acf4-4c23-b44b-3cf4504c8d69)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| Single Motor | `single-motor` | 70 / — | 477 | 238 | 200 | 26 | 1500 |
| Single Motor Extended Range | `single-motor-extended-range` | 82 / — | 571 | 252 | 200 | 28 | 1500 |
| Twin Motor | `twin-motor` | 82 / — | 538 | 408 | 200 | 28 | 1800 |
| Twin Motor Performance | `twin-motor-performance` | 82 / — | 537 | 442 | 200 | 28 | 1800 |

#### Missing fields

- battery_usable_kwh
- ac_charging_kw
- connectors
- heat_pump
- v2l/v2g
- winter_range_km
- approved gallery

#### Conflicts

- **car.towing_kg:** Tilhengervekt 1500 kg (RWD) vs 1800 kg (AWD) — bilnivå tomt.
  - `1500` — Volvo Cars Norge — EX40 spesifikasjoner
  - `1800` — Volvo Cars Norge — EX40 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2027/536/exterior/studio/front/exterior-studio-front_2D1B19E2A6DF4BFF448CD0635AF4AED3FA981101.png
- `rear`: https://wizz.volvocars.com/images/2027/536/exterior/studio/rear/exterior-studio-rear_E35B003663CAB500FB6614257A0079B4216E9A03.png
- `side`: https://wizz.volvocars.com/images/2027/536/exterior/studio/right/exterior-studio-right_ECDAB88769B0C6C3E05B8C91369B915DF6EE119D.png
- `interior`: https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blta22f8381377a761e/684c33755dac7b8b0d1936e8/Interior-bento-dashboard-16x9-EX40.jpg

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

### EC40 (`volvo-ec40`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `99406a6e-1480-4620-8932-2362d4025a0d`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — EC40 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/99406a6e-1480-4620-8932-2362d4025a0d/rediger](/admin/biler/99406a6e-1480-4620-8932-2362d4025a0d/rediger)
- **Variants admin:** [/admin/biler/99406a6e-1480-4620-8932-2362d4025a0d/varianter](/admin/biler/99406a6e-1480-4620-8932-2362d4025a0d/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-ec40](/modeller/volvo-ec40)
- **Research images job:** [/admin/import/research/545711f9-ee22-4236-b243-b0b3bfe99fa5](/admin/import/research/545711f9-ee22-4236-b243-b0b3bfe99fa5)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| Single Motor | `single-motor` | 70 / — | 486 | 238 | 200 | 26 | 1500 |
| Single Motor Extended Range | `single-motor-extended-range` | 82 / — | 581 | 252 | 200 | 28 | 1500 |
| Twin Motor | `twin-motor` | 82 / — | 550 | 408 | 200 | 28 | 1800 |
| Twin Motor Performance | `twin-motor-performance` | 82 / — | 550 | 442 | 200 | 28 | 1800 |

#### Missing fields

- battery_usable_kwh
- ac_charging_kw
- connectors
- heat_pump
- interior image candidate
- winter_range_km
- approved gallery

#### Conflicts

- **car.towing_kg:** Tilhengervekt 1500 vs 1800 kg avhengig av drivlinje — bilnivå tomt.
  - `1500` — Volvo Cars Norge — EC40 spesifikasjoner
  - `1800` — Volvo Cars Norge — EC40 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2026/539/exterior/studio/front/exterior-studio-front_25296E96A64E4B51554776CF6FD52B273396033E.png
- `rear`: https://wizz.volvocars.com/images/2026/539/exterior/studio/rear/exterior-studio-rear_E3833E47E403F6E813740B9993A37EBD20E35522.png
- `side`: https://wizz.volvocars.com/images/2026/539/exterior/studio/right/exterior-studio-right_63D9C02D5A4148D6C2CBF051008F7634BA7CEE8D.png

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

### EX90 (`volvo-ex90`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `9f43ec39-0764-42ea-a42d-53727393a32f`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — EX90 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/9f43ec39-0764-42ea-a42d-53727393a32f/rediger](/admin/biler/9f43ec39-0764-42ea-a42d-53727393a32f/rediger)
- **Variants admin:** [/admin/biler/9f43ec39-0764-42ea-a42d-53727393a32f/varianter](/admin/biler/9f43ec39-0764-42ea-a42d-53727393a32f/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-ex90](/modeller/volvo-ex90)
- **Research images job:** [/admin/import/research/b5a58947-9c67-40f3-a074-e6d061964e9f](/admin/import/research/b5a58947-9c67-40f3-a074-e6d061964e9f)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| Twin Motor | `twin-motor` | 106 / — | 617 | 456 | 350 | 22 | 2200 |
| Twin Motor Performance | `twin-motor-performance` | 106 / — | 617 | 680 | 350 | 22 | 2200 |

#### Missing fields

- seats (6–7)
- cargo_l (config-dependent)
- battery_usable_kwh
- ac_charging_kw
- connectors
- heat_pump
- winter_range_km
- approved gallery

#### Conflicts

- **car.seats:** Spesifikasjonssiden oppgir 6–7 seter — bilnivå seats er tomt.
  - `6` — Volvo Cars Norge — EX90 spesifikasjoner
  - `7` — Volvo Cars Norge — EX90 spesifikasjoner
- **car.cargo_l:** Bagasjevolum avviker mellom 6- og 7-seters konfigurasjon (f.eks. bak 2. rad 690 vs 697 l) — bilnivå cargo tomt.
  - `690` — Volvo Cars Norge — EX90 spesifikasjoner
  - `697` — Volvo Cars Norge — EX90 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2026/356/exterior/studio/front/exterior-studio-front_B84CE46D0C58BB67BDF89F4305F0FF796EF0D00E.png
- `rear`: https://wizz.volvocars.com/images/2026/356/exterior/studio/rear/exterior-studio-rear_C643506BD6A3BE36E04C9608776EEA2A23275C23.png
- `side`: https://wizz.volvocars.com/images/2026/356/exterior/studio/right/exterior-studio-right_36F8B3F29F8EB47F0267321543141B9E4C4BA52E.png
- `interior`: https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blta490e03f0ab35261/682d870418fbf41a93365f33/Interior-bento-dashboard-16x9-EX90.jpg

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

### ES90 (`volvo-es90`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `fed4fc5c-383e-4c9d-8876-6739d84a8e76`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — ES90 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/fed4fc5c-383e-4c9d-8876-6739d84a8e76/rediger](/admin/biler/fed4fc5c-383e-4c9d-8876-6739d84a8e76/rediger)
- **Variants admin:** [/admin/biler/fed4fc5c-383e-4c9d-8876-6739d84a8e76/varianter](/admin/biler/fed4fc5c-383e-4c9d-8876-6739d84a8e76/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-es90](/modeller/volvo-es90)
- **Research images job:** [/admin/import/research/463d9167-e6e1-4a96-bff6-a524a7eaa81a](/admin/import/research/463d9167-e6e1-4a96-bff6-a524a7eaa81a)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| Single Motor Extended Range | `single-motor-extended-range` | 92 / 88 | 664 | 333 | 350 | 22 | 1600 |
| Twin Motor | `twin-motor` | 106 / 102 | 702 | 456 | 350 | 22 | 2000 |
| Twin Motor Performance | `twin-motor-performance` | 106 / 102 | 702 | 680 | 350 | 22 | 2000 |

#### Missing fields

- ac_charging_kw
- connectors
- heat_pump
- winter_range_km
- approved gallery

#### Conflicts

- **variant.single-motor-extended-range.acceleration_0_100:** Pressemelding oppgav 6,9 s; spesifikasjonssiden oppgir 6,6 s. Specs-verdi lagret.
  - `6.9` — Volvo Cars Media NO — ES90 pressemelding
  - `6.6` — Volvo Cars Norge — ES90 spesifikasjoner
- **variant.twin-motor.power_hp:** Pressemelding oppgav 449 hk / 330 kW; spesifikasjonssiden oppgir 456 hk / 335 kW. Specs-verdi lagret.
  - `449` — Volvo Cars Media NO — ES90 pressemelding
  - `456` — Volvo Cars Norge — ES90 spesifikasjoner
- **car.towing_kg:** Single Motor 1600 kg vs Twin Motor 2000 kg — bilnivå tomt.
  - `1600` — Volvo Cars Norge — ES90 spesifikasjoner
  - `2000` — Volvo Cars Norge — ES90 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2027/334/exterior/studio/front/exterior-studio-front_3E4FF4C02A8D127CB804ED89285E07695C7984B8.png
- `rear`: https://wizz.volvocars.com/images/2027/334/exterior/studio/rear/exterior-studio-rear_1BA29770DA3B42336CE2A15C76F8F5B46803A3A9.png
- `side`: https://wizz.volvocars.com/images/2027/334/exterior/studio/right/exterior-studio-right_584AFF51A8F0B7F29515169A455923B246136A64.png
- `exterior`: https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt0366f556c8a28cf7/696a3b021b130699343700ca/my27-es90-hero-21-9.jpg
- `interior`: https://wizz.volvocars.com/images/2027/334/interior/studio/rear/interior-studio-rear_2013ADE2BCF13AF54BA9BA95A2902194B431E2A5.png

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

### EX60 (`volvo-ex60`) — **READY_FOR_HUMAN_APPROVAL**

- **Car id:** `a256d583-1984-4310-b217-e66f07f3a298`
- **import_status:** `needs_review`
- **is_published:** `false`
- **Primary source:** Volvo Cars Norge — EX60 spesifikasjoner
- **Completion %:** 100%
- **Editorial helper %:** 48%
- **Why READY_FOR_HUMAN_APPROVAL:** Official Norge specs mapped to variants; sources + last-checked set; editorial drafts complete with draft marker; image candidates stored; remains unpublished / needs_review.
- **Admin:** [/admin/biler/a256d583-1984-4310-b217-e66f07f3a298/rediger](/admin/biler/a256d583-1984-4310-b217-e66f07f3a298/rediger)
- **Variants admin:** [/admin/biler/a256d583-1984-4310-b217-e66f07f3a298/varianter](/admin/biler/a256d583-1984-4310-b217-e66f07f3a298/varianter)
- **Public (unpublished until publish):** [/modeller/volvo-ex60](/modeller/volvo-ex60)
- **Research images job:** [/admin/import/research/d5d4c0e3-f259-4691-8784-818fd2cae84d](/admin/import/research/d5d4c0e3-f259-4691-8784-818fd2cae84d)

#### Variants

| Variant | Slug | Battery total/usable | WLTP | Power | DC | 10–80 | Towing |
|---------|------|----------------------|------|-------|----|-------|--------|
| P6 Elektrisk | `p6-elektrisk` | 83 / 80 | 611 | 374 | 350 | 16 | 2000 |
| P10 AWD Elektrisk | `p10-awd-elektrisk` | 95 / 91 | 660 | 510 | 400 | 16 | 2400 |
| P12 AWD Elektrisk | `p12-awd-elektrisk` | 117 / 112 | 810 | 680 | 400 | 19 | 2400 |

#### Missing fields

- ac_charging_kw
- connectors
- heat_pump
- winter_range_km
- Cross Country variants (MY2028 noted on model page — not created)
- approved gallery

#### Conflicts

- **variant.p6-elektrisk.range_km:** Pressemelding oppgav inntil 620 km for P6; spesifikasjonssiden oppgir 611 km. Specs-verdi lagret.
  - `620` — Volvo Cars Media NO — EX60 pressemelding
  - `611` — Volvo Cars Norge — EX60 spesifikasjoner
- **car.towing_kg:** P6 2000 kg vs P10/P12 2400 kg — bilnivå tomt.
  - `2000` — Volvo Cars Norge — EX60 spesifikasjoner
  - `2400` — Volvo Cars Norge — EX60 spesifikasjoner

#### Image candidates (pending)

- `front`: https://wizz.volvocars.com/images/2027/516/exterior/studio/front/exterior-studio-front_4BB37BEEEC966E721B776845A09F478D63E463BF.png
- `rear`: https://wizz.volvocars.com/images/2027/516/exterior/studio/rear/exterior-studio-rear_5F6B7672CAD8D27CBF53E94D0912A7DA8FCEB960.png
- `side`: https://wizz.volvocars.com/images/2027/516/exterior/studio/right/exterior-studio-right_40BAAB0C1DACBC042A400A3BB3AF20FA5A0C80E9.png
- `exterior`: https://www.volvocars.com/images/cs/v3/assets/blt0feaa88e629251fc/blt6d8dc19eee4f407c/696f3c456363b5f6d43f2ebf/overview-hero-16-9.jpg
- `interior`: https://wizz.volvocars.com/images/2027/516/interior/studio/rear/interior-studio-rear_64DF91E93322D976B05939392113FAACC32AEDC1.png

#### Editorial

Drafts present for introduction, who-for, pros/cons, winter, charging, daily use, long-distance — marked **Draft – Requires editor review.**

## Publication readiness

| Check | Notes |
|-------|-------|
| Official source | Pass for all six models (Volvo Cars Norge specs) |
| Images (approved gallery) | Fail — candidates only |
| Variants | Pass — official trims only |
| Specifications | Pass — sourced / variant-split; empties left null |
| Editorial | Pass as drafts (marker retained) |
| Review / Approval / Publication | Not performed |

## Human actions next

1. Open each model in Car Editor / Production dashboard
2. Rewrite drafts; remove draft markers
3. Resolve documented conflicts with explicit editor decisions
4. Verify CDN image access/rights; attach and approve gallery
5. Confirm connectors/heat pump if found in manuals
6. Approve manually, then publish manually — never automatic

## Safety confirmation

- No model published
- No automatic approval
- No image auto-attach
- No commit/push by this script

# EVFAKTA Editorial Decision

This section is an editorial recommendation only.

It must NEVER write to the database.

It must NEVER affect:

- import_status
- is_published
- approval state
- review state
- production dashboard

It exists only inside this generated markdown report.

| Model | Recommendation | Reason |
|--------|----------------|--------|
| EX30 | Publish Candidate | Complete Norwegian specifications and editorial draft ready. |
| EX40 | Publish Candidate | Complete official documentation. |
| EC40 | Publish Candidate | Complete official documentation. |
| EX90 | Hold for Review | Seat and cargo configuration should be confirmed before publication. |
| ES90 | Hold for Review | Minor specification conflicts require editorial confirmation. |
| EX60 | Await Official Documentation | Production specifications are still evolving and should be verified after full Norwegian launch. |
