# EVFAKTA Car Blueprint

**Status:** Editorial and technical standard  
**Audience:** Editors, researchers, and engineers  
**Scope:** Every public car page (`/modeller/[slug]`) and the data that must back it  
**Related docs:** `docs/REFERENCE_WORKFLOW.md` (how to produce a car), `docs/EV_DATA_MODEL.md`, `docs/EVFAKTA_MASTER_CATALOG.md`, `docs/RESEARCH_PIPELINE.md`

**Note:** This file is the **editorial and technical standard** for every car page. Production process lives in `REFERENCE_WORKFLOW.md`. Tesla Model 3 is a validated workflow example only — not a permanent content template.

---

## Purpose

This blueprint defines the **complete structure every EVFAKTA car page must follow**.

It is both:

1. **Editorial standard** — what readers must see, and in what order.
2. **Technical standard** — which database columns, editorial copy, and research inputs feed each section.

Pages may hide empty optional blocks, but they must not invent specs, reorder core sections arbitrarily, or publish without source + last-checked discipline.

---

## Field origin legend

| Origin | Meaning |
|--------|---------|
| **Database** | Stored on `cars`, `car_variants`, `car_images`, or `brands`. Structured, comparable, publish-gated where noted. |
| **Editorial** | Written or curated by EVFAKTA editors. May be assisted by drafts, but must be human-approved before publish. |
| **Research** | Proposed or filled via research/import pipeline into DB fields + `field_sources` provenance. Never auto-published. |
| **Optional** | Improves quality; may be omitted on the page when empty. Absence must not invent a value. |

Many fields are **database + research-capable**: research may propose them; editors approve; the live page reads the approved DB value.

**Rules that always apply**

- Research never auto-publishes a car.
- Approval ≠ publish.
- Do not invent numbers. Prefer empty over guessed.
- Variant-specific numbers should come from `car_variants` when variants exist; otherwise from the car row.
- Public price/score visibility may be gated by display policy; the blueprint still defines the fields.

---

## Page section order (canonical)

1. Hero  
2. Overview  
3. Technical Specifications  
4. Charging  
5. Practical Use  
6. Interior  
7. Pros  
8. Cons  
9. EVFAKTA Editorial Notes  
10. Sources  
11. Last checked  
12. Related Cars  
13. Compare CTA  

---

## 1. Hero

**Purpose:** Instant identity + scannable facts. First viewport should answer “which car?” and “what are the headline numbers?”

### Content

| Element | Required | Notes |
|---------|----------|--------|
| Brand | Yes | Display name |
| Model | Yes | Display name |
| Variant | Strongly preferred | Selector when multiple variants exist; otherwise single `variant` / `trim_level` |
| Gallery | Yes for publish | At least one usable image (gallery and/or `image_url`) |
| Quick facts | Yes | Compact fact strip |

### Recommended quick facts

| Fact | Primary field(s) |
|------|------------------|
| Price from (when public) | `price_nok` (variant-aware) |
| WLTP range | `range_km` |
| Battery | `battery_usable_kwh` → fallback `battery_total_kwh` → `battery_kwh` |
| DC charging | `dc_charging_kw` |
| AC charging | `ac_charging_kw` |
| Drivetrain | `drivetrain` |

### Field origins

| Field / asset | Database | Editorial | Research | Optional |
|---------------|----------|-----------|----------|----------|
| `brand` / `brand_id` | Yes | Brand naming curation | May propose brand link | No |
| `model` | Yes | Naming curation | May propose | No |
| `variant`, `trim_level`, `model_generation` | Yes (`cars` and/or `car_variants`) | Naming curation | Often research | Variant string optional if variants table covers it |
| `year` | Yes | — | Often research | Optional |
| Gallery (`car_images.*`, `image_url`) | Yes | Image selection, alt, primary flag | Image candidates only (suggest, not publish) | Extra angles optional; primary required for publish |
| Quick facts listed above | Yes | — | Primary fill path | Individual facts may be empty until verified |
| Favorite / compare entry points | UI only | — | — | Optional UX |

---

## 2. Overview

**Purpose:** Short, trustworthy introduction. Not a sales brochure.

### Content

| Block | Length / shape | Required |
|-------|----------------|----------|
| Short introduction | 2–3 paragraphs | Yes for publish (`description` minimum; longer overview may grow later) |
| Who the car is for | Bullet list or short prose from `suitable_for` | Strongly preferred |
| Key strengths | Derived from pros / editorial emphasis | Preferred |

### Field origins

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `description` | Yes | **Primary ownership** — editors write/approve | May draft; mark draft / require review | No (publish blocker when empty) |
| `suitable_for` (`text[]`) | Yes | **Primary ownership** | May suggest audience tags | Optional but recommended |
| Key strengths (presentation) | May surface `pros` | Editors choose emphasis / ordering | Research must not invent strengths | Optional presentation layer |
| `vehicle_type`, `body_style` | Yes | Taxonomy curation | Often research | Optional helpers for “who it’s for” |

