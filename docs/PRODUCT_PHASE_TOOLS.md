# EVFAKTA product phase — tools & editorial

This document covers the advanced charging map, used-EV assessment, charging-cost calculator, Gemini editorial workflow, and comparison rules.

## Advanced charging map (`/ladekart`)

- Google Maps renders the map; NOBIL supplies station data via `/api/charging-stations`.
- Feature flag: `CHARGING_MAP_ENABLED` (server). Public nav may still show “Under utvikling” until launch QA.
- Location is requested only after **Bruk min posisjon**. Coordinates are kept in browser memory for the session search and are not stored by EVFAKTA.
- Allowed radii (validated server-side): 5, 10, 25, 50 km.
- Filters: connector (CCS / CHAdeMO / Type 2), category (hurtig / normal), minimum power including 300 kW+.
- Sorting: nearest, highest power, most charging points.
- Directions use the public Google Maps URL API (no secret key).
- Attribution: NOBIL (Enova) CC BY 4.0. No live availability or invented prices.

## Location privacy

- Never request geolocation on page load.
- Never persist precise coordinates in databases, analytics, or production logs.
- API requests send lat/lng only for the station search; server code must not log them.

## NOBIL normalization

See `lib/charging/` — stations are normalized to `ChargingStation` with connector types, max power, category, access, opening hours when present, and `liveAvailability: null` unless a reliable realtime source exists.

## Used-EV assessment (`/bruktbil`)

- Interactive documentation-risk tool; not a mechanical inspection.
- Risk levels (low / medium / high) are based on missing documentation and unchecked items.
- Never claims “battery is good/bad” or invents remaining life.
- Print / copy seller questions without login. Optional account save is not required for basic use (no new DB schema in this phase).

## Calculator formulas (`/kalkulator`)

- Energy to battery = capacity × (target − start) / 100
- Energy from grid = energy to battery / (1 − loss/100)
- Charge cost = energy from grid × price
- Monthly / per-100 km estimates use optional distance and consumption, with loss applied to grid draw
- Presets are editable examples, not market facts.
- Disclaimer: results are estimates; real consumption and loss vary.

## Gemini editorial workflow (admin)

- Flag: `GOOGLE_AI_TEXT_ENABLED` + `GOOGLE_AI_API_KEY` (server-only).
- Draft kinds: introduction, summary, FAQ, SEO title, meta description, social caption, metadata, rewrites, claim check.
- Always draft-only: no auto-save, no auto-publish.
- Visible notice: AI proposals must be reviewed before publishing.
- On provider failure: “AI-assistenten er midlertidig utilgjengelig.”
- Gemini image generation is separate and may fail safely on quota; do not mark images PASS without a real successful generation.

## Comparison rules (`/sammenlign`)

- Max 3 vehicles; URL sync via `?biler=`.
- Missing values display as **Ikke oppgitt** — never coerced to 0 for display.
- “Vis bare forskjeller”, remove, replace, copy link, print-friendly view.
- Uses published/normalized catalog fields only; no fabricated comparisons.
