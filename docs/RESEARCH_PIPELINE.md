# EVFAKTA Automated Research Pipeline

**Date:** 2026-07-26  
**Status:** Implemented (admin review required; never auto-publishes)  
**Migration:** `supabase/migrations/20260726090000_create_research_pipeline.sql`

---

## Goal

Collect as much vehicle information as possible automatically. Humans review, approve and publish.

```
Select brand/model
  → Start research job (provider adapter)
  → Extract models / variants / specs / sources / image candidates
  → Admin reviews field-by-field + images
  → Apply approved data as draft / needs_review
  → Separate approve + publish steps (existing workflow)
```

---

## Hard rules

1. **Never invent specifications** — missing stays `null`.
2. **Every populated value must have a source** (name and/or URL + retrieved date + confidence).
3. Prefer **official Norwegian manufacturer pages**.
4. Secondary sources must be labelled (`is_secondary` / warnings).
5. **Conflicts create warnings** — no silent winner.
6. **Never auto-publish** cars or images.
7. Prices + EVFAKTA Score stay **hidden in public UI** for now (`lib/public/display-policy.ts`).

---

## Providers

| Key | Mode | Notes |
|-----|------|-------|
| `manual` | paste / upload | Recommended when sites block bots |
| `manufacturer_http` | live URL fetch | Falls back with blocked status |
| `structured_json` | JSON paste | Full field/variant/image_candidates |
| `stub` | test shell | Empty model, no invented specs |

---

## Tables

- `research_jobs` — job status, progress, raw input, summary
- `research_items` — proposed models + variants payload
- `research_field_candidates` — field values with source/confidence/status
- `research_image_candidates` — image URLs pending license approval

Admin writes use the **service role**. No public RLS policies.

---

## Admin UI

| Path | Purpose |
|------|---------|
| `/admin/import` | Catalog progress + links to research |
| `/admin/import/research` | Start job + history |
| `/admin/import/research/[id]` | Preview, conflicts, missing fields, image review, apply |

Apply path writes to existing `cars` / `car_variants` / `car_images` with:

- `is_published = false` (or preserve existing false/true without flipping to true)
- `import_status = needs_review`
- `field_sources` provenance including `research_job_id` + confidence

Approved images upload to Supabase Storage (`car-images`) only after admin approval.

---

## Manual setup steps

1. Apply migration in Supabase SQL editor or CLI:
   - `supabase/migrations/20260726090000_create_research_pipeline.sql`
2. Ensure service role env vars are set (`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`).
3. Ensure brands exist under `/admin/merker`.
4. Open `/admin/import/research`.
5. Prefer **manual paste** of official Tesla/VW/etc. Norwegian pages if live fetch is blocked.
6. Review conflicts/missing fields/image candidates.
7. Approve model + fields + images → **Anvend godkjente som needs_review**.
8. Finish review in `/admin/biler` → approve → publish deliberately.

---

## Related

- Catalog plan: `docs/EVFAKTA_MASTER_CATALOG.md`
- Import engine: `docs/CATALOG_MANAGEMENT_SYSTEM.md`
- Variants: `supabase/migrations/20260725220000_create_car_variants.sql`
