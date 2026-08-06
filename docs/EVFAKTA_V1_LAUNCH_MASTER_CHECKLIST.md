# EVFAKTA V1.0 Launch Master Checklist

**Role:** Editorial Production Manager (production launch preparation)  
**Audit date:** 2026-07-28 (initial) · **Last production update:** 2026-07-28  
**Evidence:** `docs/EVFAKTA_V1_LAUNCH_AUDIT_SNAPSHOT.json` · Phase 1 reports below  
**Verify this pass:** `npm run lint` ✅ · `npm test` ✅ · `npm run build` ✅  
**Last production update:** 2026-08-06 — Mercedes-Benz COMPLETE (re-verified official NO lineup; 9 Publish Ready; C-Klasse Electric NOT_READY Image Ready); VW + Volvo + Tesla + BMW + Audi + Kia + Hyundai + Toyota + BYD + Mercedes-Benz locked; await Ford approval

---

## Quality standard (Launch / Publish Ready)

| Rule | Value |
|------|------:|
| Minimum Review Assistant completion | **95%** |
| Preferred completion | **100%** |
| Below 95% | Not Launch Ready / Not Publish Ready |
| Editorial confidence | Re-review any field &lt;90%; no 55% draft editorial on launch models |
| Images | Approved Hero + Front + Side (Rear/Interior when available) |
| Required dropdowns | `vehicle_type`, `body_style`, `drivetrain` must be real enum options — never empty / «Velg …» on approved models |

## Progress dashboard (live)

| Metric | Value | Target |
|--------|------:|-------:|
| Progress % (published launch-ready / 50) | **0%** | 100% |
| Cars in DB | ~64 | ≥50 published |
| Published (public) | **0** | ≥50 |
| `import_status = approved` | **51** | ≥50 |
| Draft markers remaining | non-finishable remain | 0 |
| Image Ready (Hero+Front+Side gallery) | **51** | ≥50 |
| Zero `car_images` gallery | lower after Mercedes-Benz | 0 |
| Remaining guides (priority set) | 8 | 0 |
| Remaining launch blockers | See §9 | 0 |
| Active brand logos | 0 / 3 | 3 / 3 |

### Phase 1 — Finish existing brands

| Brand | Status | Notes |
|-------|--------|-------|
| Volkswagen | **COMPLETE** (locked) | ID.3/ID.4/ID.7/ID. Buzz **100%**. ID.5 NOT_READY. Do not modify unless official data change. |
| Volvo | **COMPLETE** (locked) | EX30/EX40/EC40/EX90/ES90 **100%**. EX60 NOT_READY. Do not modify unless official data change. |
| Tesla | **COMPLETE** (locked) | Model 3/Y/S/X **100%**. Energy honesty (NO 403). Do not modify unless official data change. See `docs/TESLA_BATCH_01.md` |
| BMW | **COMPLETE** (locked) | iX1/iX2/i4/i5/i7/iX **100%**. Do not modify unless official data change. See `docs/BMW_BATCH_01.md` |
| Audi | **COMPLETE** (locked) | Q4/Q6/A6/e-tron GT **100%**. Q8 NOT_READY (no Image Ready). Do not modify unless official data change. See `docs/AUDI_BATCH_01.md` |
| Kia | **COMPLETE** (locked) | EV2/EV3/EV6/EV9 **100%**. EV4/EV5/PV5 NOT_READY (no Image Ready). Do not modify unless official data change. See `docs/KIA_BATCH_01.md` |
| Hyundai | **COMPLETE** (locked) | Kona Electric / Ioniq 5 / Ioniq 6 / Ioniq 9 / INSTER **100%**. Ioniq 9 Varebil / Staria Electric / Ioniq 3 NOT_READY. Do not modify unless official data change. See `docs/HYUNDAI_BATCH_01.md` |
| Toyota | **COMPLETE** (locked) | bZ4X / bZ4X Touring / C-HR+ / Urban Cruiser **100%**. Commercial LCV/Hilux BEV not finished. Do not modify unless official data change. See `docs/TOYOTA_BATCH_01.md` |
| BYD | **COMPLETE** (locked) | Dolphin / Atto 3 / Seal / Seal U / Sealion 7 / Tang **100%**. Han / EVO NOT_READY. Do not modify unless official data change. See `docs/BYD_BATCH_01.md` |
| Mercedes-Benz | **COMPLETE** (locked) | CLA / CLA SB / GLB / GLC / EQS / EQS SUV / EQE SUV / G-Klasse Electric / EQA **100%**. C-Klasse Electric NOT_READY (Image Ready). Do not modify unless official data change. See `docs/MERCEDES_BENZ_BATCH_01.md` |

