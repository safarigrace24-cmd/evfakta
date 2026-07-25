# EVFAKTA v1.0 Plan

**Date:** 2026-07-25  
**Baseline:** Catalog (modeller/merker/detail), favorites, auth, admin cars/brands/gallery/review, CSV import scripts.  
**Gaps:** Comparison, EVFAKTA Score, SEO plumbing, catalog filters, admin quality metrics, tests.

---

## Audit summary

### Working
- Public: `/`, `/modeller`, `/modeller/[slug]`, `/merker`, `/merker/[slug]`, favorites, auth
- Admin: cars CRUD, brands CRUD, gallery, logo upload, import review per car, publish toggle
- Data: Supabase cars/brands/car_images, CSV import scripts, unpublished-by-default workflow

### Incomplete / placeholders
| Area | Status |
|------|--------|
| `/sammenlign` | EmptyState placeholder |
| `/kalkulator` | EmptyState placeholder |
| `/rimeligste`, `/verktoy`, `/testdata`, `/ladestasjoner`, `/bruktbil`, `/info` | Catch-all “Kommer snart” |
| EVFAKTA Score | Not implemented |
| SEO (sitemap, robots, OG, JSON-LD, dynamic metadata) | Missing |
| Catalog filters | Search + drivetrain only |
| Car detail | Gallery + 6 facts; extended fields unused |
| Admin dashboard | Total/published/drafts only |
| Tests | None |
| `loading.tsx` / `error.tsx` / branded `not-found.tsx` | Missing |

### Acceptance criteria for v1.0
1. Published cars only appear on public pages.
2. Comparison supports 2–3 published cars with shareable URLs.
3. EVFAKTA Score fields exist, are manually editable, and render on detail when set.
4. Catalog supports search, brand/price/range/drivetrain/body filters, and sort; filters in URL.
5. Car detail shows gallery, specs, scores, sources, related cars, favorite + compare.
6. SEO: dynamic metadata, canonical, OG, JSON-LD for cars/brands, sitemap, robots.
7. Admin dashboard shows review/publish/image/source quality counts; publish blocked when review data missing.
8. Practical automated tests cover fetching, unpublished protection, comparison, CSV validation.
9. Build and lint pass.

### Out of scope for this v1.0 pass
- Full calculator product
- Rimeligste / ladestasjoner / bruktbil / testdata / verktoy content
- Auto-generated scores from incomplete specs
- Scraping blocked manufacturer sites
- Committing or deploying

### Priority order
1. Score schema + admin + detail display  
2. Comparison  
3. Car detail depth  
4. Catalog UX  
5. SEO + performance  
6. Admin quality  
7. Tests  

---

## Phase checklist

- [x] Phase 1 — Audit and plan (this document)
- [x] Phase 2 — EVFAKTA Score
- [x] Phase 3 — Comparison
- [x] Phase 4 — Car detail pages
- [x] Phase 5 — Catalog UX
- [x] Phase 6 — SEO and performance
- [x] Phase 7 — Admin quality
- [x] Phase 8 — Testing

### Manual steps after implementation
1. Run new SQL migrations in Supabase SQL Editor.
2. Editorially fill scores (do not invent).
3. Approve + publish cars only after human review.
4. Add brand logos and car gallery images as needed.
5. Verify production `metadataBase` / canonical domain.
