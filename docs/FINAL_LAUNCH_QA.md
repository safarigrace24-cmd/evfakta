# EVFAKTA — Final Launch QA

**Role:** Quality Assurance Lead  
**Date:** 2026-08-02  
**Scope:** Full platform review (public + admin) after feature-complete product phase  
**Method:** Static code review of routes/components, feature-flag/SEO/security checks, automated verification  
**Constraints:** Audit only — no new features, no redesign, no schema changes, no workflow changes, no commit/push

---

## Verification runs

| Check | Result |
|-------|--------|
| `npm run lint` (`tsc --noEmit`) | **PASS** |
| `npm test` | **PASS** — 182 tests, 0 failures |
| `npm run build` | **PASS** |

Build note: Next.js warns that the `middleware` file convention is deprecated in favour of `proxy`. Non-blocking for this release.

---

## Coverage checklist

| Surface | Reviewed | Launch readiness notes |
|---------|----------|------------------------|
| Homepage `/` | Yes | Strong; hub copy for Kalkulator is stale |
| Models `/modeller` | Yes | Filters, empty/loading states present |
| Model pages `/modeller/[slug]` | Yes | Metadata + draft sanitization present |
| Compare `/sammenlign` | Yes | Differences, share/print, «Ikke oppgitt» |
| Used EV `/bruktbil` | Yes | Assessment tool live; some duplicate checklist content |
| Charging Calculator `/kalkulator` | Yes | Live module; SEO/sitemap mismatch |
| Charging Map `/ladekart` | Yes | Env-gated; nav WIP can disagree with env |
| Login / Register | Yes | Forms OK; metadata gaps |
| Admin | Yes | Functional; heavy English UI |
| Image Review | Yes | Strong gates; English checklist labels |
| Editorial Assistant | Yes | Draft-only safeguards OK; mixed language |
| Navigation / footer | Yes | WIP badges present; dense IA |
| SEO / robots / sitemap | Yes | Mostly sound; calculator gap |
| Security / secrets | Yes | Server keys stay server-side in client code guards |
| Accessibility | Partial | Skip link + many labels; map InfoWindows limited |
| Performance | Partial | Dynamic routes; image fallback 404 chatter |

---

## Executive summary

Automated quality gates are green. Previous launch blockers (soft-404 catch-all, auth `console.log` of sessions, root canonical always `/`, sitemap listing noindex stubs, missing `error.tsx`) appear **resolved**.

Remaining launch risk is concentrated in **product-status honesty**, **privacy transparency**, **SEO consistency for the new calculator**, **nav/feature-flag dual systems**, and **admin language/polish** — not in broken builds or inventing specs.

---

## Critical

### C1 — Homepage still markets Kalkulator as unfinished while the tool is live
- **Issue:** Platform hub description for `/kalkulator` still says «Kostnads- og ladekalkulator — under utvikling.» while `publicFeatures.calculator.enabled` is `true`, the route serves a real calculator, and page metadata allows indexing.
- **Location:** `components/home/platform-hub-section.tsx` (`descriptions["/kalkulator"]`)
- **Recommendation:** Update hub copy to describe the live calculator accurately (and keep honest estimate disclaimers on-page). Do not claim «under utvikling» for launch-ready tools.

### C2 — No public privacy policy while auth and geolocation exist
- **Issue:** There is no `/personvern` (or equivalent) page. Footer/nav have no privacy link. The product offers account signup/login and a charging map that requests browser location after user action. For a Norwegian public launch this is a trust and compliance gap even when coordinates are not stored.
- **Location:** Site IA (`config/site.ts`, `components/layout/site-footer.tsx`); missing route under `app/`
- **Recommendation:** Publish a clear Norwegian privacy page covering accounts, favorites, geolocation (ephemeral, not stored), NOBIL/Maps processing, and contact — then link it from footer and info. Unknown URLs already correctly 404 (do not revive soft stubs).

---

## High

