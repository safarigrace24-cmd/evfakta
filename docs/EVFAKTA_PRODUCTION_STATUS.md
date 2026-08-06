# EVFAKTA Production Status

**Role:** Editorial Production Manager  
**Report date:** 2026-08-06  
**Evidence:** Batch reports (`docs/*_BATCH_01.md`) · `docs/EVFAKTA_V1_LAUNCH_MASTER_CHECKLIST.md` · master catalog plan (50 models)  
**Publish rule:** Intentional publish only — public catalog remains empty

---

# Completed manufacturers

These manufacturers are **COMPLETE** and **locked** (do not modify unless official data changes):

| # | Manufacturer | Batch report | Finishable at 100% | NOT_READY within brand |
|--:|--------------|--------------|--------------------:|------------------------|
| 1 | Volkswagen | `docs/VOLKSWAGEN_BATCH_01.md` | 4 | ID.5 |
| 2 | Volvo | `docs/VOLVO_BATCH_01.md` | 5 | EX60 |
| 3 | Tesla | `docs/TESLA_BATCH_01.md` | 4 | — |
| 4 | BMW | `docs/BMW_BATCH_01.md` | 6 | — |
| 5 | Audi | `docs/AUDI_BATCH_01.md` | 4 | Q8 e-tron |
| 6 | Kia | `docs/KIA_BATCH_01.md` | 4 | EV4, EV5, PV5 Passenger |
| 7 | Hyundai | `docs/HYUNDAI_BATCH_01.md` | 5 | Ioniq 9 Varebil, Staria Electric, Ioniq 3 |
| 8 | Toyota | `docs/TOYOTA_BATCH_01.md` | 4 | — (commercial LCV/Hilux BEV not finished) |
| 9 | BYD | `docs/BYD_BATCH_01.md` | 6 | Han, EVO |
| 10 | Mercedes-Benz | `docs/MERCEDES_BENZ_BATCH_01.md` | 9 | C-Klasse Electric |

**Manufacturers complete:** **10**

---

# Completed models

Every model below is currently:

- **Approved** (`import_status=approved`)
- **Image Ready** (Hero + Front + Side)
- **Launch Ready** (completion ≥95% + content gates)
- **Publish Ready** (hard gates + completion threshold)
- **Unpublished** (`is_published=false` — intentional)

| Manufacturer | Model | Completion |
|--------------|-------|:----------:|
| Volkswagen | ID.3 | 100% |
| Volkswagen | ID.4 | 100% |
| Volkswagen | ID.7 | 100% |
| Volkswagen | ID. Buzz | 100% |
| Volvo | EX30 | 100% |
| Volvo | EX40 | 100% |
| Volvo | EC40 | 100% |
| Volvo | EX90 | 100% |
| Volvo | ES90 | 100% |
| Tesla | Model 3 | 100% |
| Tesla | Model Y | 100% |
| Tesla | Model S | 100% |
| Tesla | Model X | 100% |
| BMW | iX1 | 100% |
| BMW | iX2 | 100% |
| BMW | i4 | 100% |
| BMW | i5 | 100% |
| BMW | i7 | 100% |
| BMW | iX | 100% |
| Audi | Q4 e-tron | 100% |
| Audi | Q6 e-tron | 100% |
| Audi | A6 e-tron | 100% |
| Audi | e-tron GT | 100% |
| Kia | EV2 | 100% |
| Kia | EV3 | 100% |
| Kia | EV6 | 100% |
| Kia | EV9 | 100% |
| Hyundai | Kona Electric | 100% |
| Hyundai | Ioniq 5 | 100% |
| Hyundai | Ioniq 6 | 100% |
| Hyundai | Ioniq 9 | 100% |
| Hyundai | INSTER | 100% |
| Toyota | bZ4X | 100% |
| Toyota | bZ4X Touring | 100% |
| Toyota | C-HR+ | 100% |
| Toyota | Urban Cruiser | 100% |
| BYD | Dolphin | 100% |
| BYD | Atto 3 | 100% |
| BYD | Seal | 100% |
| BYD | Seal U | 100% |
| BYD | Sealion 7 | 100% |
| BYD | Tang | 100% |
| Mercedes-Benz | CLA | 100% |
| Mercedes-Benz | CLA Shooting Brake | 100% |
| Mercedes-Benz | GLB | 100% |
| Mercedes-Benz | GLC | 100% |
| Mercedes-Benz | EQS | 100% |
| Mercedes-Benz | EQS SUV | 100% |
| Mercedes-Benz | EQE SUV | 100% |
| Mercedes-Benz | G-Klasse Electric | 100% |
| Mercedes-Benz | EQA | 100% |

**Models complete (Publish Ready, unpublished):** **51**

---

# NOT_READY models

Blocked models inside completed manufacturer batches (no inventing; remain unpublished):

