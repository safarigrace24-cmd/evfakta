# Public Visual Migration Checklist

Goal: make the **rebuild public website** look and feel like live [https://www.evfakta.no](https://www.evfakta.no) so visitors do not notice the backend rebuild.

**Rules**

- Live site is the design reference only — do **not** copy its source code.
- Recreate in this Next.js codebase (components + `globals.css`).
- **CMS / admin unchanged** (logic, workflows; admin keeps light theme + separate chrome).
- Do **not** modify the old live deployment.
- No new product features beyond visual parity (missing live tools → stub pages).
- No commit / push unless requested.

---

## Live design reference (audit snapshot)

| Token | Live value |
|-------|------------|
| Page background | `rgb(15, 23, 42)` slate |
| Header | sticky glass `rgba(15,23,42,0.95)` + blur |
| Footer | `rgb(11, 17, 32)` |
| Surfaces / cards | `rgb(18, 27, 50)`, border `rgba(255,255,255,0.05)` |
| Text primary | `rgb(240, 245, 255)` |
| Text muted | `rgb(148, 163, 184)` / `rgb(100, 116, 139)` |
| Accent | teal `#2dd4bf` |
| CTA gradient | teal → sky |
| Secondary accent | sky blue on DC kW |
| Font | **Inter** |
| Cards | dark panel, 16:9 well, hover scale ~1.02 |

---

## Pre-change gates

- [x] Capture live homepage / modeller / sammenlign / model HTML for reference
- [x] Inventory rebuild public routes and shared chrome
- [x] Confirm admin must keep light admin styles
- [x] Isolate public theme from admin (`theme-public` vs `theme-admin`)
- [x] Do not change publish gates, research, image review, or DB schema

---

## Phase A — Foundations

- [x] Switch public font to Inter
- [x] Public CSS variables → live dark slate + teal system
- [x] Admin body class restores previous light tokens
- [x] Header: dark glass, logo, live-like nav, social links
- [x] Footer: dark columns + contact `post@evfakta.no` + social
- [x] Buttons / badges / containers on dark bg
- [x] Admin chrome separated (light admin header/footer)

---

## Phase B — Homepage

- [x] Hero: eyebrow, “Finn riktig elbil på 2 minutter”, CTA, stats
- [x] “Mest sett denne uken” (up to 6 CMS cars)
- [x] Charging explainer (AC hjemme / destinasjon / DC)
- [x] FAQ accordion
- [x] About EVFAKTA block
- [x] Four key metrics guide
- [ ] Optional app promo strip (deferred — not blocking visual language)

---

## Phase C — Catalog, brands, models, compare

- [x] Shared dark tokens cascade to `/modeller`, `/merker`, detail, `/sammenlign`
- [x] Car cards: brand teal, Rekkevidde / Hurtiglading / Forbruk, “Se fakta →”
- [x] Detail hero / facts use dark surfaces
- [ ] Pixel-perfect compare table polish vs live (follow-up visual QA)

---

## Phase D — Responsive + polish

- [x] Mobile nav drawer on dark chrome
- [x] Card grids responsive
- [x] Header collapses under ~1100px
- [x] Theme class set from middleware pathname (no client FOUC for known routes)

---

## Explicit non-goals (this pass)

- [x] Do not rebuild live-only tools (kalkulator engine, ladekart, testdata DB, rimeligste) — stubs via `/[slug]`
- [x] Do not change CMS data model or admin workflows
- [x] Do not auto-publish
- [x] Do not point DNS / deploy to production

---

## Acceptance / verification

- [x] `npm run lint` / `npm test` / `npm run build` pass
- [ ] Side-by-side desktop QA: `/` vs live `/`
- [ ] Mobile QA homepage + modeller + model detail + sammenlign
- [ ] Confirm `/admin` still light + usable
- [ ] Confirm no draft marker / price leakage on public cards

---

## Remaining blockers before “indistinguishable” cutover

1. Human visual QA against live (spacing/type micro-diffs).
2. Optional app promo + richer model-page section rhythm if QA finds gaps.
3. Content volume: live has 55+ published models; rebuild only shows published CMS rows.
4. Stub destinations (`/rimeligste`, `/testdata`, `/ladekart`, etc.) need real tools later — visual nav parity only for now.
5. DNS cutover still gated by launch content readiness (`docs/LAUNCH_CHECKLIST.md`).

---

## Status

| Item | Status |
|------|--------|
| Checklist authored | Done |
| Implementation (Wave 1 visual parity) | Done |
| Verified lint/test/build | Done |
| Human side-by-side QA | Pending |