### H1 — Auth account pages lack dedicated metadata / noindex
- **Issue:** `/login`, `/registrer`, `/glemt-passord`, `/oppdater-passord`, and `/min-side` do not export page `metadata`. Tabs/shares inherit homepage title/description; indexing controls rely mainly on `robots.ts` disallow (incomplete for password-reset).
- **Location:** `app/login/page.tsx`, `app/registrer/page.tsx`, `app/glemt-passord/page.tsx`, `app/oppdater-passord/page.tsx`, `app/min-side/page.tsx`
- **Recommendation:** Add Norwegian titles/descriptions and `robots: { index: false, follow: false }` on all account flows.

### H2 — Password-reset route not disallowed in robots.txt
- **Issue:** `robots.ts` disallows `/login`, `/registrer`, `/oppdater-passord`, `/min-side`, `/admin` but not `/glemt-passord`.
- **Location:** `app/robots.ts`
- **Recommendation:** Add `/glemt-passord` to `disallow`.

### H3 — Live calculator is indexable but missing from sitemap
- **Issue:** `/kalkulator` sets `robots: { index: true }` and is feature-enabled, but `app/sitemap.ts` still excludes it (comment still treats tools as unfinished). Crawl discovery and page policy disagree.
- **Location:** `app/kalkulator/page.tsx`, `app/sitemap.ts`
- **Recommendation:** Either add `/kalkulator` to the sitemap, or keep it out of the sitemap and set `index: false` until intentionally launched for search.

### H4 — Dual feature-flag systems disagree for Ladestasjoner
- **Issue:** Live map is gated by env `CHARGING_MAP_ENABLED` (`lib/integrations/feature-flags.ts`), while nav/footer/hub WIP uses `publicFeatures.chargingMap.enabled` (hardcoded `false`). A correctly configured environment can show a working map while chrome still labels «Under utvikling».
- **Location:** `lib/public/feature-flags.ts`, `lib/integrations/feature-flags.ts`, `app/ladekart/page.tsx`, header/footer
- **Recommendation:** Drive public WIP badge from the same readiness decision as the page (or document a single launch checklist and flip both together). Avoid contradictory status signals.

### H5 — Header “search” control is only a link to `/modeller`
- **Issue:** Desktop magnifying-glass control looks like search but navigates to the catalog without focusing a query field. Mobile drawer has a real search form.
- **Location:** `components/layout/site-header.tsx` (`.headerSearchLink`)
- **Recommendation:** Align label/behaviour: inline search, or link to `/modeller` with visible search affordance and matching `aria-label` that does not imply an immediate search box.

### H6 — Car image fallback triggers likely 404 network requests
- **Issue:** When `imageUrl` is empty, UI requests `/images/cars/{slug}.webp` before falling back to a letter. Those static assets are generally absent, causing extra failed requests and slower perceived performance.
- **Location:** `components/cars/car-image.tsx`, `components/cars/car-gallery.tsx`
- **Recommendation:** Prefer immediate letter/brand fallback (or a single known local placeholder) when `imageUrl` is missing; reserve file paths for assets known to exist.

### H7 — Admin Image Review / AI generator UI is largely English
- **Issue:** Public product is Norwegian; Image Review visual checklist, Hero confirmations, and AI generator steps expose substantial English («Visually verified», «Generate Image», «Connected», «Missing API key», etc.). Increases editor error risk and brand inconsistency.
- **Location:** `components/admin/admin-image-review-workspace.tsx`, `components/admin/admin-ai-image-generator-modal.tsx`
- **Recommendation:** Localise editor-facing strings to Bokmål (keep internal status keys if needed).

### H8 — Editorial Assistant still mixed EN/NB
- **Issue:** Core research CTA remains English («Research & Fill Missing Fields», «Open research job», «Launch Ready», «required»), while newer AI draft controls are Norwegian. Inconsistent admin UX.
- **Location:** `components/admin/admin-editorial-assistant.tsx`
- **Recommendation:** Complete Norwegian localisation for editor-visible chrome; keep draft safeguards unchanged.

