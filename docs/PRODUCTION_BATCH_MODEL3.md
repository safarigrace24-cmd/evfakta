# Production batch: Tesla Model 3 (reference car)

**Date checked:** 2026-07-26  
**Car id:** `cd2df65a-f868-4385-9c73-f79356f295ae`  
**Slug:** `tesla-model-3`  
**Status:** `needs_review`, `is_published=false`  
**Public prices/scores:** still hidden (`PUBLIC_SHOW_PRICES=false`, `PUBLIC_SHOW_SCORES=false`)

## Jobs

| Step | Job id | Status |
|------|--------|--------|
| Live Tesla Norge fetch | `b3357e86-ab2f-4257-8955-08f6769608a6` | `awaiting_manual` |
| Structured official-manual JSON | `82dfd7a4-0607-456b-8ad3-ef6b07bf357e` | `completed` (item applied as needs_review) |

## Finding

No prior `tesla-model-3` row existed in Supabase. This batch created the reference car via the research tables + apply path. Live Tesla Norge fetch did not yield usable specs (blocked / empty) and was left as `awaiting_manual`.

## Fields populated (applied to car)

| Field | Value |
|-------|-------|
| `brand` | Tesla |
| `model` | Model 3 |
| `slug` | tesla-model-3 |
| `model_generation` | Highland |
| `vehicle_type` | Personbil |
| `body_style` | Sedan |
| `seats` | 5 |
| `frunk_l` | 88 |
| `wheelbase_mm` | 2875 |
| `heat_pump` | true |
| `charging_connector_ac` | Type 2 |
| `charging_connector_dc` | CCS2 |
| `description` | Tesla Model 3 er en helelektrisk sedan solgt i Norge via Tesla. Denne oppføringen er under redaksjonell gjennomgang: tall for rekkevidde, batteri og ytelse varierer mellom varianter og må bekreftes mot Tesla Norge før pu… |
| `pros` | Offisiell EU-manual dokumenterer praktisk bagasjevolum inkludert frunk (88 l).; CCS2-ladeport for Europa er dokumentert i Tesla-manualen.; Varmepumpe er forventet på Highland-generasjonen (etter ca. oktober 2020) ifølge … |
| `cons` | Variantspesifikke WLTP-/batteritall er ikke bekreftet mot Tesla Norge i denne batchen (live-side blokkert).; Tilhengervekt kan ikke lagres som én verdi — manualen skiller 750 kg / 1000 kg.; Lengde og høyde varierer mello… |
| `suitable_for` | Pendling; Familie (5 seter); Lengre turer (når variantrekkevidde er bekreftet); Vinterkjøring med varmepumpe (kvalitativt — tall mangler); Draft – Requires editor review. |
| `source_name` | Tesla Norge + Tesla Owner's Manual (Europe) |
| `source_url` | https://www.tesla.com/no_NO/model3 |
| `data_last_checked_at` | 2026-07-26T08:00:00+00:00 |
| `import_status` | needs_review |
| `is_published` | false |

### Variants (all inactive / needs_review)

- `rear-wheel-drive` — Rear-Wheel Drive — drivetrain=Bakhjulsdrift — active=false — default=true
- `long-range-rwd` — Long Range RWD — drivetrain=Bakhjulsdrift — active=false — default=false
- `long-range-awd` — Long Range AWD — drivetrain=Firehjulsdrift — active=false — default=false
- `performance` — Performance — drivetrain=Firehjulsdrift — active=false — default=false

## Sources used

1. **Tesla Norge** — https://www.tesla.com/no_NO/model3 — preferred, live blocked; kept as primary source pointer on the car.
2. **Tesla Model 3 Owner's Manual (Europe)** — https://www.tesla.com/ownersmanual/model3/en_eu/Owners_Manual.pdf — applied facts (frunk, wheelbase, seats context, connectors, heat-pump generation context).
3. **Tesla Owner's Manual heat-pump note** — https://www.tesla.com/ownersmanual/2017_2023_model3/en_us/GUID-ECA7C07B-7944-496B-8FC5-12762BF061F1.html
4. **Secondary only (conflicts, not applied as facts):** EV-Database, EVKX.net, NAF/Motor summer-test coverage, Elbil RADAR, secondary warranty blogs.

