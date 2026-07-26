# Tesla + Volkswagen batch readiness

**Checked:** 2026-07-26T12:00:00.000Z
**Standards:** `CAR_BLUEPRINT.md`, `REFERENCE_WORKFLOW.md`, `PRODUCTION_CHECKLIST.md`
**Rule:** Never invent specs. Never auto-publish. Approval ≠ publish.

## Status board

| Brand | Model | Slug | Status | Variants | Image candidates | Gallery | Published |
|-------|-------|------|--------|----------|------------------|---------|-----------|
| Tesla | Model 3 | `tesla-model-3` | **READY_FOR_APPROVAL** | 4 | 5 | 0 | false |
| Tesla | Model Y | `tesla-model-y` | **NOT_READY** | 3 | 0 | 0 | false |
| Tesla | Model S | `tesla-model-s` | **NOT_READY** | 2 | 0 | 0 | false |
| Tesla | Model X | `tesla-model-x` | **NOT_READY** | 2 | 0 | 0 | false |
| Volkswagen | ID.3 | `volkswagen-id-3` | **READY_FOR_APPROVAL** | 4 | 4 | 0 | false |
| Volkswagen | ID.4 | `volkswagen-id-4` | **READY_FOR_APPROVAL** | 2 | 3 | 0 | false |
| Volkswagen | ID.5 | `volkswagen-id-5` | **NOT_READY** | 0 | 1 | 0 | false |
| Volkswagen | ID.7 | `volkswagen-id-7` | **READY_FOR_APPROVAL** | 3 | 1 | 0 | false |
| Volkswagen | ID. Buzz | `volkswagen-id-buzz` | **READY_FOR_APPROVAL** | 4 | 4 | 0 | false |

## Counts

- READY_FOR_APPROVAL: 5
- NOT_READY: 4

## Per model

### Tesla Model 3 — **READY_FOR_APPROVAL**

- Car id: `cd2df65a-f868-4385-9c73-f79356f295ae`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Official EU Owner's Manual dimensions/cargo/frunk/warranty/connectors are sourced with field_sources.
- Four official trim shells exist; powertrain numbers left empty because Tesla Norge live fetch is blocked — documented, not invented.
- Image candidates already stored (pending) — none auto-attached.
- Editorial drafts improved and marked Draft – Requires editor review.
- Still unpublished / needs_review. Editor must attach image + rewrite drafts + confirm variant energy figures before publish.

#### Missing

- variant range_km / battery_* / power_hp / dc_charging_kw (Tesla Norge blocked)
- winter_range_km
- towing_kg as single value (750/1000 conflict)
- approved gallery image
- draft markers still present (expected until human edit)

#### Improved this pass

- editorial description/pros/cons/suitable_for/score_notes
- source last-checked

### Tesla Model Y — **NOT_READY**

- Car id: `63bebccc-d9bb-4106-a316-cc7625659c20`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Was published with unsourced range_km/dc_charging_kw — unpublished and cleared.
- Tesla Norge live page blocked (403); EU Owner's Manual dimensions not verified in this pass.
- No official image candidates stored (Tesla media fetch blocked).
- Variant shells created empty — no inventing of WLTP/battery.

#### Missing

- all technical specs
- field provenance for specs
- official image candidates
- gallery
- verified EU manual dimensions/cargo

#### Improved this pass

- is_published=false
- import_status=needs_review
- cleared unsourced specs
- 3 variant shells
- editorial draft shell

### Tesla Model S — **NOT_READY**

- Car id: `18fed552-c460-40e0-8d02-8554df0eb22c`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Empty production shell only — no official specs verified this pass.
- Tesla Norge live research blocked historically; no inventing.
- No image candidates.

#### Missing

- all technical specs
- image candidates
- editorial substance beyond draft shell

#### Improved this pass

- created/updated unpublished shell
- variant shells
- draft editorial markers

### Tesla Model X — **NOT_READY**

- Car id: `fcac1784-db43-421c-9218-62bbf854f133`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Empty production shell only — no official specs verified this pass.
- Tesla Norge live research blocked historically; no inventing.
- No image candidates.

#### Missing

- all technical specs
- image candidates
- editorial substance beyond draft shell

#### Improved this pass

- created/updated unpublished shell
- variant shells
- draft editorial markers

### Volkswagen ID.3 — **READY_FOR_APPROVAL**

- Car id: `531fa6cc-a163-4b9d-963e-814bff2bffba`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Official VW Norge tekniske-data PDF fully mapped to variants.
- Shared dimensions sourced; conflicts documented (length 4264 vs 4261; marketing 430 vs PDF max 586).
- Image candidates present; none attached/approved.
- Editorial drafts present with draft marker.

