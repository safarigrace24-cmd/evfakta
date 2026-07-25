# EVFAKTA Catalog Management System — Report

**Date:** 2026-07-25  
**Scope:** Professional import + catalog ops for hundreds/1000+ EVs  
**Status:** Implemented in code (migration must be applied in Supabase)

---

## Summary

EVFAKTA now has an admin **Catalog Management System** centered on `/admin/import` and an upgraded `/admin/biler` catalog with search, filters, and bulk actions.

Imported cars always land as **draft** or **needs_review** and are **never auto-published**.

---

## What was built

### 1. Admin section `/admin/import`

| Route | Purpose |
|-------|---------|
| `/admin/import` | Dashboard: stats (drafts / needs review / approved / published), methods, recent imports, history |
| `/admin/import/ny` | Upload CSV/JSON → preview → confirm apply |
| `/admin/import/[id]` | Full import report (imported / updated / skipped / errors / warnings / images) |

Nav item **Import** added in admin nav. Dashboard quick links updated.

### 2. Import methods

| Method | Status |
|--------|--------|
| **CSV** | Supported (shared parser with CLI) |
| **JSON** | Supported (`cars` / `items` / raw array) |
| **Images / galleries** | Via `gallery_images` URLs; modes **skip** or **replace** duplicates |
| **API connectors** | Stubbed as future (`OFV`, manufacturer) — disabled in UI |

### 3. Import pipeline

1. Upload file  
2. Detect format (csv/json)  
3. Validate + normalize (slug repair, country default `NO`)  
4. **Preview** against existing slugs (duplicate detection)  
5. Decisions: `import` / `update` / `skip` / `error`  
6. **Apply** in chunks with job + item history  
7. Report persisted on `import_jobs` / `import_job_items`

Options:

- Update existing cars  
- Skip unchanged cars  
- Image duplicate: skip / replace  
- Global source name/URL overlay  

Safety rules:

- `is_published` always forced `false` on **new** imports  
- Updates **do not** auto-publish; existing publish flag is preserved  
- `import_status=approved` in file is downgraded to `needs_review`  
- Empty status defaults to `needs_review` (CSV/JSON admin path)

### 4. Import report fields

- Imported  
- Updated  
- Skipped  
- Errors  
- Warnings  
- Images imported / skipped / replaced  

### 5. Catalog bulk actions (`/admin/biler`)

- Bulk publish (respects publish-readiness gates)  
- Bulk approve  
- Bulk move to review  
- Bulk set draft  
- Bulk unpublish  
- Bulk delete  
- Bulk assign brand  
- Bulk assign source (+ updates `field_sources` + `data_last_checked_at`)

### 6. Search & filters

Fast client filter over loaded admin cars (fine for 1000+):

- Text (brand / model / slug)  
- Brand  
- Status (draft / needs_review / approved / published / unpublished)  
- Country  
- Year  
- Body  
- Drive  

Filters are URL-backed (`?status=needs_review` etc.).

### 7. Source tracking

Migration adds:

- `cars.country`  
- `cars.imported_at`  
- `cars.last_import_job_id`  
- `cars.field_sources` (JSONB per-field provenance)

Every changed/imported field stores:

`{ source_name, source_url, imported_at, import_job_id }`

Plus existing `source_*` / `data_last_checked_at` / `import_status` / `import_notes`.

### 8. Performance

- Indexes on brand, import_status, country, year, body_style, drivetrain, published, slug  
- Upserts / job item inserts in chunks (50–100)  
- Preview/item lists capped for UI (200–500 visible rows; full apply still processes all)

---

## Database migration (required)

Run in Supabase SQL editor:

`supabase/migrations/20260725200000_catalog_import_system.sql`

Creates:

- `import_jobs`  
- `import_job_items`  
- car provenance columns + indexes  
- RLS deny-public on import tables (service role only)

Without this migration, import job persistence will fail at runtime.

---

## Key files

| Area | Path |
|------|------|
| Migration | `supabase/migrations/20260725200000_catalog_import_system.sql` |
| Types | `lib/admin/import/types.ts` |
| CSV/JSON parse | `lib/admin/import/parse-csv.ts`, `parse-json.ts` |
| Preview/diff | `lib/admin/import/preview.ts` |
| Apply + images | `lib/admin/import/apply.ts` |
| Jobs | `lib/admin/import/jobs.ts` |
| Catalog filters | `lib/admin/catalog-query.ts` |
| Actions | `app/admin/import-actions.ts`, `catalog-actions.ts` |
| UI | `components/admin/admin-import-uploader.tsx`, `admin-catalog-client.tsx` |
| Templates | `data/cars-import.template.csv`, `data/cars-import.template.json` |
| Tests | `tests/import-engine.test.ts` |
| CLI | `scripts/import-cars-from-csv.ts` (uses shared parser) |

---

## Review workflow (unchanged principle)

```
Import → draft | needs_review (unpublished)
      → Approve (still unpublished)
      → Publish only when getPublishIssues() passes
```

Publishing still requires: description, image/gallery, source, `data_last_checked_at`, `import_status=approved`.

---

## How to use

1. Apply migration `20260725200000_catalog_import_system.sql`  
2. Open `/admin/import/ny`  
3. Upload CSV or JSON (see templates under `data/`)  
4. Preview → confirm  
5. Review at `/admin/biler?status=needs_review`  
6. Bulk approve / assign source / publish when ready  

---

## Tests & build

- `npm test` includes `tests/import-engine.test.ts`  
- `npm run build` required after implementation  

---

## Follow-ups (not in this delivery)

- Enable real API connectors (OFV / manufacturer)  
- Server-side paginated catalog queries if catalog grows far beyond ~2–5k  
- Optional UI for inspecting `field_sources` on the car edit page  
- Background job queue for very large image fetches  