Batch file: `data/research-batch-model3-tesla.json`

## Conflicts (unresolved)

- **variant:long-range-rwd.`battery_usable_kwh`** = `75` · confidence=0.55 · EV-Database (secondary) · Secondary sources disagree on usable battery for Long Range RWD — do not apply until Tesla Norge / CoC verified. | Useable Capacity* 75.0 kWh — secondary aggregator
- **variant:long-range-rwd.`battery_usable_kwh`** = `78` · confidence=0.5 · EVKX.net (secondary) · Secondary sources disagree on usable battery for Long Range RWD — do not apply until Tesla Norge / CoC verified. | Net 78 kWh — secondary aggregator
- **car.`cargo_l`** = `594` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) · Behind-2nd-row cargo volume differs across Tesla manuals (594 L EU current vs 561 L older GB manual). | Cargo Volume — Behind 2nd row 21 cu ft (594 L)
- **car.`cargo_l`** = `561` · confidence=0.8 · Tesla Model 3 Owner's Manual (GB, 2017–2023) · Behind-2nd-row cargo volume differs across Tesla manuals (594 L EU current vs 561 L older GB manual). | Older generation cargo figure — do not mix with Highland without confirmation
- **car.`height_mm`** = `1440` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) — RWD/Long Range · Tesla EU Owner's Manual lists 1440 mm (RWD/Long Range) and 1431 mm (Performance).
- **car.`height_mm`** = `1431` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) — Performance · Tesla EU Owner's Manual lists 1440 mm (RWD/Long Range) and 1431 mm (Performance).
- **car.`length_mm`** = `4720` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) — RWD/Long Range · Tesla EU Owner's Manual lists 4720 mm (RWD/Long Range) and 4724 mm (Performance). | Exterior Dimensions, RWD/Long Range table
- **car.`length_mm`** = `4724` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) — Performance · Tesla EU Owner's Manual lists 4720 mm (RWD/Long Range) and 4724 mm (Performance). | Exterior Dimensions, Performance table
- **variant:long-range-rwd.`real_world_range_km`** = `729` · confidence=0.55 · NAF/Motor sommer-rekkeviddetest 2025 (via Bobil og Caravan / NAF coverage) · NAF/Motor summer test vs winter reporting disagree; not official Tesla Norge WLTP. Do not apply. | Achieved km in summer test for a Model 3 listed with WLTP 702 — confirm trim before use
- **variant:long-range-rwd.`real_world_range_km`** = `536` · confidence=0.4 · Elbil RADAR summary of winter testing (secondary) · NAF/Motor summer test vs winter reporting disagree; not official Tesla Norge WLTP. Do not apply. | Winter test figure cited for Long Range RWD Highland — secondary aggregation
- **car.`towing_kg`** = `750` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) · EU Owner's Manual lists two towing capacities depending on trailer brakes. | Without trailer brakes — requires factory tow package
- **car.`towing_kg`** = `1000` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) · EU Owner's Manual lists two towing capacities depending on trailer brakes. | With trailer brakes — requires factory tow package
- **car.`warranty`** = `"Nybilgaranti oppgitt som 4 år / 80 000 km i enkelte sekundærkilder — ikke bekreftet mot Tesla Norge i denne batchen"` · confidence=0.35 · Secondary (unverified vs Tesla Norge) · Secondary Norwegian write-ups disagree on basic vehicle warranty duration (4y/80k vs 5y/100k). Verify on Tesla Norge support before publishing. | Do not publish warranty string until Tesla Norge page captured
- **car.`warranty`** = `"Enkelte sekundærkilder oppgir 5 år / 100 000 km grunngaranti — konflikt"` · confidence=0.3 · Secondary legal blogs (unverified) · Secondary Norwegian write-ups disagree on basic vehicle warranty duration (4y/80k vs 5y/100k). Verify on Tesla Norge support before publishing.
- **car.`width_mm`** = `1850` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) · Width depends on mirror fold state in Tesla EU Owner's Manual. | Overall Width excluding mirrors
- **car.`width_mm`** = `2089` · confidence=0.95 · Tesla Model 3 Owner's Manual (Europe) · Width depends on mirror fold state in Tesla EU Owner's Manual. | Overall Width including mirrors

## Missing fields

