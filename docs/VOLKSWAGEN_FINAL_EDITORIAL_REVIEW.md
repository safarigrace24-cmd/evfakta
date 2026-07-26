# Volkswagen final editorial review

**Date:** 2026-07-26T14:00:00.000Z
**Brand:** Volkswagen (first publication-ready brand candidate)
**Standards:** `docs/CAR_BLUEPRINT.md`, `docs/REFERENCE_WORKFLOW.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/TESLA_VW_BATCH_READINESS.md`
**Safety:** No model published. No automatic approval. No image auto-attach. Tesla untouched. No commit/push by this script.

---

## 1. Executive summary

Volkswagen ID.3, ID.4, ID.7 and ID. Buzz are prepared for **human approval** as the first brand package. All four remain `is_published = false` and `import_status = needs_review`.

Volkswagen ID.5 remains **NOT_READY** because no current official Norwegian technical PDF / active model page was available. No invented specs were added.

**Final publish is still blocked for every model** until a human:

1. Removes draft markers and rewrites editorial text as needed  
2. Selects, attaches and approves gallery images (candidates ≠ approved images)  
3. Sets `import_status = approved` after review  
4. Explicitly publishes (approval ≠ publish)

---

## 2. Status for every Volkswagen model

| Model | Final status | Reason (short) |
|-------|--------------|----------------|
| ID.3 | READY_FOR_HUMAN_APPROVAL | Official PDF + variants + drafts + candidates |
| ID.4 | READY_FOR_HUMAN_APPROVAL | Official PDF + variants + drafts + candidates |
| ID.5 | NOT_READY | No current NO tech documentation |
| ID.7 | READY_FOR_HUMAN_APPROVAL | Official PDF + body-split notes + candidate |
| ID. Buzz | READY_FOR_HUMAN_APPROVAL | Pro/GTX PDF + GTX towing/torque filled |

### ID.3 (`volkswagen-id-3`) — **READY_FOR_HUMAN_APPROVAL**

- Car id: `531fa6cc-a163-4b9d-963e-814bff2bffba`
- Admin: [/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/rediger](/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/rediger)
- Variants admin: [/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/varianter](/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/varianter)
- Public preview (unpublished): [/modeller/volkswagen-id-3](/modeller/volkswagen-id-3)
- import_status: `needs_review`
- is_published: `false`
- source_name: Volkswagen Norge — Tekniske data ID.3 (Desember 2025)
- source_url: https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf
- data_last_checked_at: 2026-07-26T14:00:00+00:00
- Gallery images: 0
- Image candidates: 5
- Publish blockers (getPublishIssues): image, import_status

**Why READY_FOR_HUMAN_APPROVAL:** Offisiell NO teknisk PDF kartlagt til fire varianter, feltkilder på plass, editorial drafts komplette med draft-markør, bildekandidater finnes. Mangler menneskelig bildegodkjenning, draft-omskriving og import_status=approved.

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
| Pure Businessline | `pure-businessline` | 387 | 52 / 58 | 170 | 145 | — | needs_review/inactive |
| Pro Highline | `pro-highline` | 430 | 59 / 62 | 204 | 165 | — | needs_review/inactive |
| Pro S Highline | `pro-s-highline` | 561 | 79 / 84 | 204 | 185 | — | needs_review/inactive |
| GTX Performance FIRE+ICE | `gtx-performance-fire-ice` | 586 | 79 / 84 | 326 | 185 | — | needs_review/inactive |

#### Image candidates (pending)

- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0276-ID3-exterior-front-stage.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0276-ID3-exterior-front-stage.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0285-ID3-exterior-front-side.jpg
- `interior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/interior/IN0333-id3-interior-unecce.jpg
- `side` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-3/id-3-pa-2023/exterior/IN0261-ID3-exterior-side-driving.jpg

### ID.4 (`volkswagen-id-4`) — **READY_FOR_HUMAN_APPROVAL**

- Car id: `c8c17bab-7248-46f9-8cc9-e7ed36a42706`
- Admin: [/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/rediger](/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/rediger)
- Variants admin: [/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/varianter](/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/varianter)
- Public preview (unpublished): [/modeller/volkswagen-id-4](/modeller/volkswagen-id-4)
- import_status: `needs_review`
- is_published: `false`
- source_name: Volkswagen Norge — Tekniske data ID.4 (Mai 2026)
- source_url: https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf
- data_last_checked_at: 2026-07-26T14:00:00+00:00
- Gallery images: 0
- Image candidates: 4
- Publish blockers (getPublishIssues): import_status

**Why READY_FOR_HUMAN_APPROVAL:** Pro 4MOTION + GTX 4MOTION fra ID.4 PDF Mai 2026, konflikter dokumentert (ikke skjult), editorial drafts komplette, bildekandidater finnes. Human image approval + draft rewrite gjenstår.

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
| Pro 4MOTION | `pro-4motion` | 554 | 77 / 82 | 299 | 165 | 1800 | needs_review/inactive |
| GTX 4MOTION Exclusive | `gtx-4motion-exclusive` | 524 | 77 / 84 | 340 | 185 | 1800 | needs_review/inactive |

#### Image candidates (pending)

- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/bjarne/16_9_2M3A0972.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-4/exterior/IC0948_ID4_side_rear.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-4/exterior/IC1330_id4_exterior_black-style.jpg
- `interior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-4/mjw26/IC0862_id4-interior_steering-wheel-dashboard-infotainment.jpg

### ID.5 (`volkswagen-id-5`) — **NOT_READY**

- Car id: `78d4d39b-af28-434e-9a26-8a1fc198c550`
- Admin: [/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/rediger](/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/rediger)
- Variants admin: [/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/varianter](/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/varianter)
- Public preview (unpublished): [/modeller/volkswagen-id-5](/modeller/volkswagen-id-5)
- import_status: `needs_review`
- is_published: `false`
- source_name: Volkswagen Norge — Prislister (ID.5 mangler aktuell teknisk PDF)
- source_url: https://www.volkswagen.no/no/kjope-bil/prisliste.html
- data_last_checked_at: 2026-07-26T14:00:00+00:00
- Gallery images: 0
- Image candidates: 1
- Publish blockers (getPublishIssues): image, import_status

**Why NOT_READY:** Ingen aktuell norsk teknisk PDF / aktiv modellside bekreftet. Skall beholdes uten oppfinnede spesifikasjoner.

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
| _(none)_ | | | | | | | |

#### Image candidates (pending)

- `other` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/pc/models/id-5/iqdrive/IC0464_ID5-iq-drive.jpg

### ID.7 (`volkswagen-id-7`) — **READY_FOR_HUMAN_APPROVAL**

- Car id: `2d799eaf-774d-4d1c-9d38-09da217efaaa`
- Admin: [/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/rediger](/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/rediger)
- Variants admin: [/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/varianter](/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/varianter)
- Public preview (unpublished): [/modeller/volkswagen-id-7](/modeller/volkswagen-id-7)
- import_status: `needs_review`
- is_published: `false`
- source_name: Volkswagen Norge — Tekniske data ID.7 (April 2026)
- source_url: https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf
- data_last_checked_at: 2026-07-26T14:00:00+00:00
- Gallery images: 0
- Image candidates: 1
- Publish blockers (getPublishIssues): image, import_status

**Why READY_FOR_HUMAN_APPROVAL:** Pro S Tourer + GTX Fastback/Tourer fra ID.7 PDF, Fastback/Tourer adskilt i notater, dimensjoner/kilder oppdatert, minst én bildekandidat. Human må velge flere vinkler (spesielt Fastback/interiør) før publisering.

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
| Pro S Stasjonsvogn | `pro-s-stasjonsvogn` | 676 | 86 / 91 | 286 | 200 | 1000 | needs_review/inactive |
| GTX Fastback | `gtx-fastback` | 597 | 86 / 91 | 340 | 200 | 1800 | needs_review/inactive |
| GTX Stasjonsvogn | `gtx-stasjonsvogn` | 590 | 86 / 91 | 340 | 200 | 1800 | needs_review/inactive |