**Editorial guidance**

- Paragraph 1: what the model is (segment, generation, market positioning in Norway).  
- Paragraph 2: how it drives / charges / fits real Norwegian use (facts only).  
- Paragraph 3: caveats or “best for” without marketing fluff.  
- Never claim unverified winter range, towing, or price.

---

## 3. Technical Specifications

**Purpose:** Complete structured spec sheet. Comparable across models.

Present as grouped tables/lists. Omit empty optional rows; never show placeholder fiction.

### 3.1 Battery

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `battery_total_kwh` | Yes | — | Preferred research target | Prefer over legacy alone |
| `battery_usable_kwh` | Yes | — | Preferred research target | Prefer over legacy alone |
| `battery_kwh` | Yes (legacy) | — | Fallback | Optional if total/usable present |
| `battery_chemistry` | Yes | — | Research | Optional |

### 3.2 Range

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `range_km` (WLTP) | Yes | — | Core research | Required for strong catalog quality |
| `winter_range_km` | Yes | May qualify source in notes | Research / tested claims only | Optional |
| `real_world_range_km` | Yes | Editorial judgment if EVFAKTA-tested | Research only with clear source | Optional |

### 3.3 Consumption

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `consumption_kwh_100km` | Yes | — | Research | Optional but recommended |

### 3.4 Charging (summary in tech sheet)

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `ac_charging_kw` | Yes | — | Research | Recommended |
| `dc_charging_kw` | Yes | — | Research | Recommended |
| `charge_time_10_80_minutes` | Yes | — | Research | Optional |
| `charging_connector_ac` | Yes | — | Research | Optional |
| `charging_connector_dc` | Yes | — | Research | Optional |

*(Full charging narrative lives in section 4.)*

### 3.5 Performance

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `drivetrain` | Yes | Taxonomy labels | Research | Recommended |
| `power_hp` | Yes | — | Research | Optional |
| `torque_nm` | Yes | — | Research | Optional |
| `acceleration_0_100` | Yes | — | Research | Optional |
| `top_speed_kmh` | Yes | — | Research | Optional |

### 3.6 Dimensions

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `length_mm` | Yes | — | Research | Optional |
| `width_mm` | Yes | — | Research | Optional |
| `height_mm` | Yes | — | Research | Optional |
| `wheelbase_mm` | Yes | — | Research | Optional |
| `curb_weight_kg` | Yes | — | Research | Optional |
| `gross_weight_kg` | Yes | — | Research | Optional |

### 3.7 Practical

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `seats` | Yes | — | Research | Recommended |
| `cargo_l` | Yes | — | Research | Recommended |
| `frunk_l` | Yes | — | Research | Optional |
| `towing_kg` | Yes | — | Research | Optional |
| `heat_pump` | Yes | — | Research | Optional |
| `v2l` / `v2g` | Yes | — | Research | Optional |

### 3.8 Warranty

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `warranty` | Yes (free text) | Editors normalize wording for Norway | Research may propose raw string | Optional |

### Variant rule

When `car_variants` rows exist, hero + tech numbers shown for the selected variant must reflect variant overrides (price, range, battery, charging, drivetrain, etc.). The car row remains the fallback / default shell.

---

## 4. Charging

**Purpose:** Dedicated charging section for scanners who care about real-world charging first.

### Content blocks

| Block | Fields |
|-------|--------|
| AC | `ac_charging_kw`, `charging_connector_ac` |
| DC | `dc_charging_kw`, `charging_connector_dc` |
| Charge time | `charge_time_10_80_minutes` (state window must be labeled 10–80% unless source says otherwise) |
| Connectors | AC + DC connector fields; note NACS/CCS carefully by market |

### Field origins

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `ac_charging_kw` | Yes | — | Research | Recommended |
| `dc_charging_kw` | Yes | — | Research | Recommended |
| `charge_time_10_80_minutes` | Yes | Clarify conditions in editorial notes if needed | Research | Optional |
| `charging_connector_ac` | Yes | Normalize labels (e.g. Type 2) | Research | Optional |
| `charging_connector_dc` | Yes | Normalize labels (e.g. CCS2) | Research | Optional |
| Charging explainer prose | — | **Editorial** (short, factual) | Draft only | Optional |

---

## 5. Practical Use

**Purpose:** Help Norwegian buyers map the car to life situations. Prefer facts + restrained editorial judgment.

### Content blocks