### H9 — Gemini image generation remains externally blocked
- **Issue:** Image provider path can be enabled in env, but Google image quota previously returned FreeTier `limit: 0`. Admin «Lag AI-bilde» may fail at generation time. Safe-fail exists, but launch ops must not assume image AI is production-ready.
- **Location:** Admin AI image modal / Google provider adapter; env flags `GOOGLE_AI_IMAGES_ENABLED`, `AI_PROVIDER`
- **Recommendation:** Keep images marked non-PASS until a real successful generation on the billed project. Leave text drafts and official photo workflow as the launch path.

---

## Medium

### M1 — Multiple unfinished tools remain in primary nav
- **Issue:** `/rimeligste`, `/verktoy`, `/testdata` (and often `/ladekart`) remain in main nav with WIP badges. Honest, but dense and dilutes launch focus.
- **Location:** `config/site.ts`, header/footer
- **Recommendation:** Accept for transparency, or temporarily demote unfinished tools behind Info/hub only after product decision (no silent removal without status label).

### M2 — Merker underlinked in chrome
- **Issue:** `/merker` works and is in sitemap, but is intentionally omitted from primary nav/footer explore list.
- **Location:** `config/site.ts`, `components/layout/site-footer.tsx`
- **Recommendation:** Add Merker to footer (minimum) so brand browsing is discoverable without homepage cards alone.

### M3 — Used EV page duplicates checklist content
- **Issue:** Interactive assessment checklist and a second static «Hurtigsjekk ved visning» list overlap, risking duplicated text fatigue.
- **Location:** `app/bruktbil/page.tsx`, `components/bruktbil/used-ev-assessment.tsx`
- **Recommendation:** Keep one interactive checklist as primary; shorten static list to a brief pointer.

### M4 — Charging map selected-station InfoWindow a11y limits
- **Issue:** Marker InfoWindows are Google Maps HTML snippets; primary accessible detail is the sidebar panel. Keyboard users depend on the list — OK if list remains complete, weaker if map-only interaction is assumed.
- **Location:** `components/charging/charging-map-client.tsx`
- **Recommendation:** Ensure list selection remains the accessibility path (already mostly true); avoid relying on InfoWindow alone for critical fields.

### M5 — Ladekart remains `noindex` even when enabled
- **Issue:** `/ladekart` metadata keeps `robots.index: false` regardless of `CHARGING_MAP_ENABLED`. Fine for soft launch; inconsistent if marketing expects the map to be findable.
- **Location:** `app/ladekart/page.tsx`
- **Recommendation:** Decide launch SEO explicitly; flip index + sitemap together when ready.

### M6 — Admin AI cost metering is an explicit placeholder
- **Issue:** Cost estimate text is labelled as placeholder until metering exists. Honest, but easy to misread as a real bill.
- **Location:** `lib/admin/ai-image-generator.ts`, AI generator modal
- **Recommendation:** Keep placeholder wording strong («ikke faktisk kostnad») in Norwegian UI.

### M7 — Next.js middleware deprecation warning at build
- **Issue:** Build prints middleware → proxy migration warning.
- **Location:** `middleware.ts`
- **Recommendation:** Plan Next 16 migration to `proxy` in a dedicated maintenance PR (not a launch blocker).

### M8 — Server-side `console.error` volume in admin/data paths
- **Issue:** Many admin/data helpers log error messages. Not browser debug of auth payloads (good), but noisy in production logs; ensure messages never include secrets or precise coordinates (charging path currently avoids coordinate logging — keep it that way).
- **Location:** `app/admin/*-actions.ts`, `lib/cars/get-published-cars.ts`, `lib/admin/**`
- **Recommendation:** Keep structured server logs; ban logging of keys, tokens, and lat/lng.

### M9 — Used EV catalog year hints always `null`
- **Issue:** Assessment receives `year: null` from published cars mapping, so year datalist/context from catalog is unused.
- **Location:** `app/bruktbil/page.tsx` (`catalogOptions` map)
- **Recommendation:** Pass real year when available on `Car`, or remove unused `year` from the option type.

---

## Low

### L1 — Emoji in admin CTA
- **Issue:** «✨ Lag AI-bilde» uses emoji in gallery/AI entry points.
- **Location:** `components/admin/admin-car-gallery.tsx`, `components/admin/admin-ai-illustration-panel.tsx`
- **Recommendation:** Prefer text-only CTA for consistency with Design System restraint.

