# EVFAKTA V1.0 Launch Master Checklist

**Role:** Editorial Production Manager (production launch preparation)  
**Audit date:** 2026-07-28 (initial) · **Last production update:** 2026-07-28  
**Evidence:** `docs/EVFAKTA_V1_LAUNCH_AUDIT_SNAPSHOT.json` · Phase 1 reports below  
**Verify this pass:** `npm run lint` ✅ · `npm test` (111) ✅ · `npm run build` ✅  
**Last production update:** 2026-07-28 — Volkswagen batch COMPLETE under ≥95% Launch Ready standard

---

## Quality standard (Launch / Publish Ready)

| Rule | Value |
|------|------:|
| Minimum Review Assistant completion | **95%** |
| Preferred completion | **100%** |
| Below 95% | Not Launch Ready / Not Publish Ready |
| Editorial confidence | Re-review any field &lt;90%; no 55% draft editorial on launch models |
| Images | Approved Hero + Front + Side (Rear/Interior when available) |

## Progress dashboard (live)

| Metric | Value | Target |
|--------|------:|-------:|
| Progress % (published launch-ready / 50) | **0%** | 100% |
| Cars in DB | 17 | ≥50 published |
| Published (public) | **0** | ≥50 |
| `import_status = approved` | **4** | ≥50 |
| Draft markers remaining | **~10** (non-VW remain) | 0 |
| Image Ready (Hero+Front+Side gallery) | **4** | ≥50 |
| Zero `car_images` gallery | **13 / 17** | 0 |
| Remaining guides (priority set) | 8 | 0 |
| Remaining launch blockers | See §9 | 0 |
| Active brand logos | 0 / 3 | 3 / 3 |

### Phase 1 — Finish existing brands

| Brand | Status | Notes |
|-------|--------|-------|
| Volkswagen | **COMPLETE** | ID.3 95% · ID.4 97% · ID.7 95% · ID. Buzz 97% Launch/Publish Ready (unpublished). ID.5 NOT_READY (32%). See `docs/VOLKSWAGEN_BATCH_01.md` |
| Volvo | Not started | Await human go-ahead |
| Tesla | Not started | After Volvo |

### Production batches completed

| Batch | Report | Image Ready | Published |
|-------|--------|:-----------:|:---------:|
| VW ID.3 | `docs/PHASE1_VOLKSWAGEN_ID3_PRODUCTION.md` | YES (no interior) | No |
| VW ID.4 | `docs/PHASE1_VOLKSWAGEN_ID4_PRODUCTION.md` | YES (+ interior) | No |
| VW ID.7 | `docs/PHASE1_VOLKSWAGEN_ID7_PRODUCTION.md` | YES (no interior) | No |
| VW ID. Buzz | `docs/PHASE1_VOLKSWAGEN_ID_BUZZ_PRODUCTION.json` | YES (+ interior) | No |
| VW brand rollup | `docs/VOLKSWAGEN_BATCH_01.md` | 4/4 finishable | No |

### Ops actions this pass

- Quarantined non-compliant publishes: `toyota-c-hr-plus`, `byd-seal-u`, `volkswagen-id-4` → `is_published=false`
- Throttled image-role replacement spam: typed roles now require URL role-score > 0 (`lib/admin/image-role-replacement.ts`)

---

## Executive verdict

**EVFAKTA cannot replace the live website yet.**

Software (CMS, Design System 2.0, Image Review, Research, publish gates) is largely **Complete**.  
Launch is blocked by **content, images, approvals, and catalog coverage**.

**Critical truth:** Public catalog is empty (0 published). Volkswagen finishable models meet ≥95% Review Assistant completion and are Launch/Publish Ready content-wise, awaiting intentional publish. ID.5 remains NOT_READY.

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
| Toyota | 2 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | `toyota-bz4x` |
| BMW | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 3 |
| Audi | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 2 |
| Kia | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 3 |
| Hyundai | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 3 |
| BYD | 3 | 1 | 1 | 0 | 0 | 0 | 0 | 1 | Seal, Atto 3, Sealion 7 (`byd-seal-u` is non-master) |
| Mercedes-Benz | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | all 3 |
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
| Model 3 | 4 | Partial (Norge blocked) | Present | Draft | 0 | ❌/❌/❌ | Closest Tesla; energy gaps |
| Model Y | 3 | Shell / cleared unsourced | Present | Draft | 0 | ⚠/`image_url` only | NOT_READY |
| Model S | 2 | Shell | Present | Draft | 0 | ❌/❌/❌ | NOT_READY |
| Model X | 2 | Shell | Present | Draft | 0 | ❌/❌/❌ | NOT_READY |

### Other published shells (risk)

| Model | Status | Sources | Gallery | Notes |
|-------|--------|---------|---------|-------|
| `toyota-c-hr-plus` | published, `import_status=draft` | Missing | Zero gallery; hero via URL only | Not production-batch quality |
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

## Phase D — Tesla wave (after Norge/manual sources)

- Model 3 first when energy figures + official images exist  
- Then Y / S / X  

## Phase E — Master catalog expansion

Batch remaining brands from `MASTER_CATALOG_MODELS` (BMW → Cupra/Peugeot).  
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

**Next production action:** Volkswagen batch complete. Await human go-ahead before starting Volvo. No commit / no push / no DNS / no auto-publish.
