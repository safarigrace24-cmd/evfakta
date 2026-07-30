# Audi batch 01

**Date checked:** 2026-07-30  
**Brand:** Audi  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Audi MediaCenter → Storage gallery → visual verify  
**Production script:** `scripts/complete-audi-100.ts`  
**Sources primary:** Audi Norge pricelists (`media.audi.com` …/prislister/)  
**Extras:** A6 MediaCenter eTD for cargo/frunk + DC; Q4 body dims/cargo from Audi Media technical data (EE) where NO pricelist omits mm/l

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| Q4 e-tron | 100% | YES | YES | YES | Approved, unpublished |
| Q6 e-tron | 100% | YES | YES | YES | Approved, unpublished |
| A6 e-tron | 100% | YES | YES | YES | Approved, unpublished |
| e-tron GT | 100% | YES | YES | YES | Approved, unpublished |
| Q8 e-tron | 86% | NO | NO | NO | **NOT_READY** |

## Completion definition

Finishable models (Q4 e-tron, Q6 e-tron, A6 e-tron, e-tron GT) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified MediaCenter assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Audi Norge pricelist retained as `source_url`
- Specs counted from car **or** variants
- Documented honesty for winter range, heat-pump boolean, Q4 DC kW gap, Q4/GT tow kg gap, missing interior where applicable
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Blocked:

- **Q8 e-tron = NOT_READY** — full NO pricelist specs stored, but Image Ready blocked (MediaCenter Q8 albums unavailable here); no invented images; `needs_review`

## Sources

1. Prisliste Audi Q4 e-tron — https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q4-e-tron.pdf  
2. Prisliste Audi Q6 e-tron — https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q6-etron.pdf  
3. Prisliste Audi A6 e-tron — https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-A6-etron.pdf  
4. Prisliste Audi e-tron GT — https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-e-tron-GT.pdf  
5. Prisliste Audi Q8 e-tron — https://media.audi.com/is/content/audi/country/no/assets/prislister/Prisliste-Audi-Q8-etron.pdf  
6. A6 Sportback e-tron eTD (cargo 502 l / frunk 27 l / DC 270 kW) — Audi MediaCenter car motorization PDF  
7. Press images — Audi MediaCenter albums (Q4 Sportback 3125, Q6 SUV 2509, A6 Sportback 2593 / Avant 2592, S e-tron GT 2536)  
8. Market pointer: https://www.audi.no (live model pages often 503 in this environment)

**Not used as facts:** EV-Database, dealer blogs, guessed DC for Q4, Wikimedia user photos for Q8, ICE albums (TT/R8) mislinked by numeric slug collision.

## Image notes

- Every attach used **visual verification** (reject TT/R8/S3 and unrelated press tiles).
- Q4: Front/Side/Rear from Sage green MediaCenter set; interior documented missing (album mixed PPE cockpit).
- Q6: Front (Glacier white), Side (charging three-quarter), Rear (SUV/Sportback duo), Interior (Digital Stage).
- A6: Front (NO-plated Sportback), Side (Avant MediaCenter), Rear (NO winter overlook), Interior (PPE cockpit from Avant album).
- e-tron GT: Front/Side/Rear from S e-tron GT album; interior documented missing.
- Q8: no verified official gallery — NOT_READY.

## Variants stored

| Model | Variants |
|-------|----------|
| Q4 e-tron | quattro (default), quattro Performance, Sportback quattro |
| Q6 e-tron | quattro (default), SQ6 e-tron quattro |
| A6 e-tron | Sportback e-tron quattro (default), Avant e-tron quattro, S6 Sportback, S6 Avant |
| e-tron GT | S e-tron GT (default), RS e-tron GT, RS e-tron GT Performance |
| Q8 e-tron | 50 quattro (default), 55 quattro, SQ8 e-tron quattro |

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| Q4 e-tron | Dims/cargo from Audi Media tech; DC + tow honesty; interior honesty |
| Q6 e-tron | Full NO tech table (DC 270/21, tow 2400, 526/64 cargo) |
| A6 e-tron | NO WLTP/tow + eTD cargo/DC; MediaCenter gallery |
| e-tron GT | Full NO tech table (DC 320/18); tow + interior honesty |
| Q8 e-tron | Specs only — Image Ready blocked |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.

Audi production batch complete (finishable locked; Q8 NOT_READY).