### Production batches completed

| Batch | Report | Image Ready | Published |
|-------|--------|:-----------:|:---------:|
| VW ID.3 | `docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.md` | YES (no interior) | No |
| VW ID.4 | `docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.md` | YES (+ interior) | No |
| VW ID.7 | `docs/PHASE1_VOLKSWAGEN_ID7_PRODUCTION.md` | YES (no interior) | No |
| VW ID. Buzz | `docs/PHASE1_VOLKSWAGEN_ID_BUZZ_PRODUCTION.json` | YES (+ interior) | No |
| VW brand rollup | `docs/VOLKSWAGEN_BATCH_01.md` | 4/4 finishable | No |
| Toyota brand rollup | `docs/TOYOTA_BATCH_01.md` | 4/4 finishable | No |
| BYD brand rollup | `docs/BYD_BATCH_01.md` | 6/6 finishable | No |
| Mercedes-Benz brand rollup | `docs/MERCEDES_BENZ_BATCH_01.md` | 9/9 finishable | No |

### Ops actions this pass

- Quarantined non-compliant publishes: `toyota-c-hr-plus`, `byd-seal-u`, `volkswagen-id-4` → `is_published=false`
- Throttled image-role replacement spam: typed roles now require URL role-score > 0 (`lib/admin/image-role-replacement.ts`)
- **2026-07-30 dropdown enum repair:** Locked brands audited — invalid `vehicle_type=BEV` (showed as «Velg type»), non-option body styles, and drivetrain aliases (`Tohjulstrekk`/`…strekk`) normalized to `VEHICLE_TYPE_OPTIONS` / `BODY_STYLE_OPTIONS` / `DRIVETRAIN_OPTIONS`. Approved cars now require these enums on save (`lib/admin/validate.ts`). Scripts: `scripts/audit-dropdown-enums.ts`, `scripts/fix-dropdown-enums.ts`.

---

## Executive verdict

**EVFAKTA cannot replace the live website yet.**

Software (CMS, Design System 2.0, Image Review, Research, publish gates) is largely **Complete**.  
Launch is blocked by **content, images, approvals, and catalog coverage**.

**Critical truth:** Public catalog is empty (0 published). Volkswagen, Volvo, Tesla, BMW, Audi, Kia, Hyundai, Toyota, BYD, and Mercedes-Benz finishable models are at **100%** Review Assistant completion and Image/Launch/Publish Ready (unpublished). VW ID.5, Volvo EX60, Audi Q8, Kia EV4/EV5/PV5, Hyundai Ioniq 9 Varebil / Staria / Ioniq 3, BYD Han / EVO, and Mercedes-Benz C-Klasse Electric remain NOT_READY. Tesla energy honesty until Tesla Norge live capture. BMW used PressClub (bmw.no blocked). Audi used Norge pricelists + MediaCenter. Kia used Norge pricelists + kia.no Crystallize press assets. Hyundai used Norge tekniske ark + pricelists + DAM. Toyota used Norge forhandler prislister + Scene7. BYD used byd.no Sanity specifications + RSA prisliste. Mercedes-Benz used mercedes-benz.no + Norge press (NTB); EQS sedan dims/cargo from official Mercedes-Benz USA tech where NO omits.

---

## How to read this document

Every checklist row uses:

| Field | Meaning |
|-------|---------|
| **Priority** | Critical / High / Medium / Low |
| **Effort** | S ≤0.5d · M 0.5–2d · L 2–5d · XL >5d |
| **Area** | Content / Images / Editorial / SEO / Product / Ops / Trust / A11y / Perf |
| **Status** | Complete / In Progress / Missing / Blocked |

---

# 1 Software

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Design System 2.0 public surfaces | High | — | Product | Complete | Locked; polish reports exist for home/models/detail/compare |
| Admin CMS (cars, brands, variants, gallery) | High | — | Product | Complete | |
| Production Dashboard + launch gates | High | — | Product | Complete | Launch Content Ready / Publish Ready / Blocked |
| Image Review + Storage review copies | Critical | — | Images | Complete | Workflow complete; content not approved |
| Auto-replace failed image candidates | High | — | Images | Complete | Failed cards hidden by default |
| Research pipeline + manual handoff | High | — | Content | Complete | Tesla Norge often blocked → manual |
| Publish readiness enforcement | Critical | — | Ops | Complete | Code gates exist; live published set predates / violates them |
| Auth (login/register/reset) | High | M | Product | In Progress | Works with env; missing page metadata / robots gaps |
| Favorites + Min side | Medium | M | Product | In Progress | Functional; empty-state / unfavorite polish open |
| Compare tool | High | — | Product | Complete | Product-ready; needs published models with images |
| Catch-all soft-404 fixed | Critical | — | SEO | Complete | `notFound()`; see LAUNCH_BLOCKERS_FIX_REPORT |
| Public `error.tsx` | High | — | Product | Complete | |
| `global-error.tsx` | Medium | S | Product | Missing | Optional branded root boundary |
| Unfinished tools routes exist honestly | High | — | Product | Complete | WIP badges; pages say Under utvikling |
| Calculator / Rimeligste / Verktøy / Testdata / Ladekart product | Critical | XL | Product | Missing | Intentionally unfinished — not Wave 1 software |
| Live DNS cutover | Critical | M | Ops | Blocked | Blocked until Publish Ready wave exists |

