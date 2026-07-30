# Kia batch 01

**Date checked:** 2026-07-30  
**Brand:** Kia  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official kia.no / Crystallize press assets → Storage gallery → visual verify  
**Production script:** `scripts/complete-kia-100.ts`  
**Sources primary:** Kia Bil Norge kundeprislister (`media.crystallize.com` / kia.no prislister)

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| EV2 | 100% | YES | YES | YES | Approved, unpublished |
| EV3 | 100% | YES | YES | YES | Approved, unpublished |
| EV6 | 100% | YES | YES | YES | Approved, unpublished |
| EV9 | 100% | YES | YES | YES | Approved, unpublished |
| EV4 | 86% | NO | NO | NO | **NOT_READY** |
| EV5 | 86% | NO | NO | NO | **NOT_READY** |
| PV5 Passenger | 86% | NO | NO | NO | **NOT_READY** |

## Completion definition

Finishable models (EV2, EV3, EV6, EV9) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified official assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Kia Norge pricelist retained as `source_url`
- Specs counted from car **or** variants
- Documented honesty for DC kW / 10–80 (not in NO pricelist), winter range, heat-pump boolean where trim-dependent, type-approval asterisks
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Blocked:

- **EV4 = NOT_READY** — full NO pricelist specs stored; Image Ready blocked (no verified Front+Side without wrong-model assets)
- **EV5 = NOT_READY** — specs + GT variant from NO pricelists; Image Ready blocked (no verified Side)
- **PV5 Passenger = NOT_READY** — specs from NO pricelist; Image Ready blocked (studio front only)

Out of scope this batch:

- **Niro EV** — kia.no page states «En æra er over» (discontinued BEV) — not created

## Sources

1. Prisliste Kia EV2 — https://media.crystallize.com/bos-ecom-prod/26/6/1/ba50001a/ev2-2027-prisliste-02-07-2026.pdf  
2. Prisliste Kia EV3 — https://media.crystallize.com/bos-ecom-prod/26/5/30/021bd6c4/2027-kia-norge-ev3_kundeprisliste-juni-30-06-2026.pdf  
3. Prisliste Kia EV4 — https://media.crystallize.com/bos-ecom-prod/26/1/14/95/2026-kia-norge-ev4_sz1e_kundeprisliste-jan26-10-01-2026.pdf  
4. Prisliste Kia EV5 — https://media.crystallize.com/bos-ecom-prod/26/2/5/67bf1e60/2026-kia-norge-ev5_ov_kundeprisliste-mars-01-03-2026.pdf  
5. Prisliste Kia EV5 GT — https://media.crystallize.com/bos-ecom-prod/26/5/8/03b1c52f/2026-kia-norge-ev5_ov_gt_kundeprisliste-june-01-06-2026.pdf  
6. Prisliste Kia EV6 — https://media.crystallize.com/bos-ecom-prod/26/1/5/12/2026-kia-norge-ev6_cv_pe_kundeprisliste-januar-01-01-2026.pdf  
7. Prisliste Kia EV6 GT — https://media.crystallize.com/bos-ecom-prod/26/1/5/13/2026-kia-norge-ev6-gtcv-pe_kundeprisliste-01-01-2026.pdf  
8. Prisliste Kia EV9 — https://media.crystallize.com/bos-ecom-prod/26/1/26/d8b590a3/ev9-prisliste-12-02-2026.pdf  
9. Prisliste Kia EV9 GT — https://media.crystallize.com/bos-ecom-prod/26/1/5/15/2026-kia-norge-ev9_gt_mv_kundeprisliste-01-01-2026.pdf  
10. Prisliste Kia PV5 Passenger — https://media.crystallize.com/bos-ecom-prod/26/4/18/6af8f04f/2026-kia-norge-pv5-_passenger_lr_kundeprisliste-01-01-2026.pdf  
11. Market: https://www.kia.no · https://www.kia.no/prislister  

**Not used as facts:** EV-Database, dealer blogs, guessed DC kW, Google/Pinterest/AI photos, wrong-model crystallize assets.

## Image notes

- Every attach used **visual verification** (reject wrong-model tiles and non-vehicle assets).
- EV2: Front/Side/Rear/Interior from official motorshow / press set (Frost Blue).
- EV3: Front (NO-plated hero), Side (studio `_0060`), Interior (cockpit); rear documented missing.
- EV6: Front (studio), Side (crop from official FCA press plate), Rear + Interior from kia.no press set.
- EV9: Front (NO plate), Side (true profile), Interior (GT-Line cabin); rear documented missing.
- EV4 / EV5 / PV5: no verified Front+Side pair — NOT_READY.

## Variants stored

| Model | Variants |
|-------|----------|
| EV2 | Standard Range Air FWD (default), Long Range Exclusive FWD, Long Range GT Line FWD |
| EV3 | Standard Range Air FWD (default), Long Range Exclusive FWD, Long Range Exclusive AWD |
| EV4 | Standard Range Air FWD (default), Long Range Exclusive FWD, Long Range GT Line FWD |
| EV5 | Long Range FWD (default), Long Range AWD, GT AWD |
| EV6 | Standard Range Active RWD (default), Long Range Exclusive RWD, Long Range Exclusive AWD, GT AWD |
| EV9 | Long Range Air RWD 7s (default), Air AWD 7s, GT Line AWD 7s, GT AWD 6s |
| PV5 Passenger | Active FWD (default), Exclusive FWD, Exclusive Plus FWD |

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| EV2 | NO tech table + motorshow gallery F/S/R/I; DC + heat-pump honesty |
| EV3 | NO tech table + studio side + NO hero; rear honesty; DC + heat-pump honesty |
| EV6 | NO tech table + GT; gallery F/S/R/I; DC honesty |
| EV9 | NO tech table + GT; gallery F/S/I; rear + DC honesty |
| EV4 / EV5 / PV5 | Specs only — Image Ready blocked |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.

Kia production batch complete (finishable locked; EV4/EV5/PV5 NOT_READY).
