# Tesla Model 3 — Reference Workflow Review

**Role:** EVFAKTA Editorial Assistant  
**Date checked:** 2026-07-26  
**Car id:** `cd2df65a-f868-4385-9c73-f79356f295ae`  
**Slug:** `tesla-model-3`  
**Status:** `needs_review` · `is_published = false`  
**Rule:** Never publish automatically. Official Tesla sources only.

**Standards:** Editorial page standard → `docs/CAR_BLUEPRINT.md`. Production process → `docs/REFERENCE_WORKFLOW.md`.  
Model 3 is the **first validated workflow example**, not a permanent content template.

---

## Readiness summary

| Metric | Value |
|--------|-------|
| Completion (spec + editorial checklist) | **≈ 58%** |
| Missing critical variant specs (battery/range/performance/charging kW) | Yes — intentionally empty |
| Open conflicts (after this package) | **0** (resolved or left empty with rationale) |
| Images approved / attached | **0 / 0** |
| Editorial drafts | **Yes** (still marked Draft – Requires editor review) |
| Ready for approval? | **No** — wait for Tesla Norge variant WLTP/battery/performance + official images |
| Ready for publish? | **No** |

**Verdict:** Model 3 validates the **Reference Workflow**: dimensions, cargo, warranty framing, connectors, and draft editorial are set from official Tesla docs. Page structure still follows `CAR_BLUEPRINT.md` for every future car. It is **not** ready for approval until Tesla Norge confirms per-variant energy and performance numbers and images are manually approved.

---

## Official sources used

| Source | URL | Used for |
|--------|-----|----------|
| Tesla Model 3 Owner's Manual (Europe) | https://www.tesla.com/ownersmanual/model3/en_eu/Owners_Manual.pdf | Dimensions, cargo, frunk, towing capacities, heat pump mention, CCS context |
| Exterior Dimensions / Cargo (EU HTML) | https://www.tesla.com/ownersmanual/model3/en_eu/GUID-56562137-FC31-4110-A13C-9A9FC6657BF0.html | Exact mm / litre tables |
| Tesla New Vehicle Limited Warranty (Europe, FR PDF) | https://digitalassets.tesla.com/tesla-contents/image/upload/tesla-new-vehicle-limited-warranty-fr-fr.pdf | 4y/80k basic; 8y battery/drive unit km bands |
| Tesla Norge product page | https://www.tesla.com/no_NO/model3 | Primary market pointer (live fetch blocked 403) |

**Not used as facts:** EV-Database, EVKX, NAF/Motor, Elbil RADAR, TV2/Broom, warranty blogs.

---

## STEP 1 — Conflict resolution

| Conflict | Decision | Action |
|----------|----------|--------|
| `battery_usable_kwh` 75 vs 78 (secondary) | **Leave empty** | Neither value is from Tesla Norge / Owner's Manual / CoC |
| `real_world_range_km` 729 vs 536 (secondary) | **Leave empty** | Not official Tesla documentation |
| `cargo_l` 594 vs 561 | **Choose 594 L** | Current EU Owner's Manual “Behind 2nd row”. Reject older GB 561 L (pre-Highland) |
| `length_mm` 4720 vs 4724 | **Split by variant** | Base + RWD/LR variants = 4720; Performance = 4724 |
| `height_mm` 1440 vs 1431 | **Split by variant** | Base + RWD/LR = 1440; Performance = 1431 |
| `width_mm` 1850 vs 2089 | **Choose 1850** | Catalog standard = excluding mirrors. Document 2089 (incl.) / 1933 (folded) in notes |
| `towing_kg` 750 vs 1000 | **Leave empty** | Both official; depends on trailer brakes. Document both below — do not silently pick |
| `warranty` secondary 4y vs 5y blogs | **Use official EU warranty text** | Basic 4y/80 000 km from Tesla Europe warranty PDF; battery bands included |

### Towing (documented, not stored as single number)

From Tesla Owner's Manual (Europe) — Trailer Towing:

- Without trailer brakes: **750 kg**
- With trailer brakes: **1000 kg**
- Requires factory towing package  
- Max tongue weight: **100 kg**

---

## STEP 2 — Specifications

### Confirmed (official)

| Field | Value | Source | Confidence | Last checked |
|-------|-------|--------|------------|--------------|
| brand / model / slug | Tesla / Model 3 / tesla-model-3 | Catalog + Tesla Norge | 1.0 | 2026-07-26 |
| body_style | Sedan | Owner's Manual (Europe) | 0.90 | 2026-07-26 |
| seats | 5 | Cargo table “with 5 passengers” | 0.90 | 2026-07-26 |
| length_mm (base) | 4720 | EU manual RWD/Long Range | 0.95 | 2026-07-26 |
| height_mm (base) | 1440 | EU manual RWD/Long Range | 0.95 | 2026-07-26 |
| width_mm | 1850 (excl. mirrors) | EU manual | 0.95 | 2026-07-26 |
| wheelbase_mm | 2875 | EU manual | 0.98 | 2026-07-26 |
| cargo_l | 594 | EU manual behind 2nd row | 0.95 | 2026-07-26 |
| frunk_l | 88 | EU manual front trunk | 0.95 | 2026-07-26 |
| heat_pump | true | EU manual climate/Battery heat pump | 0.90 | 2026-07-26 |
| charging_connector_dc | CCS2 | Europe CCS context in manual | 0.85 | 2026-07-26 |
| charging_connector_ac | Type 2 | Europe market inlet (confirm on Tesla Norge) | 0.85 | 2026-07-26 |
| warranty | 4y/80k + battery bands (see text) | Tesla EU New Vehicle Limited Warranty | 0.90 | 2026-07-26 |