---

# 2 Content

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Homepage editorial (hero, FAQ, about, trust) | High | M | Editorial | In Progress | Safe defaults; needs editor pass |
| `/info` trust / method / terms | High | M | Trust | In Progress | Present; keep aligned with nav WIP policy |
| `/bruktbil` used-EV guide | High | M | Editorial | In Progress | Guide live; no per-model used guides |
| Buying guides / articles / news | High | L | Content | Missing | No article CMS / routes |
| Per-model FAQ field | Medium | L | Content | Missing | DB has no `faq`; homepage FAQ only |
| Related models on detail | High | M | Content | Missing | No related models section found on model pages |
| Draft marker purge (all launch models) | Critical | L | Editorial | Missing | **15 / 17** cars still contain draft marker |
| Human Norwegian rewrite after drafts | Critical | XL | Editorial | Missing | Required before approve/publish |
| Conflict resolution (documented VW/Volvo) | High | M | Content | In Progress | e.g. ID.4 length; EX90 seats/cargo; towing splits |
| Price policy (`PUBLIC_SHOW_PRICES`) | High | M | Product | In Progress | Prices hidden; Rimeligste blocked on purpose |
| Score display policy | Medium | M | Product | In Progress | Scores may be hidden; don’t claim scored catalog publicly |
| Stray published non-batch models | Critical | M | Ops | **Complete** | Quarantined 2026-07-28 (`is_published=false`) |
| Over-published VW ID.4 | Critical | M | Ops | **Complete** | Quarantined; then Image Ready + editorial approved (unpublished) |

### Incomplete public pages (content)

| Page | Priority | Effort | Status | What’s missing |
|------|----------|--------|--------|----------------|
| `/kalkulator` | Critical | XL | Missing | No calculation engine (old live site had one) |
| `/rimeligste` | Critical | L | Blocked | Needs prices + ranked list; prices hidden |
| `/verktoy` | High | XL | Missing | Tool hub empty |
| `/testdata` | High | XL | Missing | No sourced test dataset |
| `/ladekart` | High | XL | Missing | No live charging dataset / map |
| `/bruktbil` | High | M | In Progress | Guide OK; calculators/deep guides missing |
| `/info` | Medium | S | In Progress | Editorial polish |
| News / articles | High | XL | Missing | No surface |
| Model-specific guides | Medium | XL | Missing | Not in schema/routes |

---

# 3 Models

## 3.1 Portfolio snapshot (live DB)

| Manufacturer | Master planned | In DB | Published | Approved | Needs review | Draft markers | Image Ready | Zero gallery | Missing from master |
|--------------|---------------:|------:|----------:|---------:|-------------:|--------------:|------------:|-------------:|---------------------|
| Volkswagen | 3 (+ID.5/Buzz extras) | 5 | 1 | 1 | 4 | 5 | 0 | 5 | — (ID.5/Buzz beyond core 3) |
| Volvo | 3 (+EC40/ES90/EX60 extras) | 6 | 0 | 0 | 6 | 6 | 0 | 6 | — |
| Tesla | 4 | 4 | 0 | 0 | 4 | 4 | 0 | 4 | — |
| Toyota | 4 | 4 | 0 | 4 | 4 | 4 | 0 | 0 | CMS 4 (Touring/Urban beyond master 2; LCV/Hilux not finished) |
| BMW | 6 | 6 | 0 | 6 | 6 | 6 | 0 | 0 | CMS 6 (master plan still 3) |
| Audi | 5 | 5 | 0 | 4 | 4 | 4 | 0 | 1 | CMS 5 (Q8 NOT_READY; master plan still 2) |
| Kia | 7 | 7 | 0 | 4 | 3 | 4 | 0 | 3 | CMS 7 (EV2/EV4/EV5/PV5 beyond master 3; EV4/EV5/PV5 NOT_READY) |
| Hyundai | 8 | 8 | 0 | 5 | 5 | 5 | 0 | 3 | CMS 8 (INSTER/Ioniq 9/Varebil/Staria/Ioniq 3 beyond master 3; 3 NOT_READY) |
| BYD | 3 | 6 | 0 | 6 | 6 | 6 | 0 | 2 | Dolphin/Atto3/Seal/Seal U/Sealion7/Tang 100%; Han/EVO NOT_READY (beyond master 3) |
| Mercedes-Benz | 3 | 10 | 0 | 9 | 9 | 9 | 0 | 1 | CLA/CLA SB/GLB/GLC/EQS/EQS SUV/EQE SUV/G-Klasse/EQA 100%; C-Klasse Electric NOT_READY (beyond master 3) |
| Ford | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Nissan | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| MG | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Polestar | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 3 |
| XPENG | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | G6, G9 |
| Zeekr | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 001, 7X |
| Renault | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Peugeot | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Skoda | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Cupra | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Mini | 0 in master | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **Not in V1 master catalog** |
| Porsche | 0 in master | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **Not in V1 master catalog** |

