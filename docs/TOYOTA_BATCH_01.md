# Toyota batch 01

**Date checked:** 2026-07-30  
**Brand:** Toyota  
**Batch status:** **COMPLETE**  
**Quality standard:** Review Assistant completion **100%** for Launch Ready / Publish Ready  
**Publish rule:** `is_published=false` for all — no auto-publish  
**Images:** Toyota Norge / Scene7 (`scene7.toyota.eu`) → Storage gallery → visual verify  
**Production script:** `scripts/complete-toyota-100.ts`  
**Sources primary:** Toyota Norge forhandler prislister (PDF) + spesifikasjonssider + modellsammenligning

## Final status

| Model | Completion | Image Ready | Launch Ready | Publish Ready | Status |
|-------|:----------:|:-----------:|:------------:|:-------------:|--------|
| bZ4X | 100% | YES | YES | YES | Approved, unpublished |
| bZ4X Touring | 100% | YES | YES | YES | Approved, unpublished |
| C-HR+ | 100% | YES | YES | YES | Approved, unpublished |
| Urban Cruiser | 100% | YES | YES | YES | Approved, unpublished |

## Completion definition

Finishable models (bZ4X, bZ4X Touring, C-HR+, Urban Cruiser) each have:

- Review Assistant completion **100%**
- Hero + Front + Side gallery (Rear / Interior where verified Scene7 assets existed)
- Editorial finalized (no Draft markers)
- FAQ + charging / winter / daily / long-trip notes in `score_notes`
- Official Toyota Norge forhandler prisliste retained as `source_url`
- Specs counted from car **or** variants
- Documented honesty for winter range and heat-pump boolean (not confirmed as single true/false in retrieved material)
- `import_status=approved`
- Publish gates pass including ≥95% completion threshold
- `is_published=false` (intentional)

Also sold commercially in Norway but **not finished** in this passenger batch (no invented shells):

- **Proace Electric / Proace City Electric / similar LCV** — commercial vans; not completed here
- **Hilux BEV** — brochure present on toyota.no; passenger-mission out of scope; incomplete for launch without full NO tech + Image Ready pass

## Sources

1. Forhandler prisliste Toyota bZ4X — https://forhandler.toyota.no/pdf/toyota-bz4x  
2. Forhandler prisliste Toyota bZ4X Touring — https://forhandler.toyota.no/pdf/bz4x-touring  
3. Forhandler prisliste Toyota C-HR+ — https://forhandler.toyota.no/pdf/toyota-c-hr-plus  
4. Forhandler prisliste Toyota Urban Cruiser — https://forhandler.toyota.no/pdf/urban-cruiser  
5. Modellside bZ4X — https://www.toyota.no/nybil/bz4x  
6. Spesifikasjoner bZ4X — https://www.toyota.no/nybil/bz4x/specifications  
7. Modellside bZ4X Touring — https://www.toyota.no/nybil/bz4x-touring  
8. Modellside C-HR+ — https://www.toyota.no/nybil/toyota-c-hr-plus  
9. Modellside Urban Cruiser — https://www.toyota.no/nybil/urban-cruiser  
10. Modellsammenligning — https://www.toyota.no/modellsammenligning  
11. Press/product images — Toyota Scene7 `scene7.toyota.eu/is/image/toyotaeurope/…`  
12. Market pointer: https://www.toyota.no

**Not used as facts:** EV-Database, dealer blogs, guessed peak DC / winter range / heat-pump boolean, mislabeled Scene7 tiles (wrong model / console-only as cabin / skateboard chassis).

## Image notes

- Every attach used **visual verification** (reject wrong-model tiles, chassis diagrams, console-only as cabin).
- bZ4X: Front 3/4 charging + clean side profile + winter rear + cabin interior.
- bZ4X Touring: Front lifestyle + side-capable 3/4 + rear 3/4 charging + cabin (Touring page asset).
- C-HR+: Front coastal + side-capable lifestyle 3/4 + rear coastal + cabin (CHRP page asset).
- Urban Cruiser: Front urban + true side + rear 3/4 charging + cabin (UC page asset).

## Variants stored

| Model | Variants |
|-------|----------|
| bZ4X | Active FWD (default), Active Tech FWD, Active Tech AWD, Executive AWD |
| bZ4X Touring | Active Tech FWD (default), Active Tech AWD, Executive AWD |
| C-HR+ | Active FWD (default), Active AWD, Executive AWD |
| Urban Cruiser | Active 49 kWh FWD (default), Active 61 kWh FWD, Active 61 kWh AWD |

## 100% pass notes (2026-07-30)

| Model | Closed gaps |
|-------|-------------|
| bZ4X | NO dealer PDF + specs dims/cargo/tow; DC 150; gallery front+side+rear+interior; heat-pump honesty |
| bZ4X Touring | NO dealer PDF 74,7/71 kWt + 669 l cargo; DC 150; full gallery |
| C-HR+ | Upgraded prior draft shell; NO dealer PDF 77/72; DC 150; fixed mislabeled side; rear+interior |
| Urban Cruiser | NO dealer PDF 49/61 packs; DC 67 from modellsammenligning; rear+interior |

## Next manufacturer

This brand is **COMPLETE** and locked. Do not modify unless official data changes.

**Live queue:** see `docs/EVFAKTA_PRODUCTION_STATUS.md` — next brand is **BYD** (await human go-ahead).

Toyota production batch complete (passenger finishable locked).
