# BYD batch 01

**Date checked:** 2026-08-05  
**Brand:** BYD  
**Batch status:** **COMPLETE** (finishable passenger models)  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official byd.no / Sanity CDN → Storage gallery → visual verify  
**Production script:** `scripts/complete-byd-100.ts`  
**Sources primary:** byd.no modellsider + Sanity `specifications` + RSA prisliste (iPaper) + tekniske spesifikasjoner (iPaper)

This is an editorial recommendation only. It does not change database approval or publication values.

---

# Official Norwegian lineup checked

Source of truth: [https://byd.no/modeller](https://byd.no/modeller) (checked 2026-08-05).

| Listing on byd.no | Classification |
|-------------------|----------------|
| EVO 4x4 | ACTIVE passenger — **NOT_READY** (incomplete structured dims) |
| Sealion 7 4x4 | ACTIVE passenger — **Publish Candidate** |
| Seal U | ACTIVE passenger — **Publish Candidate** |
| Seal 4x4 | ACTIVE passenger — **Publish Candidate** |
| Dolphin | ACTIVE passenger — **Publish Candidate** |
| Tang 4x4 Long range | ACTIVE passenger — **Publish Candidate** |
| Atto3 | ACTIVE passenger — **Publish Candidate** |
| Han 4x4 | ACTIVE passenger — **NOT_READY** (incomplete structured specs + images) |
| eTP3 | COMMERCIAL — excluded from passenger finish |

# Active models

Finishable at 100% (Approved, Image Ready, Launch Ready, Publish Ready, unpublished):

- Dolphin
- Atto 3
- Seal
- Seal U
- Sealion 7
- Tang

# Upcoming models

None created as Publish Ready from seed-only names without NO lineup presence:

- **Dolphin Surf** — not on current byd.no modeller list
- **Atto 2** — not on current byd.no modeller list

# Discontinued models

None created as active new cars in this batch.

# Commercial vehicles excluded or separated

- **eTP3** — commercial van on byd.no; not finished in passenger catalogue

# Sources

1. Modelloversikt — https://byd.no/modeller  
2. Dolphin — https://byd.no/modeller/dolphin (+ Sanity specifications; DC 110 kW locale; teknisk iPaper)  
3. Atto 3 — https://byd.no/modeller/atto3 (+ Sanity specifications; DC 80 kW modelltekst)  
4. Seal 4x4 — https://byd.no/modeller/seal-4x4 (+ Sanity specifications; DC 150 kW modelltekst)  
5. Seal U — https://byd.no/modeller/seal-u (+ Sanity specifications; DC 140 kW / tilhenger 1 300 kg)  
6. Sealion 7 — https://byd.no/modeller/sealion7 (+ Sanity specifications; DC 230 kW; varmepumpe)  
7. Tang 4x4 — https://byd.no/modeller/tang-4x4 (+ Sanity specifications; tilhenger 1 500 kg)  
8. Han 4x4 — https://byd.no/modeller/han-4x4 (USP only — insufficient)  
9. EVO 4x4 — https://byd.no/modeller/evo-4x4 (USP only — dims gap)  
10. RSA prisliste — https://viewer.ipaper.io/rsa-no/byd/byd-prisliste/  
11. Garantibok — https://viewer.ipaper.io/rsa-no/byd/byd-garantibok-seal-seal-u-dolphin-tang-4x4-sealion-7-atto-3/  
12. Press/product images — `cdn.sanity.io` assets linked from byd.no (copied to EVFAKTA Storage; not hotlinked publicly)

**Not used as facts:** EV-Database, dealer blogs, guessed peak DC / winter range, AI images as official Image Ready, mislabeled Sanity tiles (e.g. EVO badge on Sealion page, Seal U interior on Sealion page, Blade battery as exterior).

# Variants

| Model | Variants stored |
|-------|-----------------|
| Dolphin | Comfort (default) |
| Atto 3 | Design (default) |
| Seal | Excellence AWD (default) |
| Seal U | Design (default) |
| Sealion 7 | Excellence AWD 91,3 kWh (default; 82,5 kWh mentioned on page without full separate Sanity block — not invented) |
| Tang | Long Range AWD (default) |
| Han | placeholder undokumentert — NOT_READY |
| EVO | Excellence AWD USP shell — NOT_READY |

# Specifications

Stored from official NO Sanity/modelltekst only. Notable honesty:

- Consumption unit normalization where Sanity stored Wh/km or kWh/10 km
- Dolphin forbruk 1,59 → 15,9 kWh/100 km (documented)
- Seal bagasje: Sanity 400 l vs marketing 485 l — 400 stored; frunk 72 l from modelltekst
- Atto 3 bagasje: seatsUp 555 vs marketing/maxTrunk 440 — 555 stored; conflict documented
- Tang: peak DC kW missing; torque 350 vs 350+350 conflict — torque left empty
- Sealion 7: only 91,3 kWh AWD fully tabulated in this run
- Usable kWh not invented where only total published

# Editorial

Norwegian Bokmål packages for all finishable models: description, pros, cons, suitable_for, score_notes topics (hvem / vinter / lading / daglig / langtur), FAQ. Zero `Draft – Requires editor review` markers on finishable models.

# Images

Visual checklist applied before Storage attach:

| Model | Front | Side | Rear | Interior |
|-------|-------|------|------|----------|
| Dolphin | ✅ | ✅ (side-capable 3/4) | ✅ | ✅ |
| Atto 3 | ✅ | ✅ | ✅ | documented missing |
| Seal | ✅ | ✅ (side-capable 3/4) | ✅ | ✅ |
| Seal U | ✅ | ✅ (side-capable 3/4) | ✅ | ✅ |
| Sealion 7 | ✅ | ✅ | ✅ (open hatch) | documented missing (wrong-model assets rejected) |
| Tang | ✅ | ✅ | ✅ | documented missing |

# Honest gaps

- Winter range never stored as vehicle fact
- Heat pump boolean only where explicitly confirmed (Sealion 7, Tang, EVO FAQ); others documented honesty
- V2G never claimed; V2L noted where official
- Han / EVO remain NOT_READY
- eTP3 commercial excluded
- Dolphin Surf / Atto 2 not on NO lineup — not created

# NOT_READY models

| Model | Exact blocker |
|-------|---------------|
| Han | No structured Sanity specifications (dims/battery/consumption); only USP range band; only 2 images — cannot reach Image Ready without guessing |
| EVO | USP present (74,8 kWh / 470 km / 443 hk / DC 220 kW / tilhenger 1 500 kg / varmepumpe) but structured dimension/consumption table not extractable in this run — not Publish Ready |
| eTP3 | Commercial — out of passenger finish scope |
| Dolphin Surf / Atto 2 | Not on current official Norwegian modeller list |

# EVFAKTA Editorial Decision

| Model | Recommendation |
|-------|----------------|
| Dolphin | **Publish Candidate** |
| Atto 3 | **Publish Candidate** |
| Seal | **Publish Candidate** |
| Seal U | **Publish Candidate** |
| Sealion 7 | **Publish Candidate** |
| Tang | **Publish Candidate** |
| Han | **Not Ready** |
| EVO | **Await Official Documentation** (dims table) + Image Ready |
| eTP3 | **Hold for Review** (commercial separation) |

This is an editorial recommendation only. It does not change database approval or publication values.

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| Dolphin | 100% | YES | YES | YES | Approved, unpublished |
| Atto 3 | 100% | YES | YES | YES | Approved, unpublished |
| Seal | 100% | YES | YES | YES | Approved, unpublished |
| Seal U | 100% | YES | YES | YES | Approved, unpublished |
| Sealion 7 | 100% | YES | YES | YES | Approved, unpublished |
| Tang | 100% | YES | YES | YES | Approved, unpublished |
| Han | 70% | NO | NO | NO | NOT_READY |
| EVO | 73% | NO | NO | NO | NOT_READY |

## Next manufacturer

This brand batch is **COMPLETE** for finishable passenger models. Live queue: see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **Mercedes-Benz** (await human approval of BYD).