**Active brand rows in CMS:** Volkswagen, Volvo, Tesla only — **all missing `logo_url`**.

## 3.2 Per-model production board (cars that exist)

### Volkswagen

| Model | Variants | Specs | Sources | Editorial | Images candidates usable | Gallery H/F/S | Launch content | Publish ready |
|-------|---------:|-------|---------|-----------|-------------------------:|---------------|----------------|---------------|
| ID.3 | 4 | Strong (PDF) | Present | **Final** | Curated | ✅/✅/✅ (+rear) | **Approved** | Ready (unpublished) |
| ID.4 | 2 | Strong | Present | **Final** | Curated | ✅/✅/✅ (+rear+interior) | **Approved** | Ready (unpublished) |
| ID.5 | 0 | Shell / blocked | Weak | NOT_READY copy | No usable | ❌/❌/❌ | **NOT_READY** | Blocked — no NO tech PDF |
| ID.7 | 3 | Partial gaps | Present | **Final** | Curated + side hunt | ✅/✅/✅ (+rear) | **Approved** | Ready (unpublished) |
| ID. Buzz | 4 | Strong (Pro+GTX) | Present | **Final** | Curated + side hunt | ✅/✅/✅ (+rear+interior) | **Approved** | Ready (unpublished) |

### Volvo

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Launch / Publish |
|-------|---------:|-------|---------|-----------|------------------:|---------------|------------------|
| EX30 | 3 | Strong | Present | Draft | Yes | ❌/❌/❌ | Missing / Missing |
| EX40 | 4 | Strong | Present | Draft | Yes | ❌/❌/❌ | Missing / Missing |
| EC40 | 4 | Strong | Present | Draft | Yes | ❌/❌/❌ | Missing / Missing |
| EX90 | 2 | Strong | Present | Draft | Yes | ❌/❌/❌ | Missing / Missing |
| ES90 | 3 | Strong | Present | Draft | Yes | ❌/❌/❌ | Missing / Missing |
| EX60 | 3 | Strong | Present | Draft | **0 usable** (failed history) | ❌/❌/❌ | Missing / Missing — image refresh skipped by prior mission |

### Tesla

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| Model 3 | 4 | Dims+honesty | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Model Y | 3 | Dims+honesty | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Model S | 2 | Dims+honesty | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Model X | 2 | Dims+honesty | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |

### BMW

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| iX1 | 2 | PressClub | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| iX2 | 2 | PressClub | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| i4 | 4 | PressClub | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| i5 | 1 | PressClub xDrive40 | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| i7 | 1 | PressClub xDrive60 | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| iX | 3 | PressClub 01/2025 | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |

### Audi

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| Q4 e-tron | 3 | NO pricelist + Media dims | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Q6 e-tron | 2 | NO pricelist | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| A6 e-tron | 4 | NO + eTD cargo/DC | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| e-tron GT | 3 | NO pricelist | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Q8 e-tron | 3 | NO pricelist | Present | Final | None | ❌/❌/❌ | **NOT_READY** (no Image Ready) |

### Kia

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| EV2 | 3 | NO pricelist | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| EV3 | 3 | NO pricelist | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| EV6 | 4 | NO pricelist + GT | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| EV9 | 4 | NO pricelist + GT | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| EV4 | 3 | NO pricelist | Present | Final | None | ❌/❌/❌ | **NOT_READY** (no Image Ready) |
| EV5 | 3 | NO pricelist + GT | Present | Final | None | ❌/❌/❌ | **NOT_READY** (no Image Ready) |
| PV5 Passenger | 3 | NO pricelist | Present | Final | None | ❌/❌/❌ | **NOT_READY** (no Image Ready) |

