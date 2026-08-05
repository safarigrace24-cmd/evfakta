# Mercedes-Benz batch 01

**Date checked:** 2026-08-05  
**Brand:** Mercedes-Benz  
**Batch status:** **COMPLETE** (finishable passenger models)  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official mercedes-benz.no CDN (GForces / Bertel O. Steen) → Storage gallery → visual verify  
**Production script:** `scripts/complete-mercedes-100.ts`  
**Sources primary:** mercedes-benz.no modell-/new-models-sider + Mercedes-Benz Norge press (NTB) + konfigurator-henvisning; dims/cargo for EQS sedan from official Mercedes-Benz USA tech where NO omits

This is an editorial recommendation only. It does not change database approval or publication values.

---

# Official Norwegian lineup checked

Source of truth: [mercedes-benz.no](https://www.mercedes-benz.no/) model / new-models pages (checked 2026-08-05).

| Candidate | Classification |
|-----------|----------------|
| CLA Electric | ACTIVE — **Publish Candidate** |
| CLA Shooting Brake Electric | ACTIVE — **Publish Candidate** |
| GLB Electric | ACTIVE — **Publish Candidate** |
| GLC Electric | ACTIVE — **Publish Candidate** (orderable; first deliveries before summer 2026) |
| EQS sedan | ACTIVE — **Publish Candidate** |
| EQS SUV | ACTIVE — **Publish Candidate** |
| EQE SUV | ACTIVE — **Publish Candidate** |
| G-Klasse Electric (G 580 EQ) | ACTIVE — **Publish Candidate** |
| EQA | ACTIVE — **Publish Candidate** (still priced/sold) |
| C-Klasse Electric | ACTIVE / sale started — **NOT_READY** (Image Ready blocked) |
| EQB | DISCONTINUED — `eqb-ikke-tilgjengelig` — no Publish Ready shell |
| EQE sedan | DISCONTINUED — `eqe-sedan-ikke-tilgjengelig` — no Publish Ready shell |
| VLE | UPCOMING — marketing only — not created |
| GLA Electric | UPCOMING — premiere/marketing — not created |
| Commercial vans / V-klasse BEV | COMMERCIAL — excluded from passenger finish |

# Active models

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

# Upcoming models

Not created as Publish Ready:

- **VLE** — `/new-models/vle-electric/` insufficient for finish
- **GLA Electric** — premiere/marketing; not finished this run

# Discontinued models

- **EQB** — not available page; no active shell finished
- **EQE sedan** — not available page; no active shell finished

# Commercial vehicles excluded or separated

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
11. Mercedes-Benz Norge press (NTB) — GLC order/premiere, EQS order/premiere, EQS SUV order, EQE SUV order, EQA order  
12. Mercedes-Benz USA EQS 450+ tech — exterior dims + cargo only where NO omits  

**Not used as facts:** EV-Database, auto-data.net, dealer blogs, AI images as official Image Ready, invented peak DC / winter range.

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
- EQS sedan: dims/cargo from official Mercedes-Benz USA tech (NO omits); power/range/charging from NO
- EQS SUV: dims from NO press; bagasje 880 l from modellside; peak DC/battery/hk honesty
- EQE SUV: press length cell mangled (863) — not stored; width/height + DC/batteri/varmepumpe from press
- G 580: forbruk not on NO model tech block — documented gap; peak DC/battery honesty; tilhenger honesty
- C-Klasse Electric: strong NO tech but Image Ready blocked

# Editorial

Norwegian Bokmål packages for finishable models: description, pros, cons, suitable_for, score_notes, FAQ. Zero `Draft – Requires editor review` markers on finishable models.

# Images

Visual checklist applied before Storage attach (official CDN assets only):

| Model | Front | Side | Rear | Interior |
|-------|-------|------|------|----------|
| CLA | ✅ | ✅ | documented / when available | documented missing |
| CLA Shooting Brake | ✅ | ✅ | documented missing | documented missing |
| GLB | ✅ | ✅ | documented missing | documented missing |
| GLC | ✅ | ✅ | documented missing | documented missing |
| EQS | ✅ | ✅ | ✅ | documented missing |
| EQS SUV | ✅ | ✅ | documented missing | documented missing |
| EQE SUV | ✅ | ✅ | ✅ | documented missing |
| G-Klasse Electric | ✅ | ✅ | ✅ | documented missing |
| EQA | ✅ | ✅ | ✅ | ✅ |
| C-Klasse Electric | ❌ wrong-model assets rejected | ❌ | — | — |

# Honest gaps

- Winter range never stored as vehicle fact
- Heat pump boolean only where explicitly confirmed (EQE SUV press: standard); others documented honesty
- EQS SUV / G 580 peak DC and battery capacity not invented
- C-Klasse Electric Image Ready blocked until verified Hero/Front/Side of correct body

# Result table

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|------------|-------------|--------------|---------------|--------|
| CLA | 100% | YES | YES | YES | Approved, unpublished |
| CLA Shooting Brake | 100% | YES | YES | YES | Approved, unpublished |
| GLB | 100% | YES | YES | YES | Approved, unpublished |
| GLC | 100% | YES | YES | YES | Approved, unpublished |
| EQS | 100% | YES | YES | YES | Approved, unpublished |
| EQS SUV | 100% | YES | YES | YES | Approved, unpublished |
| EQE SUV | 100% | YES | YES | YES | Approved, unpublished |
| G-Klasse Electric | 100% | YES | YES | YES | Approved, unpublished |
| EQA | 100% | YES | YES | YES | Approved, unpublished |
| C-Klasse Electric | 78% | NO | NO | NO | NOT_READY |

# Editorial recommendations (non-binding)

1. Re-pull C-Klasse Electric gallery from official press when dedicated W206 Electric studio assets are live on mercedes-benz.no.  
2. Confirm EQS sedan dims/cargo against Norwegian configurator/PDF when published; replace USA fallback if NO values differ.  
3. Fill EQS SUV battery/DC/hk from konfigurator when NO marketing block stays thin.  
4. Do not resurrect EQB / EQE sedan as active Publish Ready without renewed NO sales evidence.

---

**Stop:** Mercedes-Benz COMPLETE / locked. Do not start Ford until human approval. No commit / no push / no DNS / no auto-publish.