| Theme | Supporting fields / content |
|-------|-----------------------------|
| Family | `seats`, `cargo_l`, `suitable_for`, towing if relevant |
| Winter | `heat_pump`, `winter_range_km`, winter-related editorial notes |
| Long trips | `range_km`, DC charging, charge time, consumption |
| City driving | size/dimensions, AC charging, suitable_for tags |

### Field origins

| Element | Database | Editorial | Research | Optional |
|---------|----------|-----------|----------|----------|
| Spec anchors (`seats`, `cargo_l`, `heat_pump`, ranges, charging) | Yes | — | Research | Theme blocks optional if thin |
| `suitable_for` | Yes | **Editorial curation** | May suggest | Optional |
| Practical-use prose (family / winter / trips / city) | Future long-form or current `description` + notes | **Editorial** | Draft assist only | Optional until dedicated fields exist |
| `score_notes` / winter score context | Yes (scores/notes) | Editorial scoring discipline | — | Optional; scores may be hidden publicly |

**Hard rule:** Do not invent winter range. If unknown, say so or omit the winter claim.

---

## 6. Interior

**Purpose:** Space, seats, cargo, and cabin tech at a glance.

### Content blocks

| Block | Fields |
|-------|--------|
| Space | Dimensions + wheelbase; space score only if published |
| Seats | `seats` |
| Cargo | `cargo_l`, `frunk_l`, `towing_kg` |
| Infotainment | `apple_carplay`, `android_auto`, `head_up_display`, `panoramic_roof`, `ota_updates` |

### Field origins

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `seats` | Yes | — | Research | Recommended |
| `cargo_l` | Yes | — | Research | Recommended |
| `frunk_l` | Yes | — | Research | Optional |
| `towing_kg` | Yes | — | Research | Optional |
| `apple_carplay`, `android_auto` | Yes | — | Research | Optional |
| `head_up_display`, `panoramic_roof`, `ota_updates` | Yes | — | Research | Optional |
| Interior commentary | — | **Editorial** | Draft only | Optional |
| `space_score`, `comfort_score` | Yes | **Editorial scores** (manual) | Never auto-generate | Optional / display-policy gated |

---

## 7. Pros

**Purpose:** Honest advantages, grounded in verified facts.

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `pros` (`text[]`) | Yes | **Primary ownership** | May suggest bullets; require editor approval | Optional but recommended |

**Editorial guidance**

- Prefer 3–6 bullets.  
- Each pro should be checkable against specs or sourced experience.  
- No superlatives without evidence (“best in class”) unless EVFAKTA has compared it.

---

## 8. Cons

**Purpose:** Equally honest limitations.

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `cons` (`text[]`) | Yes | **Primary ownership** | May suggest; require editor approval | Optional but recommended |

**Editorial guidance**

- Balance with pros; do not soft-pedal known limits (no heat pump, slow AC, small frunk, etc.).  
- Distinguish “missing data” from “known weakness.”

---

## 9. EVFAKTA Editorial Notes

**Purpose:** EVFAKTA’s own judgment layer — transparent, separate from manufacturer copy.

### Content

| Element | Fields |
|---------|--------|
| Score card (when enabled) | `overall_score`, `range_score`, `charging_score`, `winter_score`, `comfort_score`, `space_score`, `value_score`, `reliability_score` |
| Methodology | `score_methodology` (public) |
| Internal / editor notes | `score_notes`, `import_notes` (import_notes generally **not** public) |
| Field-level review state | `field_sources.*.review_status`, `draft`, `notes`, `confidence` |

### Field origins

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| Score columns (`*_score`) | Yes | **Editors only** — manual 0–10 | Must not auto-generate | Optional; public display may be gated |
| `score_methodology` | Yes | **Editorial** | — | Optional; required if scores shown publicly |
| `score_notes` | Yes | **Editorial** (usually internal) | — | Optional |
| `import_notes` | Yes | Ops / editorial workflow | Research pipeline may append | Optional; keep internal |
| Assisted drafts in `field_sources` | Yes (provenance JSON) | Editors approve/reject/edit | Research writes provenance | Optional per field |

**Hard rule:** Scores are never invented by research automation.

---

## 10. Sources

**Purpose:** Trust. Every published car must show where facts came from.

### Content

| Element | Fields |
|---------|--------|
| Primary source name | `source_name` |
| Primary source URL | `source_url` |
| Source updated timestamp | `source_updated_at` |
| Per-field provenance | `field_sources` (name, URL, confidence, retrieved_at, research_job_id, review_status) |

### Field origins

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `source_name` | Yes | Editors may normalize | Research often fills | Required for publish (name **or** URL) |
| `source_url` | Yes | Editors verify | Research often fills | Required for publish (name **or** URL) |
| `source_updated_at` | Yes | Editors may set | Research may set | Optional |
| `field_sources` | Yes | Approve/reject/edit | Written by research/import | Optional enrichment; strongly recommended for assisted fills |