### Hyundai

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| Kona Electric | 2 | NO tech + pricelist | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Ioniq 5 | 4 | NO PE tech + N | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Ioniq 6 | 4 | NO PE tech + N | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Ioniq 9 | 3 | NO tech | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| INSTER | 3 | NO tech | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Ioniq 9 Varebil | 1 | NO tech | Present | Final | None | ❌/❌/❌ | **NOT_READY** (no Image Ready) |
| Staria Electric | 1 | Marketing only | Partial | Shell | None | ❌/❌/❌ | **NOT_READY** (no NO tech/pricelist) |
| Ioniq 3 | 1 | Marketing only | Partial | Shell | None | ❌/❌/❌ | **NOT_READY** (no NO pricelist) |

### Toyota

| Model | Variants | Specs | Sources | Editorial | Usable candidates | Gallery H/F/S | Notes |
|-------|---------:|-------|---------|-----------|------------------:|---------------|-------|
| bZ4X | 4 | NO dealer PDF + specs | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| bZ4X Touring | 3 | NO dealer PDF | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| C-HR+ | 3 | NO dealer PDF | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |
| Urban Cruiser | 3 | NO dealer PDF + compare | Present | Final | Gallery | ✅/✅/✅ | **100%** Approved, unpublished |

### Other published shells (risk)

| Model | Status | Sources | Gallery | Notes |
|-------|--------|---------|---------|-------|
| `byd-seal-u` | published, `import_status=draft` | Missing | Zero gallery; hero via URL only | Not in master catalog list |

### Common gaps (all existing production cars)

| Gap | Priority | Effort | Status |
|-----|----------|--------|--------|
| Missing approved Hero/Front/Side gallery attach | Critical | L | Missing |
| Missing Interior (preferred) | Medium | M | Missing |
| Missing FAQ | Medium | L | Missing (no field) |
| Missing related models | High | M | Missing |
| Missing winter_range_km (never invent) | Medium | — | Often Missing by policy |
| Missing price_nok (policy-dependent) | High | M | Missing / Blocked by display policy |
| Missing brand logos | High | S | Missing |

---

# 4 Images

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Storage-based Image Review workflow | Critical | — | Images | Complete | |
| VW+Volvo official candidate refresh | High | — | Images | Complete | Report: `VW_VOLVO_IMAGE_REFRESH_REPORT.md` |
| Approve + attach Hero/Front/Side | Critical | L | Images | In Progress | **4 Image Ready** (all finishable VW); rest of catalog open |
| Choose Hero (human) | Critical | M | Images | In Progress | Visual review + attach for ID.3/ID.4; never auto-Hero |
| Interior candidates where available | Medium | M | Images | In Progress | Present for many VW/Volvo candidates; not approved |
| Tesla official image candidates | Critical | L | Images | Missing | Media/Norge often blocked |
| EX60 replacement candidates | High | M | Images | Missing | Intentionally skipped earlier |
| Failed candidates retained as history | High | — | Images | Complete | Superseded / Download Failed hidden by default |
| Duplicate usable candidate noise | High | M | Ops | In Progress | ID.3 spam cleaned (104 rejected); replacement scrape now requires role score > 0 |
| Brand logos in CMS | High | S | Images | Missing | 3/3 active brands `logo_url=null` |
| Alt text on gallery rows | High | M | SEO | Missing | No gallery rows yet |
| Local `/images/cars/*` fallback 404 noise | Medium | S | Perf | Missing | FINAL_SITE_QA H7 still open |
| Models with no images at all | Critical | XL | Images | Missing | All non-VW/Volvo/Tesla (+ weak Tesla) |
| Incomplete galleries | Critical | L | Images | Missing | 17/17 zero `car_images` |
| Broken / failed candidates | High | M | Images | In Progress | History present; replacements queued/exhausted per model |
| Missing approvals | Critical | L | Images | Missing | `approvedCandidateCount = 0` across audited set |

### Image Review URLs (priority wave)

| Model | Image Review |
|-------|--------------|
| ID.3 | `/admin/images/531fa6cc-a163-4b9d-963e-814bff2bffba` |
| ID.4 | `/admin/images/c8c17bab-7248-46f9-8cc9-e7ed36a42706` |
| ID.7 | `/admin/images/2d799eaf-774d-4d1c-9d38-09da217efaaa` |
| ID. Buzz | `/admin/images/52e06fcd-2e61-4cd7-8916-1dcf6b841f88` |
| EX30 | `/admin/images/e491e460-4fb5-48d9-b7ce-bb87bddc4394` |
| EX40 | `/admin/images/0c67bdb4-b11d-4a69-a03b-78e8a23c5da9` |
| EC40 | `/admin/images/99406a6e-1480-4620-8932-2362d4025a0d` |
| EX90 | `/admin/images/9f43ec39-0764-42ea-a42d-53727393a32f` |
| ES90 | `/admin/images/fed4fc5c-383e-4c9d-8876-6739d84a8e76` |

