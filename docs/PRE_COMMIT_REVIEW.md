# Pre-commit review

Date: 2026-08-02  
Scope: full repository hygiene pass (dead code, temp artifacts, debug leftovers, stale flags/env).  
Constraints: no feature changes, no redesign, no database modifications, no commit, no push.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` (`tsc --noEmit`) | PASS |
| `npm test` | PASS — 182 / 182 |
| `npm run build` | PASS |

## Removed (genuinely unused)

| Item | Reason |
| --- | --- |
| `components/cars/car-hero.tsx` | No imports; superseded by current model detail layout |
| `components/admin/admin-cars-table.tsx` | No imports; admin list uses other UI |
| `components/admin/admin-car-review-panel.tsx` | No imports; review flow lives elsewhere |
| `components/brand/wordmark.tsx` | Unused deprecated re-export of `BrandLogo` |
| `config/site.ts` → `moreNavLinks` | Empty deprecated export; zero consumers |
| `lib/compare/comparison.ts` → `batteryWarranty` row | Dead row: `Car` has no `batteryWarranty`; always filtered out as empty |
| `scripts/_audit-audi-temp.mjs` | One-off local audit helper (already matched `.gitignore` `scripts/_*-temp.*`) |

No production routes, server actions, migrations, or env contracts were removed.

## Reviewed and kept (intentional)

### Local scratch (already gitignored)

- `docs/_tmp_*/` (~840MB research PDFs/HTML/images) — ignored via `docs/_tmp_*/`
- Pattern `scripts/_*-temp.*` / `scripts/_tmp-*` — already ignored

These folders are referenced by offline brand completion scripts (`scripts/complete-*-100.ts`) for re-runs. They are not shipped with the Next.js app. **Not deleted** so local editorial batches remain runnable.

### Editorial / batch scripts under `scripts/`

Knip flags many `complete-*`, `apply-*`, and `phase1-*` scripts as “unused files.” They are CLI tooling, not app imports. **Kept.**

### Migrations

All `supabase/migrations/*.sql` files are forward migrations for the live schema. **No migration deleted** (none were superseded stubs or accidental duplicates).

### Console usage

- No `console.log` / `console.debug` / `console.info` in `app/` or `components/`
- No `TODO` / `FIXME` / `debugger` in app TypeScript
- Remaining `console.error` / `console.log` live in server admin paths and CLI scripts for operational logging — **kept**

### Feature flags (not stale)

| Flag | Role | Status |
| --- | --- | --- |
| `GOOGLE_AI_IMAGES_ENABLED` | Server gate for Gemini images | Default off until real generation QA |
| `GOOGLE_AI_TEXT_ENABLED` | Server gate for editorial text drafts | Intentional |
| `CHARGING_MAP_ENABLED` | Server gate for `/ladekart` + API | Intentional |
| `NEXT_PUBLIC_CHARGING_MAP_ENABLED` | Optional nav/WIP sync | Documented; not unused |
| `AI_PROVIDER` / `AI_PROVIDER_FALLBACK` | Provider abstraction | Fallback list architectural only |
| `publicFeatures.*.enabled` | Nav WIP for unfinished destinations | Intentional (`rimeligste`, `verktoy`, `testdata`) |

### Environment variables

`.env.local.example` matches live integrations. Optional model overrides (`GOOGLE_AI_IMAGE_MODEL`, `GOOGLE_AI_TEXT_MODEL`) are read by adapters. No orphaned env keys found in example that lack a reader.

### Duplicate utilities / types

No safe consolidations without behavior risk. Provider wrappers (`ai-image-provider` vs `ai-providers/*`) still have call sites — left as-is.

### Accidental debug UI

None found (no debug-only panels, forced overlays, or client secret dumps).

### Historical docs

Older design/implementation reports may mention deleted paths (e.g. `wordmark.tsx`). Left as historical records; not rewritten.

## Knip / unused-export noise (not acted on)

Static unused-export analysis reported many admin helpers, markers, and server actions that are part of the CMS surface or reserved for adjacent UI. Removing them would risk breaking admin workflows. **No mass export cleanup.**

## Residual notes (out of scope)

1. Next.js warns that the `middleware` file convention is deprecated in favor of `proxy` — framework migration, not dead code.
2. Gemini image generation remains safe-fail / flag-off until a real generation passes QA (product constraint, not dead code).
3. Local `.env.local` may enable experimental flags for development; production should follow `.env.local.example` defaults.

## Summary

Hygiene cleanup only: four unused components, one dead nav export, one unreachable compare row, one temp audit script. Lint, tests, and build are green. Ready for a human-reviewed commit when requested.
