# EVFAKTA Production Checklist

**Status:** Required gate for every brand batch before publication  
**Audience:** Editors, researchers, and reviewers  
**Scope:** Brand production batches (e.g. Tesla batch 01, Volkswagen batch 01) and each model in the batch  
**Related docs:** `docs/REFERENCE_WORKFLOW.md`, `docs/CAR_BLUEPRINT.md`, `docs/EVFAKTA_MASTER_CATALOG.md`, `docs/RESEARCH_PIPELINE.md`

---

## Purpose

Every brand batch must pass this checklist before any car in the batch is published.

Use it model-by-model, then confirm the **batch gate** at the end.

**Hard rules (always)**

1. Never invent specifications. Prefer empty over guessed.
2. Prefer official Norwegian manufacturer sources (pages, PDFs, CoC / manuals).
3. Never auto-publish. Research and import stay `needs_review` until human approval.
4. Approval ≠ publish.
5. Do not silently resolve conflicts.
6. Do not treat page URLs as approved gallery images.
7. Do not redesign the CMS while producing content.

---

## How to use

For each model in the batch:

1. Work top to bottom through the sections below.
2. Mark each item **Pass** / **Fail** / **N/A** (N/A only when the OEM truly does not publish that fact for Norway).
3. Failures block publication for that model.
4. When every model passes (or is explicitly deferred out of the publish set), complete the batch gate.

Recommended batch report fields: models processed, variants, populated fields, missing fields, conflicts, image candidates, completion %, readiness.

---

## 1. Official source

| # | Check | Pass criteria |
|---|--------|----------------|
| 1.1 | Primary source identified | Manufacturer Norway page and/or official tech PDF / manual named on the car |
| 1.2 | `source_name` set | Human-readable official source name |
| 1.3 | `source_url` set | Direct URL to the official source used |
| 1.4 | `data_last_checked_at` set | Timestamp of the latest human verification |
| 1.5 | Field provenance | Every populated field has `field_sources` (or equivalent) with source name, URL, last checked, and confidence |
| 1.6 | Secondary sources | Aggregators / press may inform research only; they are not sole evidence for published specs |
| 1.7 | Market match | Values apply to the Norwegian / European configuration sold here — not a foreign trim mixed in silently |
| 1.8 | Source freshness | Editor confirmed the PDF/page edition is current enough for this publish decision |

**Block if:** any filled technical field lacks official provenance, or the primary Norway source is missing without a documented manual handoff.

---

## 2. Images

| # | Check | Pass criteria |
|---|--------|----------------|
| 2.1 | Official candidates only | Candidates come from manufacturer media / official site assets |
| 2.2 | Not auto-attached | Research image candidates were never auto-written into `car_images` |
| 2.3 | Not auto-approved | No candidate marked approved without editor action |
| 2.4 | Rights / usage | Editor verified usage terms before attaching |
| 2.5 | Gallery ready | At least one usable primary image attached for publish (gallery and/or approved `image_url`) |
| 2.6 | Alt text | Primary image has clear alt text |
| 2.7 | Page URLs rejected | HTML model-page URLs are not used as image files |

**Block if:** publishing with zero approved images, or with unverified / non-official media.

---

## 3. Variants

| # | Check | Pass criteria |
|---|--------|----------------|
| 3.1 | Official trims only | Variants exist only when documented by the manufacturer |
| 3.2 | Naming | Variant `name` / `slug` match official trim naming (normalized for catalog use) |
| 3.3 | Default variant | Exactly one sensible default when multiple variants exist |
| 3.4 | Variant-specific numbers | Battery, WLTP, power, DC rate, etc. live on the correct variant — not averaged onto the car row |
| 3.5 | Inactive until confirmed | Variants stay `needs_review` (and inactive if that is batch policy) until editor confirms |
| 3.6 | No invented trims | Marketing nicknames or secondary-site trim lists are not created as variants |
| 3.7 | Shell models | If the OEM has no current Norway tech sheet, the model may remain a shell with **zero** invented variants |

**Block if:** multi-trim cars publish with a single blended powertrain value, or with undocumented variants.

---

## 4. Specifications

| # | Check | Pass criteria |
|---|--------|----------------|
| 4.1 | No guessing | Empty fields remain empty when the OEM does not publish a clear value |
| 4.2 | Core identity | Brand, model, slug, vehicle type / body style correct |
| 4.3 | Battery / range / charging | Verified per variant or documented missing with reason |
| 4.4 | Performance | Power, torque, 0–100, top speed only when officially documented |
| 4.5 | Dimensions / practical | Length/width/height/wheelbase, seats, cargo, towing only from official sources |
| 4.6 | Split official values | If the OEM lists two valid values (e.g. towing with/without brakes, torque per axle), do not force one number — leave empty or document conflict |
| 4.7 | Conflicts resolved or parked | All conflicts either resolved with a sourced winner or left empty with a clear note |
| 4.8 | Winter range | Never invent `winter_range_km`; omit unless officially or EVFAKTA-tested with source |
| 4.9 | Prices | Only store prices from official price lists when the editor intends a specific figure; “from” prices need explicit editorial policy |
| 4.10 | Scores | Public scores only after editorial scoring discipline; display policy may still hide them |