---

# 5 SEO

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Root `metadataBase` + default OG/Twitter | High | — | SEO | Complete | `app/layout.tsx` |
| Homepage canonical | High | — | SEO | Complete | `/` |
| Catalog / compare / bruktbil / info / merker canonicals | High | — | SEO | Complete | |
| Model + brand JSON-LD | High | — | SEO | Complete | Model/brand detail |
| Model metadata title/description/OG image | Critical | M | SEO | In Progress | Depends on real description + hero image |
| Sitemap (indexable only) | Critical | — | SEO | Complete | Tools excluded; published cars/brands only |
| Robots disallow admin + auth | High | S | SEO | In Progress | Missing `/glemt-passord`, `/auth/` |
| Auth pages `noindex` metadata | High | S | SEO | Missing | Inherit homepage signals |
| Twitter overrides per key page | Medium | S | SEO | Missing | Mostly root Twitter only |
| Alt text | High | M | SEO | Missing | No attached galleries |
| Internal links (Merker in chrome) | Medium | S | SEO | Missing | Merker underlinked in header/footer |
| Soft-404 unknown URLs | Critical | — | SEO | Complete | Fixed |
| Default OG brand asset | High | — | SEO | Complete | `/brand/og-image.png` present |
| Icons / apple touch | High | — | SEO | Complete | Brand assets present |
| Structured data completeness when specs empty | Medium | M | SEO | In Progress | Don’t emit empty claimful fields |

---

# 6 Guides

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Used EV guide (`/bruktbil`) | High | M | Editorial | In Progress | Core guide live |
| SOH / battery checklist | High | S | Editorial | In Progress | Present; editor review |
| Buying guides library | High | XL | Content | Missing | |
| Charging guides | High | L | Content | Missing | Only homepage explainer snippets |
| Winter driving guide | Medium | L | Content | Missing | |
| Compare how-to / methodology deep-dive | Medium | M | Trust | In Progress | Covered partly on `/info` |
| News / updates | Low | XL | Content | Missing | Out of Wave 1 if catalog ships |

---

# 7 Tools

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Compare | Critical | — | Product | Complete | Needs content |
| Calculator | Critical | XL | Product | Missing | WIP page only |
| Rimeligste | Critical | L | Product | Blocked | Needs public prices |
| Verktøy hub | High | XL | Product | Missing | |
| Testdata | High | XL | Content | Missing | |
| Ladekart | High | XL | Product | Missing | |
| Search (catalog `?q=`) | High | — | Product | Complete | Home/mobile |
| Header “search” = catalog link | High | S | Product | Missing | Looks like search, isn’t |
| Favorites | Medium | M | Product | In Progress | |

**Launch recommendation:** Keep unfinished tools WIP-labeled; do **not** promise parity with old live calculator/map until built.

---

# 8 Trust

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Source policy page | Critical | — | Trust | Complete | `/info` |
| Contact email | High | — | Trust | Complete | `post@evfakta.no` |
| Social links | Medium | S | Trust | In Progress | LinkedIn URL still has `?viewAsMember=true` |
| No invented specs discipline | Critical | — | Trust | Complete | Process locked |
| No auto-publish | Critical | — | Trust | Complete | |
| Published set matches gates | Critical | M | Ops | In Progress | Public set empty (0); gates enforced via quarantine |
| Brand logos for trust/chrome | High | S | Trust | Missing | |
| Unsupported claims removed | High | — | Trust | Complete | Legacy migration report |
| Draft markers never public | Critical | L | Editorial | In Progress | Non-compliant publishes quarantined; 13 drafts remain unpublished |

---

# 9 Accessibility

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Mobile drawer focus trap / Escape / `inert` | High | M | A11y | Missing | FINAL_SITE_QA H8 |
| WIP nav badges have aria-labels | Medium | — | A11y | Complete | Per fix report |
| Image alt text on public cars | High | M | A11y | Missing | |
| Compare keyboard flows | Medium | M | A11y | In Progress | DS2 intent; needs QA pass |
| Auth forms labels/errors | Medium | S | A11y | In Progress | |
| Reduced-motion respected on polish CSS | Low | — | A11y | Complete | Home/models polish |

---

# 10 Performance

