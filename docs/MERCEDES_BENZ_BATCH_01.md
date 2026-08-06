# Mercedes-Benz batch 01

**Date checked:** 2026-08-06 (fresh official NO re-verify)  
**Brand:** Mercedes-Benz  
**Batch status:** **COMPLETE** (finishable passenger models)  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official mercedes-benz.no CDN (GForces / Bertel O. Steen) → Storage gallery → visual verify  
**Production script:** `scripts/complete-mercedes-100.ts`  
**Sources primary:** mercedes-benz.no modell-/new-models-sider + Mercedes-Benz Norge press (NTB); EQS sedan dims/cargo from official Mercedes-Benz USA tech where NO omits

This is an editorial recommendation only. It does not change database approval or publication values.

---

# Official Norwegian lineup checked

Source of truth: [mercedes-benz.no](https://www.mercedes-benz.no/) (re-checked 2026-08-06). Candidate verification used live model / new-models pages only (not prior batch reports as facts).

| Candidate | Classification |
|-----------|----------------|
| EQA | **ACTIVE** — priced / orderable — **Publish Candidate** |
| EQB | **DISCONTINUED** — `eqb-ikke-tilgjengelig` — no Publish Ready shell |
| EQE (sedan) | **DISCONTINUED** — `eqe-sedan-ikke-tilgjengelig` — no Publish Ready shell |
| EQE SUV | **ACTIVE** — priced / orderable — **Publish Candidate** |
| EQS | **ACTIVE** — priced / orderable — **Publish Candidate** |
| EQS SUV | **ACTIVE** — priced / orderable — **Publish Candidate** |
| G-Class Electric | **ACTIVE** — priced / orderable — **Publish Candidate** |
| CLA Electric | **ACTIVE** — priced / orderable — **Publish Candidate** |
| CLA Shooting Brake Electric | **ACTIVE** — priced / orderable — **Publish Candidate** |
| GLC Electric | **ACTIVE** — orderable (first deliveries before summer 2026) — **Publish Candidate** |
| C-Class Electric | **ACTIVE** / sale started — **NOT_READY** (Image Ready blocked) |
| GLB Electric | **ACTIVE** — priced / orderable — **Publish Candidate** |
| VLE | **UPCOMING** — marketing / insufficient finish — not created |
| GLA Electric | **UPCOMING** — «kommer snart» — not created |

**Note:** Phrase «ikke tilgjengelig» appears in generic options disclaimers on active pages (e.g. CLA SB, GLC). Discontinued status is only when the dedicated «ikke tilgjengelig» model page is the source of truth (EQB, EQE sedan).

# ACTIVE

Finishable at 100% (Approved, Image Ready, Launch Ready, Publish Ready, unpublished):

- CLA
- CLA Shooting Brake
- GLB
- GLC
- EQS
- EQS SUV
- EQE SUV
- G-Klasse Electric
- EQA

# UPCOMING

Not created as Publish Ready:

- **VLE** — `/new-models/vle-electric/` insufficient for finish
- **GLA Electric** — premiere/marketing («kommer snart»); not finished

# DISCONTINUED

- **EQB** — not available page; no active shell finished
- **EQE sedan** — not available page; no active shell finished

# COMMERCIAL

- Mercedes-Benz nyttekjøretøy / vans — out of passenger batch scope

# Sources

1. CLA Electric — https://www.mercedes-benz.no/models/cla-electric-c174/  
2. CLA Shooting Brake Electric — https://www.mercedes-benz.no/models/cla-shooting-brake-x174/  
3. GLB Electric — https://www.mercedes-benz.no/models/glb-electric-x244/  
4. GLC Electric — https://www.mercedes-benz.no/models/glc-electric-x540/  
5. EQS sedan — https://www.mercedes-benz.no/new-models/eqs/  
6. EQS SUV — https://www.mercedes-benz.no/models/eqs-suv-x296-806-2/  
7. EQE SUV — https://www.mercedes-benz.no/models/eqe-suv-805/  
8. G-Klasse Electric — https://www.mercedes-benz.no/models/g-class-n465-805/  
9. EQA — https://www.mercedes-benz.no/models/eqa-806-2/  
10. C-Klasse Electric — https://www.mercedes-benz.no/new-models/c-class-electric/  
11. EQB discontinued — https://www.mercedes-benz.no/passengercars/models/eqb-ikke-tilgjengelig.html  
12. EQE sedan discontinued — https://www.mercedes-benz.no/passengercars/models/eqe-sedan-ikke-tilgjengelig.html  
13. VLE upcoming — https://www.mercedes-benz.no/new-models/vle-electric/  
14. GLA Electric upcoming — https://www.mercedes-benz.no/new-models/gla-electric/  
15. Mercedes-Benz Norge press (NTB) — GLC / EQS / EQS SUV / EQE SUV / EQA order & premiere notes  
16. Mercedes-Benz USA EQS 450+ tech — exterior dims + cargo only where NO omits  

**Not used as facts:** EV-Database, auto-data.net, dealer blogs, AI images as official Image Ready, invented peak DC / winter range, prior batch reports as sole evidence.

# Variants

| Model | Variants stored |
|-------|-----------------|
| CLA | 200 / 250+ / 350 4MATIC |
| CLA Shooting Brake | 350 4MATIC (default from NO highlight) |
| GLB | 350 4MATIC |
| GLC | 400 4MATIC |
| EQS | 500 4MATIC (default) / 580 4MATIC |
| EQS SUV | EQS SUV (4MATIC family shell — peak DC/battery not in current NO block) |
| EQE SUV | 350 4MATIC SUV / 500 4MATIC SUV |
| G-Klasse Electric | G 580 med EQ-teknologi |
| EQA | 300 4MATIC (default) / 250+ |
| C-Klasse Electric | C 400 4MATIC — NOT_READY |

# Specifications

Stored from official NO model pages + Mercedes-Benz Norge press. Notable honesty:

- GLC: dims/forbruk from NO press; bagasje 520 l from modellside (press texts also cite 570 l — conflict documented)
- EQS sedan: NO omits L×W×H and bagasje; dims/cargo from official Mercedes-Benz USA EQS 450+ tech; battery 118 kWh from NO
- EQS SUV: strong range/power/towing/seats; peak DC and battery capacity missing on current NO block — left empty
- EQE SUV: 96 kWh from NO press; bagasje 520–580 from NO; peak DC empty
- G 580: WLTP up to 473 km; peak DC empty on current NO page; frunk 41 documented in FAQ
- EQA 250+: peak DC not published on current NO page — empty; 300 4MATIC DC 160 kW
- C-Klasse Electric (2026-08-06): NO tech now publishes dims 4883 / 1892 / 1503 mm, bagasje 420 / frunk 101, forbruk 14,1–18,5, WLTP 752, DC 330 — stored; **Image Ready still blocked**
- Chemistry / usable kWh / V2L / V2G / heat pump: never invented; only where explicit

# Editorial

Norwegian Bokmål packages for all finishable models: description, pros, cons, suitable_for, score_notes (hvem / vinter / lading / daglig / langtur), FAQ, SEO. Zero `Draft – Requires editor review` markers on finishable models. C-Klasse remains NOT_READY with honesty notes.

# Images

Visual checklist applied before Storage attach (finishable models):

| Model | Front | Side | Rear | Interior |
|-------|-------|------|------|----------|
| CLA | ✅ | ✅ | ✅ | ✅ |
| CLA SB | ✅ | ✅ | ✅ | ✅ |
| GLB | ✅ | ✅ | ✅ | documented gap |
| GLC | ✅ | ✅ | ✅ | documented gap |
| EQS | ✅ | ✅ | ✅ | documented gap |
| EQS SUV | ✅ | ✅ | ✅ | documented gap |
| EQE SUV | ✅ | ✅ | ✅ | documented gap |
| G-Klasse Electric | ✅ | ✅ | ✅ | documented gap |
| EQA | ✅ | ✅ | ✅ | documented gap |
| C-Klasse Electric | ❌ | ❌ | ❌ | ❌ — W520 page assets include Concept CLA / E-Klasse lookalikes; no verified C-Class Front+Side pair accepted for Image Ready |

# Honest gaps

- Winter range never stored as vehicle fact
- Heat pump / V2L / V2G never claimed without explicit NO confirmation
- Usable kWh and chemistry left empty unless official
- EQS SUV / EQE SUV peak DC often empty on NO
- EQB / EQE sedan / VLE / GLA Electric not finished as Publish Ready
- C-Klasse Electric: specs improved from NO tech (2026-08-06) but Image Ready remains blocked

# NOT_READY models

| Model | Exact blocker |
|-------|---------------|
| C-Klasse Electric | Sale started + strong NO tech (incl. dims), but Image Ready blocked — no verified C-Class-only Hero/Front/Side gallery (wrong-model / ambiguous W520 assets rejected) |
| EQB / EQE sedan | Discontinued — not finished |
| VLE / GLA Electric | Upcoming / insufficient — not created |

# EVFAKTA Editorial Decision

| Model | Recommendation |
|-------|----------------|
| CLA | **Publish Candidate** |
| CLA Shooting Brake | **Publish Candidate** |
| GLB | **Publish Candidate** |
| GLC | **Publish Candidate** |
| EQS | **Publish Candidate** |
| EQS SUV | **Publish Candidate** |
| EQE SUV | **Publish Candidate** |
| G-Klasse Electric | **Publish Candidate** |
| EQA | **Publish Candidate** |
| C-Klasse Electric | **Not Ready** (Image Ready) |
| EQB / EQE sedan | **Hold** (discontinued) |
| VLE / GLA Electric | **Await Official Documentation** |

This is an editorial recommendation only. It does not change database approval or publication values.

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| CLA | 100% | YES | YES | YES | Approved, unpublished |
| CLA Shooting Brake | 100% | YES | YES | YES | Approved, unpublished |
| GLB | 100% | YES | YES | YES | Approved, unpublished |
| GLC | 100% | YES | YES | YES | Approved, unpublished |
| EQS | 100% | YES | YES | YES | Approved, unpublished |
| EQS SUV | 100% | YES | YES | YES | Approved, unpublished |
| EQE SUV | 100% | YES | YES | YES | Approved, unpublished |
| G-Klasse Electric | 100% | YES | YES | YES | Approved, unpublished |
| EQA | 100% | YES | YES | YES | Approved, unpublished |
| C-Klasse Electric | 81% | NO | NO | NO | NOT_READY |

## Next manufacturer

This brand batch is **COMPLETE** for finishable passenger models. Live queue: see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **Ford** (await human approval of Mercedes-Benz).