**Editorial guidance**

- Prefer official Norwegian manufacturer / importer pages when available.  
- Conflicting sources → leave conflict for manual review; do not auto-pick.

---

## 11. Last checked

**Purpose:** Freshness signal for readers and editors.

| Field | Database | Editorial | Research | Optional |
|-------|----------|-----------|----------|----------|
| `data_last_checked_at` | Yes | Editors update on review | Research may propose `retrieved_at` / checked time | **Required for publish** |
| `updated_at` / `imported_at` | Yes (system) | — | Import/research jobs | System metadata; may be shown as secondary |
| Per-field `field_sources.*.data_last_checked_at` / `retrieved_at` | Yes | Editors | Research | Optional detail |

Display copy should distinguish **last checked** (editorial verification) from **last imported** (pipeline activity).

---

## 12. Related Cars

**Purpose:** Discovery without leaving the editorial frame.

| Element | Database | Editorial | Research | Optional |
|---------|----------|-----------|----------|----------|
| Related set (same brand, segment, body style, etc.) | Derived from published `cars` | Editors may later curate pinned relations | — | Section optional if fewer than 1–2 peers |
| Card fields (brand, model, image, quick facts) | Yes | — | — | Follow public card rules |

Related cars must be **published** peers only. Never link drafts.

---

## 13. Compare CTA

**Purpose:** Push readers into the comparison tool with this car (and selected variant) preloaded.

| Element | Database | Editorial | Research | Optional |
|---------|----------|-----------|----------|----------|
| Compare deep link (`slug`, optional `variant`) | Uses identity fields | CTA copy | — | CTA should always be present on full car pages |
| Comparable attributes | Spec DB fields | — | — | Hidden public fields (price/scores) follow display policy |

CTA labels (examples): “Sammenlign”, “Sammenlign med andre”. Keep wording action-clear; no hype.

---

## Publish readiness vs blueprint completeness

### Publish blockers (minimum bar)

Aligned with publish readiness:

- Brand, model, slug  
- Description  
- Image (gallery or `image_url`)  
- Source name or URL  
- `data_last_checked_at`  
- `import_status = approved`  
- `is_published` set explicitly by editor (never automatic)

### Blueprint completeness (quality bar)

A car is **blueprint-complete** when sections 1–13 can render meaningfully:

- Hero + gallery + quick facts  
- Overview (intro + who it’s for + strengths)  
- Tech groups filled for battery, range, charging, and practical basics  
- Pros and cons present  
- Sources + last checked visible  
- Related + compare available  

Missing optional rows are fine. Missing required publish fields is not.

---

## Research → editor → publish flow (for this blueprint)

```text
Research / import
  → proposes DB fields + field_sources (confidence, URLs)
  → never publishes

Editor (Car Editor workspace)
  → reviews fields, edits copy (description, pros, cons, suitable_for)
  → approves car (import_status)
  → checks last-checked + sources
  → publishes explicitly

Public car page
  → reads approved published data only
  → follows section order in this blueprint
```

---

## Mapping to current implementation (snapshot)

This blueprint is the **target standard**. Current UI may still combine some sections (e.g. charging inside technical list, overview mainly `description`).

| Blueprint section | Current primary surfaces |
|-------------------|--------------------------|
| Hero | `CarVariantDetail` header, gallery, fact grid |
| Overview | `description`, `suitable_for` (often inside tech list today) |
| Technical Specifications | Tech list / rows on detail page |
| Charging | Fields inside tech list |
| Practical Use | Partial via specs + `suitable_for` |
| Interior | Specs + equipment booleans |
| Pros / Cons | `pros`, `cons` |
| Editorial Notes | EVFAKTA Score block + score methodology/notes |
| Sources / Last checked | Source box |
| Related Cars | Related cars module on model page |
| Compare CTA | Compare buttons |

Future UI work should converge on this section order without inventing data.

---

## Checklist for editors (per car)

- [ ] Hero identity correct (brand, model, variant)  
- [ ] Gallery has a real primary image  
- [ ] Quick facts verified  
- [ ] Overview: 2–3 solid paragraphs  
- [ ] `suitable_for` filled  
- [ ] Battery / range / charging basics present  
- [ ] Pros and cons honest and specific  
- [ ] Sources linked  
- [ ] Last checked set  
- [ ] Approved, then published as a separate action  
- [ ] Compare CTA works with the intended variant  

---

## Document control

| Item | Value |
|------|--------|
| Document | `docs/CAR_BLUEPRINT.md` |
| Owners | EVFAKTA editorial + engineering |
| Change policy | Update this doc before changing public car-page information architecture |
| Companion | `docs/REFERENCE_WORKFLOW.md` — production process (not page IA) |
| Non-goals | Does not itself migrate schema or change runtime code |
