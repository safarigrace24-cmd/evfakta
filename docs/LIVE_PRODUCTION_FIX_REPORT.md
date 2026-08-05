# LIVE Production Fix Report

**Branch:** `fix/production-stability`  
**Date:** 2026-08-05  
**Scope:** Safe production-stability fixes only — no redesign, no schema changes, no auto-publish  
**Promotion:** Do **not** merge to `main` / promote until human Preview QA approval

---

### Code Fixes

- **Calculator controlled/uncontrolled warning**
  - Root causes:
    1. Clearing a `type="number"` field stored `NaN`, and React treats `value={NaN}` as uncontrolled.
    2. `parseChargingCostSearchParams` always returned every key (many as `undefined`), so URL hydration could overwrite defaults with `undefined`.
  - Fixes:
    - Added `chargingCostInputValue()` so every input `value` is always a string (`""` for null/undefined/NaN).
    - Applied it to **all** calculator inputs (battery, start, target, price, loss, monthly km, consumption).
    - Optional fields parse empty → `null` (not `NaN`).
    - URL parser now omits missing keys entirely.
  - Regression tests added in `tests/charging-cost.test.ts`.

- **Other runtime fixes**
  - None beyond calculator + documentation for Maps referrers.

---

### Google Maps

**Required HTTP referrers** (do not unrestricted the key):

| Environment | Referrer |
|-------------|----------|
| Development | `http://localhost:3000/*` |
| Vercel Preview | `https://*.vercel.app/*` |
| Production | `https://evfakta.no/*` |
| Production (www) | `https://www.evfakta.no/*` |

- Documented in `docs/NOBIL_GOOGLE_MAPS_INTEGRATION.md` and `.env.local.example`.
- Key value was **not** exposed, rotated, or weakened in code.
- **Preview result:** Pending — confirm Maps loads on Preview after Google Cloud referrer allowlist includes `https://*.vercel.app/*`.
- **Production result:** Pending — confirm allowlist includes `https://evfakta.no/*` and `https://www.evfakta.no/*`. Current live `RefererNotAllowedMapError` indicates Production referrers are incomplete until updated in Google Cloud Console (referrer-only change; no redeploy required for Console-only updates).

---

### Environment Variables

**App note:** Runtime Supabase client key is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (not `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Prefer the publishable name in Vercel to match `lib/supabase/env.ts`.

**Vercel Production name audit:** **Incomplete** — project is not linked locally (`.vercel` missing) and `vercel env ls production` hung awaiting interactive auth. **Do not treat local `.env.local` as Production.**

Checklist for human verification in Vercel → Project → Settings → Environment Variables → **Production**:

| Name | Expected |
|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | present |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | present (app-required; user list said `ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | present |
| `ADMIN_EMAIL` | present |
| `GOOGLE_AI_API_KEY` | present |
| `OPENAI_API_KEY` | present |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | present |
| `NOBIL_API_KEY` | present |
| `AI_PROVIDER` | `google` |
| `GOOGLE_AI_TEXT_ENABLED` | `true` |
| `GOOGLE_AI_IMAGES_ENABLED` | `false` (must stay false) |
| `CHARGING_MAP_ENABLED` | `true` |
| `NEXT_PUBLIC_CHARGING_MAP_ENABLED` | `true` |

- **All required names present (Production):** **UNKNOWN** (CLI audit blocked)
- **Missing names only (Production):** unknown until dashboard check
- Local `.env.local` name gaps (dev reference only, **not** Production): `NEXT_PUBLIC_SUPABASE_ANON_KEY` (unused by app), `NEXT_PUBLIC_CHARGING_MAP_ENABLED`
- Env-variable changes require a **new deployment** before they take effect.
- `.env.local` was **not** committed.

---

### Preview QA

| Item | Result |
|------|--------|
| Routes tested | Pending on Preview URL (deployment ready; browser QA not completed in this pass) |
| `/` `/modeller` `/sammenlign` `/kalkulator` `/ladekart` `/bruktbil` `/info` `/personvern` `/login` `/admin` | Pending human/browser QA on Preview |
| Console errors | Pending |
| Maps | Pending (referrer allowlist + Preview URL; Production still shows `RefererNotAllowedMapError` until Console allowlist updated) |
| NOBIL stations | Pending |
| «Bruk min posisjon» only after click | Pending (code path already click-gated; verify on Preview) |
| Calculator | Code fix + unit tests ✅; browser QA Pending |
| Auth / login redirect | Pending |
| Admin protected | Pending |

**Preview URL:** https://evfakta-git-fix-production-stability-evfaktano.vercel.app  
**Deployment:** https://vercel.com/evfaktano/evfakta/AYwToJGwg3rUgHtFKSzt3P5TyBgj

---

### Verification

| Check | Result |
|-------|--------|
| lint | ✅ pass |
| tests | ✅ pass (207) |
| build | ✅ pass |
| preview deployment | ✅ Vercel reported success for `fix/production-stability` — [deployment dashboard](https://vercel.com/evfaktano/evfakta/AYwToJGwg3rUgHtFKSzt3P5TyBgj). Likely Preview host: `https://evfakta-git-fix-production-stability-evfaktano.vercel.app` (may require Vercel SSO). |
| safe to promote | **NO** — wait for Preview QA + Maps referrer confirmation + Production env dashboard check |

### Safety preserved

- `GOOGLE_AI_IMAGES_ENABLED=false` (documented / expected)
- OpenAI remains admin/server image fallback only
- No automatic publish / approval / Hero
- No schema changes, redesign, or feature additions
- No merge to `main` / no production promote in this pass

---

**Next human actions**

1. In Google Cloud Console: set Maps key HTTP referrers to the four patterns above (keep restricted).
2. In Vercel Production env: confirm every name in the checklist (especially `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_CHARGING_MAP_ENABLED`); redeploy if any value was changed.
3. Open the Preview Deployment for `fix/production-stability` and complete route QA.
4. Approve merge to `main` only when Preview QA is green.