### Variants

`car_variants` has no dimension columns. Base car stores RWD/Long Range dimensions (4720 / 1440 / 1850 / 2875). Performance deltas are recorded in each variant’s `import_notes` and below:

| Variant | Official length | Official height | Battery / range / power |
|---------|-----------------|-----------------|-------------------------|
| Rear-Wheel Drive | 4720 mm | 1440 mm | **Empty** |
| Long Range RWD | 4720 mm | 1440 mm | **Empty** |
| Long Range AWD | 4720 mm | 1440 mm | **Empty** |
| Performance | 4724 mm | 1431 mm | **Empty** |

All variants remain `is_active = false`, `import_status = needs_review`.

### Intentionally empty (awaiting Tesla Norge)

Battery total/usable/chemistry · WLTP range · winter/real-world range · consumption · AC/DC kW · 10–80 min · power/torque/0–100/top speed · towing_kg · price · scores

---

## STEP 3 — Editorial drafts

Stored on the car with `draft: true` and “Draft – Requires editor review.”

### Short introduction

Tesla Model 3 er en helelektrisk sedan solgt i Norge via Tesla. Highland-generasjonen er en kompakt fire-dørs elbil med fem sitteplasser, frunk og CCS-lading i det europeiske markedet. Tall for batteri, WLTP og ytelse må bekreftes per variant mot Tesla Norge før publisering.

### Who is this car for?

Pendling, små familier (5 seter), daglig bruk; langtur først når variantens WLTP er bekreftet.

### Strengths / weaknesses

See `pros` / `cons` on the car row (manual-backed practical strengths; missing Tesla Norge energy numbers as primary weakness).

### Winter considerations

Varmepumpe er nevnt i Tesla-manualen (kvalitativt pluss). **Ingen** offisielle vinterrekkeviddetall er lagret.

### Charging experience

CCS-kontekst i Europa er dokumentert. **kW / 10–80** er tomme til Tesla Norge bekrefter.

### Long-distance suitability

Strukturelt egnet (bagasje + CCS), men **ikke** scoret før Long Range WLTP er offisielt bekreftet.

### Daily usability

Kompakt sedan, 5 seter, 594 l + 88 l frunk — sterkt for hverdag når tallene er fylt.

---

## STEP 4 — Image candidates (not attached)

| Type | Candidate source | Preview? | Status |
|------|------------------|----------|--------|
| Front | https://www.tesla.com/no_NO/model3 | No — source page | pending |
| Rear | https://www.tesla.com/no_NO/model3 | No — source page | pending |
| Side | https://www.tesla.com/no_NO/model3 | No — source page | pending |
| Interior | EU Owner's Manual figures | No — PDF/manual | pending |
| Cargo | EU Owner's Manual cargo section | No — PDF/manual | pending |

**Attached `car_images`:** 0  
**Do not approve page URLs as images.** Editor must download official stills manually.

---

## STEP 5 — Provenance checklist

Every **populated** field should have in `field_sources`:

- `source_name`
- `source_url`
- `data_last_checked_at` / `retrieved_at`
- `confidence`
- `review_status` (still `pending` until human approval)
- `draft` where editorial

Empty energy/performance fields correctly have **no** invented provenance.

---

## STEP 6 — Quality gate

| Gate | Pass? |
|------|-------|
| No invented battery/range/performance numbers | Yes |
| Conflicts not silently auto-picked | Yes |
| `is_published = false` | Yes |
| `import_status = needs_review` | Yes |
| Images not auto-attached | Yes |
| Tesla Norge variant sheet captured | **No** |
| Human approved editorial | **No** |
| Human approved images | **No** |

### Ready for approval?

**No.**

### What the editor must do next

1. Open Tesla Norge Model 3 configurator/spec sheet (human capture — bots get 403).
2. Fill **per variant**: WLTP, battery usable/total if published, consumption, DC/AC kW, 0–100, power, top speed.
3. Download official front/rear/side/interior/cargo stills; attach in Car Editor Images tab with rights notes.
4. Rewrite editorial drafts without the draft disclaimer when specs are complete.
5. Review field_sources → mark approved in Field Review.
6. Keep **Needs Review** until then. Publish is a separate human action.

### Apply script

`npx tsx scripts/apply-model3-reference-workflow.ts`  
Updates the Supabase car/variants with this package only. Never sets `is_published = true`.

---

## Completion breakdown (approx.)

| Area | Status |
|------|--------|
| Identity | Complete |
| Dimensions (base + Performance split) | Complete |
| Practical (cargo/frunk/seats; towing documented empty) | Mostly complete |
| Equipment (heat pump) | Partial |
| Warranty | Complete (Europe warranty PDF) |
| Charging connectors | Partial (kW empty) |
| Battery / Range / Performance / Consumption | **Missing** |
| Editorial | Draft complete |
| Images | Candidates only |
| Sources | Complete pointers |

**Overall ≈ 58%** toward a publishable Model 3 record.  
**Reference Workflow validation:** complete enough to reuse the process on the next car.  
**Content completeness for Norway catalog:** not yet.

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
| Tesla Model 3 | Hold for Review | EU Owner’s Manual package covers dimensions/practical fields; Norwegian-market variant energy figures still need confirmation. |