#### Missing

- approved gallery
- price_nok
- winter_range_km
- heat_pump on car row (variant-dependent)
- human rewrite of draft markers

#### Improved this pass

- extra image candidates
- re-verified unpublished

### Volkswagen ID.4 — **READY_FOR_APPROVAL**

- Car id: `c8c17bab-7248-46f9-8cc9-e7ed36a42706`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Official ID.4 PDF (Mai 2026) for Pro 4MOTION + GTX 4MOTION.
- Towing 1800 kg (with brakes) stored; 750 kg conflict documented.
- Image candidates present.
- Editorial drafts present.

#### Missing

- approved gallery
- torque_nm (134/560 split)
- winter_range_km
- human draft rewrite

#### Improved this pass

- extra image candidates
- re-verified unpublished

### Volkswagen ID.5 — **NOT_READY**

- Car id: `78d4d39b-af28-434e-9a26-8a1fc198c550`
- import_status: `needs_review`
- is_published: `false`

#### Why

- No current ID.5 tekniske-data PDF / model page on volkswagen.no (redirects).
- Only warranty text + weak media candidate — not enough for approval.

#### Missing

- all technical specs
- variants
- usable primary exterior candidate
- NO tech PDF

#### Improved this pass

- media candidate (non-primary)

### Volkswagen ID.7 — **READY_FOR_APPROVAL**

- Car id: `2d799eaf-774d-4d1c-9d38-09da217efaaa`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Official ID.7 PDF variants populated.
- Width/wheelbase/height filled from PDF this pass; height Fastback/Tourer conflict documented.
- Official Tourer cutout image candidate added.
- Editorial drafts present.

#### Missing

- approved gallery
- Pro without S / 77 kWh full column
- GTX torque as single value
- human draft rewrite

#### Improved this pass

- width_mm
- height_mm
- wheelbase_mm
- image candidate

### Volkswagen ID. Buzz — **READY_FOR_APPROVAL**

- Car id: `52e06fcd-2e61-4cd7-8916-1dcf6b841f88`
- import_status: `needs_review`
- is_published: `false`

#### Why

- Pro + GTX variants from official Pro/GTX PDFs.
- GTX WLTP filled this pass (418 / 465 km non-Exclusive).
- Additional official exterior/interior candidates stored.
- Editorial drafts present.

#### Missing

- approved gallery
- single cargo_l / seats (config-dependent)
- Exclusive vs non-Exclusive range conflict on GTX
- human draft rewrite

#### Improved this pass

- GTX range_km 418/465
- extra image candidates

## Production checklist gate

| Section | Tesla Model 3 | Other Tesla | VW ID.3/4/7/Buzz | VW ID.5 |
|---------|---------------|-------------|------------------|---------|
| Official source | Pass (EU manual + NO pointer) | Fail / pending NO | Pass (NO PDF) | Fail (no tech PDF) |
| Images | Candidates only | Missing | Candidates only | Weak candidate |
| Variants | Shells OK; energy empty | Shells empty | Pass | None |
| Specifications | Partial (dims yes / energy no) | Empty | Pass (variant-level) | Empty |
| Editorial | Drafts present | Shell drafts | Drafts present | Shell drafts |
| Review | Ready for human | Blocked | Ready for human | Blocked |
| Approval | Awaiting editor | No | Awaiting editor | No |
| Publication | Blocked | Blocked | Blocked | Blocked |

## Batch gate

- No model was published by this pass.
- Model Y was force-unpublished (had been published with unsourced specs).
- Next human actions: attach/approve images, rewrite draft markers, confirm Tesla energy figures on Tesla Norge, then approve — still do not auto-publish.

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
| Tesla Model 3 | Hold for Review | Reference workflow package is strong; variant energy figures still need Tesla Norge confirmation. |
| Tesla Model Y | Await Official Documentation | Official Norwegian specifications incomplete after unsourced-data rollback. |
| Tesla Model S | Not Ready | Large parts of the specification are unavailable; keep out of the publication pipeline. |
| Tesla Model X | Not Ready | Large parts of the specification are unavailable; keep out of the publication pipeline. |
| Volkswagen ID.3 | Publish Candidate | Complete Norwegian technical PDF mapping, editorial draft, and image candidates. |
| Volkswagen ID.4 | Publish Candidate | Complete official documentation; open conflicts are documented for editor judgement. |
| Volkswagen ID.5 | Await Official Documentation | No current Norwegian technical PDF or active model page. |
| Volkswagen ID.7 | Hold for Review | Technical data is essentially complete; additional image review is needed. |
| Volkswagen ID. Buzz | Publish Candidate | Official Pro/GTX documentation and editorial draft ready for manual approval. |

