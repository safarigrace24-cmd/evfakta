# EVFAKTA Final Cutover QA

**Date:** 2026-07-26  
**Scope:** Public rebuild vs live `https://www.evfakta.no`  
**Method:** Live HTML capture + local `localhost:3000` HTML/CSS audit; responsive verified via CSS breakpoints and page structure (no DNS/publish).  
**Rules honored:** No CMS workflow changes, no redesign pass, no commit/push, no publish, no DNS change.

---

## Pages tested

| Surface | Live | Local rebuild |
|---------|------|----------------|
| Homepage `/` | Yes | Yes |
| Catalog `/modeller` | Yes (client-loaded) | Yes |
| Model `/modeller/volkswagen-id-4` | Yes (variant-style live URLs differ) | Yes |
| Brands `/merker` | Live 404 / different IA | Yes |
| Brand `/merker/volkswagen` | N/A on live path | Yes |
| Compare `/sammenlign` | Yes | Yes |
| Loading `/modeller` (`loading.tsx`) | N/A | Yes (“Laster modeller…”) |
| Stub tools (`/kalkulator`, `/rimeligste`, …) | Live complete tools | Routes kept; **hidden from nav** |
| Admin `/admin` | N/A | Spot-check: remains light `theme-admin` |

**Breakpoints checked (CSS + layout rules):** 375px, 768px, 1024px, 1440px  
(Desktop nav ≥1100px; mobile drawer ≤1099px; card grid 3→2→1; footer stacks.)

---

## Passed checks

### Visual / chrome
- [x] Dark slate background + teal accent language aligned with live
- [x] Inter font on public shell
- [x] Sticky glass header + dark footer
- [x] Logo treatment (circular mark + EVFAKTA.no)
- [x] Car cards: dark panel, 16:9 image well, Rekkevidde / Hurtiglading / Forbruk, “Se fakta →”
- [x] Homepage section rhythm: hero → models → charging → FAQ → about → guide
- [x] Model detail uses dark hero/facts surfaces; prices/scores hidden per display policy
- [x] Brand index/detail render on rebuild
- [x] Compare page available with best-value highlighting (non-price rows)
- [x] Catalog loading state present (`Laster modeller…`)
- [x] Admin remains separate light theme (CMS chrome unchanged)

### Trust / IA (after this QA pass)
- [x] Stub tools removed from public header + footer navigation
- [x] No App Store / app promo claims on rebuild
- [x] No “ekte testdata” / “reelle testresultater” claims on homepage
- [x] No invented “55+” model count — shows actual published count
- [x] Metadata no longer promises prices or EVFAKTA Score when hidden
- [x] Price filters / score sort hidden when `PUBLIC_SHOW_*` is false
- [x] Draft marker stripped from public model copy, meta description, JSON-LD, and client props (CMS rows unchanged)

### Engineering gates
- [x] `npm run lint`
- [x] `npm test`
- [x] `npm run build`

---

## Hidden unfinished tools

Routes **remain** (catch-all / placeholder pages). They are **not** linked from public nav or footer.

| Href | Reason hidden |
|------|----------------|
| `/kalkulator` | EmptyState placeholder only |
| `/rimeligste` | Stub / not rebuilt |
| `/verktoy` | Stub / not rebuilt |
| `/testdata` | Stub / not rebuilt |
| `/ladekart` | Stub / not rebuilt (no charging map) |
| `/bruktbil` | Stub / not rebuilt |
| `/info` | Stub / not rebuilt |

Config: `config/site.ts` → `hiddenPublicToolHrefs`, `primaryNavLinks`, `navLinks`.

Public nav now: **Modeller · Merker · Sammenlign** (+ Hjem in footer/mobile full list).

---

## Remaining visual differences (vs live)

1. **Nav density:** Live shows many tool links; rebuild intentionally shows only complete surfaces.
2. **Homepage extras:** Live has app promo strip; rebuild omits it (unsupported).
3. **Model URL model:** Live often uses variant-as-page slugs; rebuild uses model slug + `?variant=`.
4. **Catalog volume:** Live ~55+ models; rebuild currently **3 published** models in local DB at QA time.
5. **“Mest sett denne uken”:** Replaced with honest **“Utvalgte modeller”** (no analytics feed).
6. **Merker:** First-class on rebuild; live IA emphasizes tools over a `/merker` index.
7. **Micro-spacing / pixel polish:** Not bit-identical to live Tailwind markup; same visual language, not a clone.
8. **Compare UX:** Rebuild picker/table is functional but simpler than live’s denser tool UI.

---

## Remaining launch blockers

From this cutover QA + `docs/LAUNCH_CHECKLIST.md`:

1. **Content readiness:** Few models published; launch wave still needs draft cleanup in CMS, image Hero/Front/Side attach, editorial approval (`Publish Ready` = 0 until gates clear).
2. **Draft still in CMS:** Public pages sanitize draft markers in copy/meta/JSON-LD/client props, but editors must still clear draft strings in CMS before approval/publish gates and long-term content quality.
3. **Images:** Confirm Image Ready / Launch Content Ready on Production Dashboard for first-wave models.
4. **Conflicts / incomplete specs:** e.g. documented VW/Tesla holds — do not bulk-publish Launch Blocked rows.
5. **Stub tools:** Keep hidden until product-complete; do not advertise kalkulator/map/testdata.
6. **Human visual sign-off:** Side-by-side in a real browser at 375 / 768 / 1024 / 1440 (this report used HTML/CSS audit + live capture; final pixel OK still needed).
7. **Cutover ops:** Do **not** point DNS until Publish Ready set is non-zero and QA’d.

---

## Trust content changes made in this QA pass

- Narrowed public nav/footer to complete pages only
- Rewrote hero, about, guide, FAQ, and site metadata to drop unsupported claims
- Honest model counts; “Utvalgte modeller” instead of “Mest sett”
- Public draft-marker sanitization for model copy/metadata
- Compare hint no longer mentions price when prices are hidden

---

## Cutover decision

**Not ready for DNS cutover.**  
Visual language is close enough for a soft launch *after* content/image/publish gates clear, but **content volume + launch gates** remain the hard blockers. Public trust claims and stub nav exposure are cleared for the rebuild surface.