| Item | Priority | Effort | Area | Status | Notes |
|------|----------|--------|------|--------|-------|
| Next.js production build | High | — | Perf | Complete | Verified this audit |
| Catalog/compare/model `loading.tsx` | Medium | — | Perf | Complete | |
| Home/merker/bruktbil loading skeletons | Medium | M | Perf | Missing | |
| Avoid missing local car image 404s | Medium | S | Perf | Missing | |
| Image delivery via Storage WebP | High | — | Perf | Complete | Workflow |
| Middleware → proxy migration warning | Low | S | Perf | Missing | Next 16 deprecation notice only |

---

# 11 Remaining Launch Blockers

## Critical

| # | Blocker | Effort | Area | Status |
|---|---------|--------|------|--------|
| C1 | **Only 4 Image Ready models** — need ≥50 with Hero+Front+Side | L | Images | In Progress |
| C2 | **Draft markers on remaining non-VW cars** (VW finishable cleared) | L | Editorial | In Progress |
| C3 | **Published cars that fail current gates** | M | Ops | **Complete** |
| C4 | **Cannot replace live site catalog breadth** — only 3 brands active; 50-model master mostly empty | XL | Content | Missing |
| C5 | **No DNS cutover** until a Publish Ready wave exists and is QA’d | M | Ops | Blocked |
| C6 | Calculator / map / cheapest **parity gap vs old live site** if cutover expects feature parity | XL | Product | Missing |

## High

| # | Blocker | Effort | Area | Status |
|---|---------|--------|------|--------|
| H1 | Brand logos missing | S | Images | Missing |
| H2 | Tesla images + Norge energy specs incomplete | L | Content | Missing |
| H3 | Human approve path not started (0 approved image candidates) | L | Images | Missing |
| H4 | Auth/min-side SEO metadata + robots gaps | S | SEO | Missing |
| H5 | Header search affordance mismatch | S | Product | Missing |
| H6 | Mobile nav a11y incomplete | M | A11y | Missing |
| H7 | ID.3 candidate spam (100+ usable) hurts editorial throughput | M | Ops | In Progress |
| H8 | EX60 images never refreshed | M | Images | Missing |
| H9 | Related models + per-model FAQ missing | L | Content | Missing |

## Medium

| # | Item | Effort | Status |
|---|------|--------|--------|
| M1 | Favorites empty state / unfavorite on Min side | M | Missing |
| M2 | Loading skeletons outside catalog/compare | M | Missing |
| M3 | Merker underlinked in chrome | S | Missing |
| M4 | Twitter card per-page overrides | S | Missing |
| M5 | Compare/gallery thumb `onError` | S | Missing |
| M6 | Update-password session gating | S | Missing |
| M7 | LinkedIn tracking query param | S | Missing |

## Low

| # | Item | Effort | Status |
|---|------|--------|--------|
| L1 | `global-error.tsx` | S | Missing |
| L2 | Middleware proxy rename | S | Missing |
| L3 | News section | XL | Missing |
| L4 | Mini / Porsche catalog expansion | XL | Missing (not in master 50) |

---

# 12 Recommended Launch Order

## Phase A — Stop the bleeding (before any more publish)

1. **Unpublish or quarantine** `toyota-c-hr-plus`, `byd-seal-u`, and any model failing current gates (including ID.4 until draft+images fixed).  
2. Confirm Production Dashboard shows honest Launch Blocked / not Publish Ready.  
3. Do not point DNS at rebuild yet.

**Exit:** Public site either empty/honest or only gate-compliant models.

## Phase B — Wave 1 content (replace live with a *credible* core)

Target models (only when **Publish Ready**):

1. Volkswagen ID.3  
2. Volkswagen ID.4  
3. Volkswagen ID. Buzz  
4. Volvo EX30  
5. Volvo EX40  

Per model checklist:

- [ ] Draft markers removed + human Norwegian rewrite  
- [ ] Conflicts resolved or fields left empty with notes  
- [ ] Image Review: approve Hero + Front + Side (Interior if available)  
- [ ] Gallery attached; alt text set  
- [ ] `import_status = approved`  
- [ ] Production: Launch Content Ready → Publish Ready  
- [ ] Manual publish  
- [ ] Spot-check public SEO (title, description, canonical, og:image, no draft text)

**Hold for Wave 1:** ID.5, ID.7 (optional if images+editorial done), Tesla (energy/images), EX60 (images), ES90/EX90/EC40 (Wave 1b).

## Phase C — Wave 1b (same week / next)

- Volvo EC40, EX90, ES90  
- VW ID.7  
- Brand logos for VW/Volvo/Tesla  

## Phase D — Tesla wave

**COMPLETE** (locked) — see `docs/TESLA_BATCH_01.md`. Energy honesty until Tesla Norge live capture. Do not modify unless official data changes.