Editorial completion: **48%** (13/27). Publish ready: **no**.

Checklist missing:

- Variant
- Battery
- Battery chemistry
- Range (WLTP)
- Real-world range
- Consumption
- Charging
- Performance
- Tow capacity
- Front image
- Rear image
- Interior photo
- Gallery complete
- Approved

Still empty on car (intentionally, awaiting Tesla Norge / conflict resolution):

- range_km, winter_range_km, real_world_range_km
- battery_total_kwh, battery_usable_kwh, battery_chemistry, battery_kwh
- consumption_kwh_100km
- ac_charging_kw, dc_charging_kw, charge_time_10_80_minutes
- power_hp, torque_nm, acceleration_0_100, top_speed_kmh
- length_mm, height_mm, width_mm
- cargo_l, towing_kg, warranty
- image_url / approved gallery images
- price_nok / EVFAKTA scores (kept empty / hidden)

## Image candidates (not attached)

- [front] Tesla Model 3 — official product page (front candidate) — Tesla Norge — status=pending — Official Tesla marketing page. Bot fetch returned 403 — editor must download/approve assets manually.
- [rear] Tesla Model 3 — rear candidate from official page — Tesla Norge — status=pending — Official Tesla marketing page.
- [side] Tesla Model 3 — side candidate from official page — Tesla Norge — status=pending — Official Tesla marketing page.
- [interior] Tesla Model 3 — interior candidate source — Tesla Model 3 Owner's Manual (Europe) — status=pending — Owner's manual figures/illustrations — confirm reuse rights.
- [cargo] Tesla Model 3 — cargo candidate source — Tesla Model 3 Owner's Manual (Europe) — status=pending — Manual cargo volume section documents frunk/trunk capacities.

Attached `car_images` rows: **0** (must stay 0 until approval).

## Field review queue (lowest confidence first)

- `source_name` confidence=null status=pending low=true draft=false
- `source_url` confidence=null status=pending low=true draft=false
- `cons` confidence=0.35 status=pending low=true draft=true
- `pros` confidence=0.35 status=pending low=true draft=true
- `suitable_for` confidence=0.35 status=pending low=true draft=true
- `description` confidence=0.4 status=pending low=true draft=true
- `charging_connector_ac` confidence=0.85 status=pending low=true draft=false
- `body_style` confidence=0.85 status=pending low=true draft=false
- `charging_connector_dc` confidence=0.85 status=pending low=true draft=false
- `frunk_l` confidence=0.85 status=pending low=true draft=false
- `heat_pump` confidence=0.85 status=pending low=true draft=false
- `seats` confidence=0.85 status=pending low=true draft=false
- `vehicle_type` confidence=0.85 status=pending low=true draft=false
- `wheelbase_mm` confidence=0.85 status=pending low=true draft=false

## Exact manual review steps

1. Open `/admin/import/research/82dfd7a4-0607-456b-8ad3-ef6b07bf357e` and resolve every **conflict** candidate (do not auto-pick winners).
2. Continue the live job `/admin/import/research/b3357e86-ab2f-4257-8955-08f6769608a6` with a human-captured Tesla Norge / PDF paste once access works.
3. Open `/admin/biler/cd2df65a-f868-4385-9c73-f79356f295ae/rediger`:
   - Overview → field review cards (sorted lowest confidence first)
   - Rewrite editorial drafts (description / pros / cons / suitable_for)
4. Specifications: enter only Tesla Norge / CoC-backed numbers; leave blanks when unsure.
5. Variants (`/admin/biler/cd2df65a-f868-4385-9c73-f79356f295ae/varianter`): fill each inactive trim, then activate only after review.
6. Images: download official stills; attach front/rear/side/interior/cargo with source notes; do not publish yet.
7. Sources: finalize `source_name`, `source_url`, `data_last_checked_at`.
8. Keep **Needs Review** until conflicts cleared → **Approved** → separate **Publish** action.
9. Confirm public UI still hides prices and EVFAKTA scores.

## Hard rules respected

- No schema changes
- No new platform features
- No invented specs applied as facts
- No auto-publish / no image attach
- Conflicts preserved for humans

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
| Tesla Model 3 | Hold for Review | Dimensions/warranty/connectors are sourced; variant WLTP/battery/power still need Tesla Norge confirmation. |
