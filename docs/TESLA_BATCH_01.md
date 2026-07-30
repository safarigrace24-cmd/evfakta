# Tesla batch 01

**Date checked:** 2026-07-26 (import) · **100% pass:** 2026-07-30  
**Brand:** Tesla  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Official `digitalassets.tesla.com` → Storage gallery → visual verify  
**Production script:** `scripts/complete-tesla-100.ts`  
**Batch JSON:** `data/catalog-batch-01-tesla.json`

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| Model 3 | 100% | YES | YES | YES | Approved, unpublished |
| Model Y | 100% | YES | YES | YES | Approved, unpublished |
| Model S | 100% | YES | YES | YES | Approved, unpublished |
| Model X | 100% | YES | YES | YES | Approved, unpublished |

## Completion definition

Finishable models (Model 3, Model Y, Model S, Model X) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified official assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Tesla Owner's Manual Dimensions retained as primary source for mm / cargo / frunk
- Specs counted from car **or** variants (drivetrain on variants)
- Documented honesty for energy gaps: Tesla Norge live pages returned **HTTP 403** in this environment — battery / WLTP / AC–DC kW **not invented**
- Documented honesty for chemistry, consumption, dual/market towing, and Model X 5/6/7 seats
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

## Sources

1. Tesla Owner's Manual — Model 3 Dimensions — https://www.tesla.cn/ownersmanual/model3/en_pr/GUID-56562137-FC31-4110-A13C-9A9FC6657BF0.html  
2. Tesla Owner's Manual — Model 3 Trailer Towing — https://www.tesla.cn/ownersmanual/model3/en_pr/GUID-BD9A38D5-4410-45A3-8337-BDF7342750F3.html  
3. Tesla Owner's Manual — Model Y Dimensions — https://www.tesla.cn/ownersmanual/modely/en_pr/GUID-1E76B638-7B12-4D9A-8767-94B7F1E92A0E.html  
4. Tesla Owner's Manual — Model Y Towing — https://www.tesla.cn/ownersmanual/modely/en_pr/GUID-F5C80FF5-8DE3-4750-8BAF-0DCC0CFA0C5C.html  
5. Tesla Owner's Manual — Model S Dimensions — https://www.tesla.cn/ownersmanual/models/en_pr/GUID-91E5877F-3CD2-4B3B-B2B8-B5DB4A6C0A05.html  
6. Tesla Owner's Manual — Model X Dimensions — https://www.tesla.cn/ownersmanual/modelx/en_pr/GUID-91E5877F-3CD2-4B3B-B2B8-B5DB4A6C0A05.html  
7. Tesla Owner's Manual — Model X Towing — https://www.tesla.cn/ownersmanual/modelx/en_pr/GUID-7A684E2F-D43E-4A0E-AD21-811B04CE53BB.html  
8. Press / product images — `digitalassets.tesla.com` (official Tesla CDN)  
9. Market pointer (blocked live): https://www.tesla.com/no_NO/model3 · `/modely` · `/models` · `/modelx`

**Not used as facts:** EV-Database, EVKX, NAF/Motor, blogs, guessed WLTP/battery/DC.

## Image notes

- Every attach used **visual verification** (front / true side / rear / interior).
- Model 3: Exterior Hero (front), Order Hero Global (true side), Interior Hero. Rear documented missing.
- Model Y: Main Hero (front), Premium Redesigned carousel (true side), Social CN (rear), Interior Hero.
- Model S: Main Hero (front), Exterior Hero Global (true side / aero), Interior Hero. Rear documented missing.
- Model X: Main Hero (front), Exterior Hero Global (true side / aero), Exterior RHD (rear), Interior Hero.

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| Model 3 | Manual dims/cargo/frunk/connectors/heat_pump; 750/1000 kg tow honesty; energy honesty (NO 403); gallery front+side+interior |
| Model Y | Premium 5-seater dims/cargo/frunk; market tow honesty; energy honesty; gallery front+side+rear+interior |
| Model S | Manual dims/cargo/frunk; tow not listed honesty; energy honesty; gallery front+side+interior |
| Model X | Manual dims/cargo/frunk; seats 5–7 honesty; market tow honesty; energy honesty; gallery front+side+rear+interior |

## Energy / publish caveat

Launch Ready / Publish Ready here means **gates + ≥95% completion** with documented honesty where Tesla Norge could not be confirmed live. Before intentional public publish of energy claims, a human should re-capture per-variant battery / WLTP / DC from Tesla Norge or CoC and replace honesty gaps with verified numbers.

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead). Do not follow outdated “do not start …” stop lines in older batch reports.
