# NOBIL + Google Maps integration (EVFAKTA)

Public charging map at `/ladekart`.

---

## Architecture

```
Browser (/ladekart)
  → Google Maps JS (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) for map UI only
  → User clicks «Bruk min posisjon» (explicit permission)
  → GET /api/charging-stations?latitude&longitude&radius&…
  → Server uses NOBIL_API_KEY (never sent to browser)
  → Normalized stations returned
  → Markers + synchronized list (sort: nearest / power / points)
  → «Åpne veibeskrivelse» via public Google Maps directions URL
```

NOBIL terms require an intermediate server service — EVFAKTA never calls NOBIL from the browser.

See also `docs/PRODUCT_PHASE_TOOLS.md` for privacy, filters (incl. 300 kW+), and sorting.

---

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `CHARGING_MAP_ENABLED=false` | Server | Feature flag (default off) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Client | Maps JavaScript API only |
| `NOBIL_API_KEY` | **Server only** | NOBIL Client API v3 |

Never put `NOBIL_API_KEY` in `NEXT_PUBLIC_*`.

---

## Google Cloud API restrictions

For `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`:

1. Enable **Maps JavaScript API**
2. Application restriction: **HTTP referrers** (never leave unrestricted)
3. API restriction: **Maps JavaScript API** only
4. Do not reuse this key for AI or NOBIL
5. Do not rotate or replace the key in code/docs — only update referrer allowlists in Google Cloud Console

### Required HTTP referrer allowlist

Add **exactly** these patterns (wildcards as shown). Missing any of them causes `RefererNotAllowedMapError` in that environment.

| Environment | Allowed HTTP referrer |
|-------------|------------------------|
| Development | `http://localhost:3000/*` |
| Vercel Preview | `https://*.vercel.app/*` |
| Production | `https://evfakta.no/*` |
| Production (www) | `https://www.evfakta.no/*` |

Notes:

- Keep application restriction set to **HTTP referrers** — do **not** switch to “None” / unrestricted to “fix” Maps.
- After changing referrers in Google Cloud, wait a few minutes; no app redeploy is required for referrer-only changes.
- Preview deployments use `*.vercel.app` hostnames — without `https://*.vercel.app/*`, Preview QA will show `RefererNotAllowedMapError` even when Production works.

---

## Local setup

1. Obtain a NOBIL API key via [info.nobil.no/api](https://info.nobil.no/api)  
2. Create a Maps JS key in Google Cloud  
3. `.env.local`:

```bash
CHARGING_MAP_ENABLED=false
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NOBIL_API_KEY=
```

4. Run the app, verify Coming Soon while flag is false  
5. Set `CHARGING_MAP_ENABLED=true` after QA  

---

## Vercel setup

1. Add `NOBIL_API_KEY` as a **server** secret  
2. Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for client Maps  
3. Add `CHARGING_MAP_ENABLED=true` and `NEXT_PUBLIC_CHARGING_MAP_ENABLED=true` only after QA  
4. Restrict Maps key HTTP referrers using the allowlist above (localhost + `*.vercel.app` + `evfakta.no` / `www.evfakta.no`)  
5. Redeploy after any environment-variable change (referrer-only Google Cloud changes do not need a redeploy)  

---

## Privacy behavior

- Location is requested **only** after «Bruk min posisjon»  
- Copy shown: *Posisjonen din brukes kun til å finne ladestasjoner i nærheten og lagres ikke av EVFAKTA.*  
- Precise coordinates are **not** stored in EVFAKTA databases  
- Precise coordinates are **not** logged in production  
- No analytics events with precise coordinates  

Permission errors handled:

- permission denied  
- location unavailable  
- timeout  
- unsupported browser  

---

## NOBIL attribution

Display:

> Data: NOBIL (Enova) — Creative Commons Attribution 4.0 International.

Source: [NOBIL / Enova](https://nobil.no) — follow current CC BY 4.0 terms.

---

## API: `/api/charging-stations`

Query params:

| Param | Rules |
|-------|--------|
| `latitude` | Required, −90…90 |
| `longitude` | Required, −180…180 |
| `radius` | Required: `5` \| `10` \| `25` \| `50` (km) |
| `connectorType` | Optional: CCS, CHAdeMO, Type2, … |
| `minimumPower` | Optional kW, 0…1000 |
| `chargingCategory` | Optional: `hurtiglading` \| `normallading` |

Returns normalized stations:

`id`, `name`, `operator`, `latitude`, `longitude`, `address`, `city`,  
`chargingPointCount`, `connectorTypes`, `maximumPowerKw`, `accessInformation`,  
`openingHours`, `source`, `lastUpdated`, `distanceMeters`, `liveAvailability: null`

**Never claims live availability** unless NOBIL explicitly provides reliable realtime data (not used in this integration).  
**Never invents prices.**

---

## Map UX

- Default: Norway overview (`language=nb`, `region=NO`)  
- User marker after permission  
- Station markers + sidebar list sorted by distance  
- Filters: Hurtiglading, Normallading, CCS, CHAdeMO, Type 2, Minimum kW  
- Filters shown based on returned data when available  

---

## Feature-flag activation checklist

- [ ] `NOBIL_API_KEY` server-only  
- [ ] Maps key restricted by referrer + API  
- [ ] `/api/charging-stations` returns 503 when flag off  
- [ ] `/ladekart` shows honest message when misconfigured  
- [ ] Location only after button click  
- [ ] Permission denial UI works  
- [ ] Attribution visible  
- [ ] No keys in client bundle for NOBIL / Google AI  
- [ ] Set `CHARGING_MAP_ENABLED=true`  

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Coming soon / konfigureres | Flag off, missing Maps or NOBIL key |
| 503 from API | Flag or NOBIL key |
| 400 Ugyldige koordinater | Client sent bad lat/lng |
| Empty list | Radius too small / filters too strict / NOBIL empty |
| Maps load error | Key restrictions / Maps JS API not enabled |

---

## Code map

| Piece | Path |
|-------|------|
| Page | `app/ladekart/page.tsx` |
| Map UI | `components/charging/charging-map-client.tsx` |
| API route | `app/api/charging-stations/route.ts` |
| NOBIL client | `lib/charging/nobil-client.ts` |
| Normalize | `lib/charging/normalize-nobil.ts` |
| Query helpers | `lib/charging/geo.ts` |
| Feature flag | `lib/integrations/feature-flags.ts` |
