# EVFAKTA Rebuild — Launch Checklist

Wave 1 launch gates for the **rebuild** codebase only.  
Does not modify the old live marketing site.

**Date:** 2026-07-26  
**Rule:** No auto-publish. Approval ≠ publication.

---

## Hard publish gates (enforced in code)

A model **cannot** be published (`is_published = true`) unless all pass:

| Gate | Rule |
|------|------|
| Identity | brand, model, slug |
| Editorial | description present, **≥ 40 characters** |
| Draft marker | No `Draft – Requires editor review.` in description, pros, cons, suitable_for, or score_notes |
| Images | **Hero** (primary gallery or `image_url`) + **Front** + **Side** attached in `car_images` |
| Sources | source name or URL + `data_last_checked_at` |
| Review | `import_status = approved` |

Implemented in `lib/admin/publish-readiness.ts` and enforced by:

- `setAdminCarPublishedAction`
- `updateAdminCarAction` / `createAdminCarAction` when `is_published`
- bulk catalog publish
- editorial completion `canPublish`

---

## Production Dashboard launch signals

| Signal | Meaning |
|--------|---------|
| **Launch Content Ready** | Content gates pass (draft cleared, hero/front/side, SEO length, sources). Approval not required. |
| **Launch Blocked** | One or more content gates fail |
| **Publish Ready** | Content gates + `import_status = approved` |
| **Draft Markers** | Count of models still containing the draft string |
| **Images Ready** | Image Review rule: Hero + Front + Side approved (gallery and/or candidates) |

Filters: `launch_ready`, `launch_blocked`, `publish_ready`, `has_draft_marker`.

---

## SEO verification (published models)

Required for publish:

- Title parts: brand + model
- Canonical slug
- Description ≥ 40 chars, no draft marker
- OG image via hero / `image_url`

Public metadata fallback on model pages no longer mentions price or EVFAKTA Score when those are hidden.

**Manual verify before go-live:**

- [ ] Spot-check `/modeller/[slug]` view-source: `<title>`, meta description, canonical, `og:image`
- [ ] Confirm no published page still shows draft marker text
- [ ] Confirm sitemap only lists `is_published = true` cars
- [ ] Confirm robots still disallow `/admin`

---

## Remaining blockers before public launch

### Content / editorial

- [ ] Remove draft markers from all launch-wave models (VW Publish Candidates first)
- [ ] Human rewrite of Norwegian editorial copy after draft removal
- [ ] Resolve documented conflicts (e.g. ID.4 length, EX90 seats/cargo)
- [ ] Tesla energy figures still incomplete → keep out of first wave

### Images

- [ ] Approve + attach Hero / Front / Side for each launch model in `/admin/images`
- [ ] Confirm Image Review shows **Image Ready** and Launch column shows Content/Publish Ready
- [ ] Rejected candidates kept in history; do not auto-delete

### Approval / publish

- [ ] Manual `import_status → approved` only after editor review
- [ ] Manual publish only when Production shows **Publish Ready**
- [ ] Do **not** bulk-publish Launch Blocked rows

### Product trust (rebuild home — still open)

- [ ] Align hero/feature copy with hidden prices/scores (or enable prices/scores)
- [ ] Remove or finish `/kalkulator` CTAs
- [ ] Normalize model-count messaging

### Cutover / architecture

- [ ] Plan slug migration if live uses variant-URLs and rebuild uses model + `?variant=`
- [ ] Do not point production DNS at rebuild until Publish Ready set is non-zero and QA’d

### Optional polish (not Wave 1 gates)

- [ ] Default OG image / Twitter cards site-wide
- [ ] SSR/stream `/modeller` listing (avoid client loading shell)
- [ ] Dedicated admin chrome without public header

---

## Suggested first publish wave

Only when **Publish Ready**:

1. Volkswagen ID.3  
2. Volkswagen ID.4 (after conflict confirmation)  
3. Volkswagen ID. Buzz  

Hold: ID.7 (images), ID.5 (docs), Tesla (energy docs), Volvo (image attach + draft rewrite).

---

## Safety confirmation

- No automatic approval
- No automatic publication
- No database schema migrations in this wave
- No commit/push required by this checklist