**Block if:** any published number cannot be traced to an official source checked on this pass.

---

## 5. Editorial

| # | Check | Pass criteria |
|---|--------|----------------|
| 5.1 | Blueprint structure | Copy follows `docs/CAR_BLUEPRINT.md` intent (intro, who for, strengths, weaknesses, winter, charging, daily use) |
| 5.2 | Short introduction | `description` rewritten by an editor — not left as raw assistant draft |
| 5.3 | Who the car is for | `suitable_for` curated and accurate |
| 5.4 | Strengths / weaknesses | `pros` / `cons` factual, not marketing fluff |
| 5.5 | Winter / charging / daily | Covered in approved editorial notes (or dedicated fields when available) without invented km claims |
| 5.6 | Draft marker removed | **Draft – Requires editor review.** removed from all fields intended for publish |
| 5.7 | No overclaim | Editorial text does not assert missing specs, unverified winter range, or unconfirmed prices |
| 5.8 | Norwegian clarity | Readable, restrained Norwegian suitable for EVFAKTA.no |

**Block if:** draft markers remain, or editorial claims exceed verified facts.

---

## 6. Review

| # | Check | Pass criteria |
|---|--------|----------------|
| 6.1 | Status | Car is still `needs_review` or has completed review with a recorded decision path |
| 6.2 | Research workspace | Pending research fields for this model are approved, rejected, or marked unavailable |
| 6.3 | Field review | Low-confidence fields inspected; confidence acceptable for publish or field cleared |
| 6.4 | Missing-data list | Remaining gaps listed with reason (blocked OEM page, not published, multi-value conflict, etc.) |
| 6.5 | Batch report | Brand batch doc updated (models, variants, populated/missing, conflicts, images, completion %, readiness) |
| 6.6 | Cross-check | Spot-check at least one headline number per variant against the official PDF/page |
| 6.7 | CMS unchanged | No feature work mixed into the content pass |

**Block if:** review queue still has unresolved conflicts on fields that would appear on the public page.

---

## 7. Approval

| # | Check | Pass criteria |
|---|--------|----------------|
| 7.1 | Human approval | An editor explicitly sets import/review status to **approved** (or equivalent) |
| 7.2 | Approval ≠ publish | Approving must not flip `is_published` by itself |
| 7.3 | Variants approved | Default (and any public) variants approved or confirmed active intentionally |
| 7.4 | Images approved | Primary image approved in gallery workflow |
| 7.5 | Editorial approved | Description, pros, cons, suitable_for signed off |
| 7.6 | Provenance intact | Approval did not strip `source_*` / `field_sources` / last-checked metadata |

**Block if:** “approved” without source + image + editorial sign-off.

---

## 8. Publication

| # | Check | Pass criteria |
|---|--------|----------------|
| 8.1 | Final gate | Sections 1–7 all Pass (or documented N/A) for this model |
| 8.2 | Publish action | Editor sets `is_published = true` deliberately |
| 8.3 | Public page check | `/modeller/[slug]` shows correct identity, specs, gallery, and editorial — no draft markers |
| 8.4 | Variant selector | Public variant switching shows the right numbers |
| 8.5 | Empty fields hidden | UI omits empty optional rows; no placeholder fiction |
| 8.6 | Display policy | Prices/scores respect `PUBLIC_SHOW_PRICES` / `PUBLIC_SHOW_SCORES` (and editorial intent) |
| 8.7 | Rollback ready | Editor knows how to unpublish immediately if an error is found |
| 8.8 | Batch note | Batch report records which models were published and when |

**Block if:** any prior section failed. Do not publish “almost ready” cars to fill the catalog.

---

## Batch gate (all models)

Before closing a brand batch as production-complete:

| # | Check | Pass criteria |
|---|--------|----------------|
| B.1 | Inventory | Every intended model listed with slug + car id |
| B.2 | Deferred models | Shells / blocked models (e.g. missing OEM PDF) explicitly deferred — not silently published |
| B.3 | Uniform status | No accidental `is_published=true` from import/research |
| B.4 | Report filed | Batch markdown report exists under `docs/` with conflicts and image candidates |
| B.5 | Checklist signed | Editor names + date recorded for the batch (in the batch report or CMS notes) |

---

## Quick reject patterns

Fail the model immediately if any of these are true:

- Spec filled from memory, forum, or aggregator only  
- Conflict auto-picked without editor choice  
- Image candidate attached/approved automatically  
- Draft marker still visible in public-facing fields  
- Variant WLTP/battery guessed to “complete” the sheet  
- `is_published=true` before approval and image sign-off  

---

## Sign-off template

Copy into the brand batch report when ready:

```text
Brand batch: ____________________
Editor: ____________________
Date: ____________________

Official source:  [ ] Pass
Images:           [ ] Pass
Variants:         [ ] Pass
Specifications:   [ ] Pass
Editorial:        [ ] Pass
Review:           [ ] Pass
Approval:         [ ] Pass
Publication:      [ ] Pass (only for models in the publish set)

Models published: ____________________
Models deferred:  ____________________
Notes: ____________________
```