#### Image candidates (pending)

- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/cutout/personbil/id7-tourer/id7-tourer.jpg

### ID. Buzz (`volkswagen-id-buzz`) — **READY_FOR_HUMAN_APPROVAL**

- Car id: `52e06fcd-2e61-4cd7-8916-1dcf6b841f88`
- Admin: [/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/rediger](/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/rediger)
- Variants admin: [/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/varianter](/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/varianter)
- Public preview (unpublished): [/modeller/volkswagen-id-buzz](/modeller/volkswagen-id-buzz)
- import_status: `needs_review`
- is_published: `false`
- source_name: Volkswagen Norge — ID. Buzz prisliste/tekniske data
- source_url: https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf
- data_last_checked_at: 2026-07-26T14:00:00+00:00
- Gallery images: 0
- Image candidates: 5
- Publish blockers (getPublishIssues): image, import_status

**Why READY_FOR_HUMAN_APPROVAL:** Pro/GTX kort/lang fra offisielle PDF-er, GTX WLTP/towing/torque fylt fra GTX-PDF, editorial drafts komplette, bildekandidater inkl. cargo. Exclusive-WLTP og sete/cargo-konfigurasjoner fortsatt åpne merknader.

#### Variants

| Variant | Slug | WLTP | Battery net/gross | Power | DC | Towing | Status |
|---------|------|------|-------------------|-------|----|--------|--------|
| Pro Kort | `pro-kort` | 455 | 79 / 84 | 286 | 183 | 1200 | needs_review/inactive |
| Pro Lang | `pro-lang` | 492 | 86 / 91 | 286 | 199 | 1000 | needs_review/inactive |
| GTX Kort | `gtx-kort` | 418 | 79 / 84 | 340 | 183 | 1800 | needs_review/inactive |
| GTX Lang | `gtx-lang` | 465 | 86 / 91 | 340 | 199 | 1600 | needs_review/inactive |

#### Image candidates (pending)

- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC03122.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/bjarne/16_9_DSC02506.jpg
- `exterior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/exterior/1_1_ib000715pic.jpg
- `interior` / `pending`: https://www.volkswagen.no/content/dam/onehub_pkw/importers/no/modeller/id-buzz/interior/1_1_ib000690pic.jpg
- `cargo` / `pending`: https://www.volkswagen.no/content/dam/onehub_master/cv/models/id-buzz/new/equipment-and-packages/ib000363pic-vw-id-buzz-backview-loading-02-4x3.jpg


---

## 3. Status for every variant

See per-model tables above. All variants remain `needs_review` and inactive until human confirmation. Variant-specific powertrain numbers are not averaged onto the car row.

---

## 4. Fields verified

Verified against official VW Norge PDFs / model pages for ready models:

- Identity: brand, model, slug, body/vehicle type
- Per-variant: battery usable/total, WLTP range, power, DC charging, AC where stored, 0–100 / top speed where present
- Shared / car-level: connectors, warranty, chemistry where documented, dimensions where body-shared
- ID.4: towing (with brakes stored; without brakes conflict retained), heat pump, V2L
- ID.7: width/wheelbase/height; Fastback vs Tourer cargo separation notes
- ID. Buzz: Pro towing on variants; GTX towing/torque/WLTP from GTX PDF

---

## 5. Fields changed (this pass)

- variant gtx-kort: towing_kg=1800, torque_nm=560
- variant gtx-lang: towing_kg=1600, torque_nm=560
- variant pro-s-stasjonsvogn: cargo separation note
- variant gtx-fastback: cargo separation note
- variant gtx-stasjonsvogn: cargo separation note
- ID.3 editorial package
- ID.4 editorial package
- ID.7 editorial package
- ID. Buzz editorial package
- ID.5 shell refreshed (NOT_READY)
- image candidates deduped/added (pending only)

Notable numeric fills this pass (official GTX PDF only):

- `gtx-kort`: `towing_kg=1800`, `torque_nm=560` (footnote: 1700 kg on short 7-seater)
- `gtx-lang`: `towing_kg=1600`, `torque_nm=560`

---

## 6. Fields left empty (intentionally)

Common across ready models:

- `price_nok` (from-prices exist on prisliste; not stored as single public price)
- `winter_range_km` / `real_world_range_km`
- `frunk_l` where not documented
- Car-level blended `range_km` / `power_hp` when variants differ
- ID.3 car-level `heat_pump` (variant/equipment dependent)
- ID. Buzz car-level `cargo_l`, `seats`, `heat_pump` (config / optional)
- ID.4 / ID.7 car-level `torque_nm` when PDF lists split axle values
- ID.5: all technical fields

---

## 7. Sources used

1. ID.3 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-3/tekniske_data_id3.pdf
2. ID.4 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-4/tekniske_data_id4.pdf
3. ID.7 tekniske data — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-7/tekniske-data-id7.pdf
4. ID. Buzz Pro — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz.pdf
5. ID. Buzz GTX — https://www.volkswagen.no/idhub/content/dam/onehub_pkw/importers/no/priser-og-brosjyrer/id-buzz/id-buzz-gtx.pdf
6. Model pages — https://www.volkswagen.no/no/alle-bilmodeller/id3.html, https://www.volkswagen.no/no/alle-bilmodeller/id4.html, https://www.volkswagen.no/no/alle-bilmodeller/id7.html, https://www.volkswagen.no/no/alle-bilmodeller/id-buzz.html
7. Prislister (ID.5 shell pointer) — https://www.volkswagen.no/no/kjope-bil/prisliste.html

---

## 8. Conflicts resolved

None silently resolved. Where a single clear variant explanation exists, the value stays on that variant (e.g. GTX non-Exclusive WLTP stored; Exclusive listed in notes only).

---

## 9. Conflicts still open

- **ID.3 length_mm:** 4264 vs 4261 in same PDF (NO table vs DE sketch)
- **ID.3 range messaging:** marketing «inntil 430» vs PDF max 586 — car-level range empty; variants used
- **ID.4 length_mm:** Pro 4584 vs GTX 4582
- **ID.4 towing_kg:** 1800 (braked) stored vs 750 (unbraked) conflict retained
- **ID.4 torque_nm:** 134 / 560 axle split — car torque empty
- **ID.7 cargo_l:** Fastback 532 vs Tourer 605 — car may hold one value; variant notes clarify
- **ID.7 height_mm:** Fastback 1536 vs Tourer 1551
- **ID.7 dc_charging_kw:** 175 (77 kWh) vs 200 (86 kWh) — 86 kWh variants use 200
- **ID. Buzz length / towing:** kort vs lang body-specific
- **ID. Buzz GTX WLTP:** Exclusive vs non-Exclusive; non-Exclusive stored
- **ID. Buzz GTX short towing footnote:** 1800 kg vs 1700 kg on short 7-seater

---

## 10. Editorial text completed

For ID.3, ID.4, ID.7, ID. Buzz:

- short introduction (`description`)
- who for (`suitable_for`)
- strengths (`pros`)
- weaknesses (`cons`)
- winter / charging / long-distance / daily / family (`score_notes` sections)

All public editorial fields still begin with **Draft – Requires editor review.** until a human removes the marker.

ID.5 has a shell explanation only.

---

## 11. Image candidates

Candidates are stored in `research_image_candidates` with `status=pending` only.

Required categories for publication quality:

| Model | front | rear/side | interior | cargo | Notes |
|-------|-------|-----------|----------|-------|-------|
| ID.3 | candidate | side/exterior candidates | candidate | missing dedicated | Human must pick set |
| ID.4 | exterior | rear/side candidate | candidate | missing dedicated | Human must pick set |
| ID.7 | Tourer cutout only | thin | missing | missing | **Needs manual media hunt** |
| ID. Buzz | exterior | exterior | interior | cargo candidate | Best coverage |
| ID.5 | weak/other only | — | — | — | NOT_READY |

**CDN note:** Automated HTTP checks against some DAM URLs returned `410` from this environment. Treat candidates as pending until a human opens them in-browser / downloads from VW media and confirms the file.

---

## 12. Image-rights concerns

- All candidates claim official Volkswagen DAM / volkswagen.no origin.
- Usage rights must be verified by a human before attach.
- No Google Images, screenshots, or page URLs used as image files.
- No candidate was attached to `car_images` or approved by this pass.

---

## 13. Human actions still required

1. Open each READY model in Car Editor and walk PRODUCTION_CHECKLIST.
2. Rewrite editorial text; remove draft markers.
3. Resolve or accept documented conflicts with explicit editor decision.
4. Activate/confirm default variants.
5. Download/verify image files; attach front/rear/side/interior/(cargo); write alt text; approve gallery.
6. Set `import_status = approved` only after checklist pass.
7. Publish manually only after approval + images — never automatic.
8. Keep ID.5 unpublished until NO tech PDF exists.
9. Do not start a new brand until VW human approval is done (optional process gate).

---

## 14. Publication-readiness checklist

| Check | ID.3 | ID.4 | ID.5 | ID.7 | ID. Buzz |
|-------|------|------|------|------|----------|
| Official source | Pass | Pass | Fail | Pass | Pass |
| Images (approved gallery) | Fail | Fail | Fail | Fail | Fail |
| Images (candidates exist) | Pass | Pass | Fail* | Pass (thin) | Pass |
| Variants | Pass | Pass | Fail | Pass | Pass |
| Specifications | Pass | Pass | Fail | Pass | Pass |
| Editorial drafts | Pass (draft) | Pass (draft) | Fail | Pass (draft) | Pass (draft) |
| Review (human) | Not performed | Not performed | Not performed | Not performed | Not performed |
| Approval | Not performed | Not performed | Not performed | Not performed | Not performed |
| Publication | Not performed | Not performed | Not performed | Not performed | Not performed |

\* ID.5 may have a weak non-technical media candidate from an earlier pass; it does not unlock readiness.

---

## 15. Exact admin URLs for final review

- ID.3: [/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/rediger](/admin/biler/531fa6cc-a163-4b9d-963e-814bff2bffba/rediger)
- ID.4: [/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/rediger](/admin/biler/c8c17bab-7248-46f9-8cc9-e7ed36a42706/rediger)
- ID.5: [/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/rediger](/admin/biler/78d4d39b-af28-434e-9a26-8a1fc198c550/rediger)
- ID.7: [/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/rediger](/admin/biler/2d799eaf-774d-4d1c-9d38-09da217efaaa/rediger)
- ID. Buzz: [/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/rediger](/admin/biler/52e06fcd-2e61-4cd7-8916-1dcf6b841f88/rediger)
- Import / research: [/admin/import](/admin/import) · [/admin/import/research](/admin/import/research)

---

## 16. Final status

| Model | Completion | Specs | Editorial | Images | Conflicts | Final status |
|-------|------------|-------|-----------|--------|-----------|--------------|
| ID.3 | high | sourced / variant-split | draft complete | 5 candidates / 0 gallery | documented open | **READY_FOR_HUMAN_APPROVAL** |
| ID.4 | high | sourced / variant-split | draft complete | 4 candidates / 0 gallery | documented open | **READY_FOR_HUMAN_APPROVAL** |
| ID.5 | shell | empty shell | shell draft | 1 candidates / 0 gallery | n/a | **NOT_READY** |
| ID.7 | high | sourced / variant-split | draft complete | 1 candidates / 0 gallery | documented open | **READY_FOR_HUMAN_APPROVAL** |
| ID. Buzz | high | sourced / variant-split | draft complete | 5 candidates / 0 gallery | documented open | **READY_FOR_HUMAN_APPROVAL** |

---

## Safety confirmation

- No model published (`is_published=false` enforced)
- No automatic approval (`import_status=needs_review` enforced)
- No image auto-approval
- Tesla records not modified by this script