## Phase D2 — BMW wave

**COMPLETE** (locked) — see `docs/BMW_BATCH_01.md`. PressClub technical sheets (bmw.no live blocked here). Do not modify unless official data changes.

## Phase D3 — Audi wave

**COMPLETE** (locked) — see `docs/AUDI_BATCH_01.md`. Q4/Q6/A6/e-tron GT **100%**; Q8 NOT_READY (MediaCenter albums unavailable). Do not modify unless official data changes.

## Phase D4 — Kia wave

**COMPLETE** (locked) — see `docs/KIA_BATCH_01.md`. EV2/EV3/EV6/EV9 **100%**; EV4/EV5/PV5 NOT_READY (no Image Ready). Do not modify unless official data changes.

## Phase D5 — Hyundai wave

**COMPLETE** (locked) — see `docs/HYUNDAI_BATCH_01.md`. Kona Electric / Ioniq 5 / Ioniq 6 / Ioniq 9 / INSTER **100%**; Ioniq 9 Varebil / Staria Electric / Ioniq 3 NOT_READY. Do not modify unless official data changes.

## Phase D6 — Toyota wave

**COMPLETE** (locked) — see `docs/TOYOTA_BATCH_01.md`. bZ4X / bZ4X Touring / C-HR+ / Urban Cruiser **100%**. Commercial LCV / Hilux BEV not finished.

## Phase D7 — BYD wave

**COMPLETE** (locked) — see `docs/BYD_BATCH_01.md`. Dolphin / Atto 3 / Seal / Seal U / Sealion 7 / Tang **100%**. Han / EVO NOT_READY.

## Phase D8 — Mercedes-Benz wave

**COMPLETE** (locked) — see `docs/MERCEDES_BENZ_BATCH_01.md` (re-verified 2026-08-06). CLA / CLA Shooting Brake / GLB / GLC / EQS / EQS SUV / EQE SUV / G-Klasse Electric / EQA **100%**. C-Klasse Electric NOT_READY (Image Ready; NO dims stored, gallery blocked). Await human go-ahead before Ford.

## Phase E — Master catalog expansion

Batch remaining brands from `MASTER_CATALOG_MODELS` **only after human go-ahead** (Ford next when Mercedes-Benz approved — do not start Polestar until prior brand complete).  
Mini/Porsche only after explicit catalog expansion beyond the first 50.

## Phase F — Tool parity (can trail DNS if communicated)

1. Calculator  
2. Rimeligste (requires price policy)  
3. Ladekart  
4. Testdata  
5. Verktøy hub  

Until then: keep WIP badges; do not market them as live.

## Phase G — Cutover

| Gate | Required |
|------|----------|
| ≥5 Publish Ready models live | Yes |
| Homepage/catalog show real images | Yes |
| No draft markers on published pages | Yes |
| Sitemap only published | Yes |
| QA pass on mobile + desktop | Yes |
| Old→new slug plan documented | Yes |
| Rollback plan | Yes |

---

## Responsible areas (RACI shorthand)

| Area | Owns |
|------|------|
| Editorial | Norwegian copy, drafts, FAQ/home/info/bruktbil |
| Content / Research | Specs, variants, sources, conflicts |
| Images | Image Review approvals, logos, alt text |
| SEO | Metadata, robots, sitemap QA, structured data |
| Product / Eng | Tools, a11y, perf polish (only when prioritized) |
| Ops / Launch | Unpublish bad rows, publish wave, DNS cutover |

---

## Verification log (this audit)

```text
npm run lint   → pass (tsc --noEmit)
npm test       → 108 pass / 0 fail
npm run build  → pass
```

Live DB snapshot written to `docs/EVFAKTA_V1_LAUNCH_AUDIT_SNAPSHOT.json` (read-only).

**No commit. No push. No code/CMS/database changes for product.**

---

## Bottom line

| Layer | Ready to replace live site? |
|-------|-----------------------------|
| Software platform | **Yes** (with known polish items) |
| Image production system | **Yes** |
| Editorial/CMS workflow | **Yes** |
| Launch content | **No** |
| Image approvals | **No** |
| Catalog coverage | **No** |
| Tool parity | **No** |

**Next production action:** Mercedes-Benz COMPLETE (re-verified 2026-08-06 — CLA / CLA SB / GLB / GLC / EQS / EQS SUV / EQE SUV / G-Klasse Electric / EQA 100%; C-Klasse Electric NOT_READY Image Ready). Volkswagen + Volvo + Tesla + BMW + Audi + Kia + Hyundai + Toyota + BYD + Mercedes-Benz locked. Await human go-ahead before starting Ford. No commit / no push / no DNS / no auto-publish.