| Manufacturer | Model | Why NOT_READY |
|--------------|-------|---------------|
| Volkswagen | ID.5 | Insufficient official Norwegian tech documentation; no invented specs/images |
| Volvo | EX60 | No Image Ready Storage gallery; production specs incomplete for launch |
| Audi | Q8 e-tron | Specs present from Audi Norge pricelist; Image Ready blocked — MediaCenter Q8 albums unavailable; no invented images |
| Kia | EV4 | Specs from Kia Norge pricelist; Image Ready blocked — no verified Front+Side gallery |
| Kia | EV5 | Specs + GT from Kia Norge pricelists; Image Ready blocked — no verified Side |
| Kia | PV5 Passenger | Specs from Kia Norge pricelist; Image Ready blocked — studio front only |
| Hyundai | Ioniq 9 Varebil | Specs from Hyundai Norge tech; Image Ready blocked — no verified gallery |
| Hyundai | Staria Electric | Marketing page only; NO pricelist/tech PDF not retrieved |
| Hyundai | Ioniq 3 | Premiere/marketing only; no NO pricelist |
| BYD | Han | No structured Sanity specifications; insufficient images |
| BYD | EVO | USP only — structured dims/consumption table not finishable in this run |
| Mercedes-Benz | C-Klasse Electric | Sale started / strong NO tech (dims 4883×1892×1503 mm stored 2026-08-06); Image Ready blocked — no verified C-Class-only Hero/Front/Side (W520/Concept CLA lookalikes rejected) |

**Models NOT_READY (production batch blockers):** **12**

### Related non-launch / out-of-scope notes

| Slug / model | Note |
|--------------|------|
| Toyota Proace Electric / Proace City Electric | Commercial LCV sold in NO — not finished in passenger Toyota batch |
| Toyota Hilux BEV | Brochure on toyota.no — not finished (incomplete for launch without full NO tech + Image Ready) |
| BYD eTP3 | Commercial van on byd.no — excluded from passenger finish |
| BYD Dolphin Surf / Atto 2 | Not on current official Norwegian modeller list — not created |
| Mercedes-Benz EQB / EQE sedan | Discontinued / ikke tilgjengelig on mercedes-benz.no — no Publish Ready shells |
| Mercedes-Benz VLE / GLA Electric | Upcoming / marketing — not created as finishable shells |
| Mercedes-Benz commercial vans | Excluded from passenger batch |

---

# Total statistics

| Metric | Value |
|--------|------:|
| Manufacturers complete (locked) | **10** |
| Models complete (Approved + Image + Launch + Publish Ready, unpublished) | **51** |
| Models NOT_READY (in completed brand batches) | **12** |
| Image Ready count | **51** |
| Publish Ready count | **51** |
| Published count (public) | **0** |
| Draft markers remaining | **Non-finishable / NOT_READY remain** (finishable locked models cleared) |
| Launch blockers remaining | **Yes** — catalog coverage, brand logos, DNS cutover, tool parity, intentional publish wave (see master checklist §11) |
| Cars in DB (approx.) | **64** |
| Master catalog target | **50** published |

---

# Remaining manufacturers

Ordered production queue (**await human go-ahead** before each brand):

| Order | Manufacturer | Status |
|------:|--------------|--------|
| 1 | **Ford** | Next — await approval of Mercedes-Benz |
| 2 | Polestar | Not started |
| 3 | MG | Not started |
| 4 | Nissan | Not started |
| 5 | Peugeot | Not started |
| 6 | Skoda | Not started |
| 7 | Cupra | Not started |
| 8 | XPENG | Not started |
| 9 | Zeekr | Not started |
| 10 | Porsche | Not started |

**Stop rule:** Do not start Ford until human approval of Mercedes-Benz. Do not modify locked manufacturers (Volkswagen, Volvo, Tesla, BMW, Audi, Kia, Hyundai, Toyota, BYD, Mercedes-Benz) unless official data changes.

**Queue source of truth:** This file (`docs/EVFAKTA_PRODUCTION_STATUS.md`) is the only live “what’s next” pointer. Completed brand batch reports must not invent a parallel stop sequence.

---

# Estimated launch readiness

| Lens | Estimate | Basis |
|------|--------:|-------|
| Content ready vs 50-model target | **100%+** | 51 Publish Ready unpublished / 50 |
| Public catalog live | **0%** | 0 published |
| Manufacturer queue progress | **~56%** | 10 complete / ~18 brands in master set |
| **Overall estimated launch readiness** | **~60%** | Software largely complete + 51 models Publish Ready, but **0 published**, logos missing, DNS blocked, remaining brands + tool parity still required |

**Verdict:** Production core expanded to **51 Publish Ready** (unpublished). Content volume now exceeds the 50-model Publish Ready count target, but EVFAKTA is **not** ready to replace the live site until a deliberate publish wave, brand logos, and cutover/tool-parity gates are cleared.

---

**Next production action:** Await human go-ahead before **Ford**. No commit / no push / no DNS / no auto-publish.