### L2 — Organization JSON-LD on every page
- **Issue:** Root layout injects Organization schema globally, including account/error contexts.
- **Location:** `app/layout.tsx`
- **Recommendation:** Acceptable; optionally limit to public marketing pages later.

### L3 — Root font is Inter
- **Issue:** Design System 2.0 guidance prefers expressive fonts; root uses Inter.
- **Location:** `app/layout.tsx`
- **Recommendation:** Out of scope for this QA pass (no redesign). Track as polish debt.

### L4 — Compare «Batterigaranti» row never appears
- **Issue:** Comparison includes a `batteryWarranty` field accessor, but public `Car` type has no such property — row is filtered out as all-missing.
- **Location:** `lib/compare/comparison.ts`
- **Recommendation:** Remove dead row definition or wire a real verified field when available.

### L5 — Residual draft-marker risk depends on publish discipline
- **Issue:** Draft markers are stripped for public render and blocked by publish readiness tests — good. Residual risk is operational: editors pasting AI drafts without review before publish approval.
- **Location:** `lib/public/sanitize-public-copy.ts`, `lib/admin/publish-readiness.ts`, Editorial Assistant
- **Recommendation:** Keep human publish gate; spot-check published cars for marker leakage before go-live.

### L6 — Dense homepage section stack
- **Issue:** Homepage composes many sections (hub, popular, brands, metrics, charging explainer, FAQ, about, features, trust). Not broken; can feel long on mobile.
- **Location:** `app/page.tsx`
- **Recommendation:** Content prioritisation later; not a defect.

---

## Checks requested — status

| Check | Status |
|-------|--------|
| Navigation | Pass with WIP honesty; density Medium |
| Broken links | No hard-coded dead public destinations found; unknown URLs 404 |
| Buttons | No inert placeholder CTAs on public launch surfaces |
| Forms | Login/register/calculator/used-EV labelled; admin mixed language |
| Responsive layouts | Breakpoints present for map/calc/compare; manual device QA still required |
| Norwegian language | Public generally NB; admin High English debt |
| Typography / spacing | Consistent existing DS; Inter noted as Low |
| Loading / error / empty states | Present on compare, models, map, calculator validation |
| SEO / metadata | Core catalog OK; auth + calculator sitemap issues above |
| Images / fallbacks | Letter fallback works after failed `/images/cars/*` fetch |
| Performance | Extra image 404s; otherwise acceptable for SSR catalog |
| Accessibility | Skip link, many labels; map InfoWindow + header search gaps |
| Feature flags | Dual systems — High |
| Security | Client bundle guards for server keys; no auth payload logging found in client forms |
| Debug logs | No client auth debug logs found |
| TODO / Lorem Ipsum | No Lorem Ipsum in app code; no launch-blocking TODO strings in public UI |
| Placeholder buttons | None on public launch paths |
| Draft markers on launch models | Mitigated by sanitize + publish blockers; needs production spot-check |

---

## Manual QA still required (before go-live)

1. `/ladekart` with real Maps + NOBIL keys: permission deny, timeout, empty radius, directions link  
2. `/kalkulator` shareable URL round-trip on mobile  
3. `/bruktbil` print/PDF and seller-question copy  
4. `/sammenlign` sticky header + difference-only on small screens  
5. Publish spot-check: 5–10 launch models for draft markers, broken images, missing hero  
6. Admin: Editorial AI draft (text) failure path + Image Review approve gates  
7. Confirm Gemini **image** generation only after billing/quota is proven — do not mark PASS otherwise  
8. Privacy page content legal review (after C2)

---

## Recommended go-live order

1. Fix **C1** hub honesty for Kalkulator  
2. Ship **C2** privacy page + footer link  
3. Align **H3/H4** sitemap + feature-flag signalling  
4. Add auth metadata (**H1/H2**)  
5. Production spot-check published cars for images/drafts  
6. Treat Gemini images as post-launch until a real generation succeeds  

---

## Database changes

None (QA audit only).

## Commit / push

None (per instructions).
