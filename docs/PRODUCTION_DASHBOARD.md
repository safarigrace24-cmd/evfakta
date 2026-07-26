# EVFAKTA Production Dashboard

**Route:** `/admin/production`  
**Purpose:** Show editors what is ready, what is missing, and what to work on next.  
**Scope:** Read-only operational overlay on existing cars, variants, images, and research image candidates.  
**Non-goals:** No database schema changes, no research/import/review/publish workflow changes.

---

## What it shows

### Top cards

- Brands
- Cars
- Published
- Needs Review (`import_status`)
- Approved (`import_status`)
- Ready for Human Approval (dashboard-derived)
- Not Ready (dashboard-derived)
- Missing Images
- Missing Sources
- Missing Editorial
- Missing Variants

### Brand status table

Per brand: models, ready, needs review, published, missing images/sources, progress %, health status (Green / Amber / Red).

### Model table

Per model: completion / editorial / images / specs / sources / review percentages, production status, and buttons:

- **Review** → Car Editor
- **Edit** → Car Editor
- **Research** → Research pipeline

### Filters

Brand, production status (including Ready / Needs Review / Published / Not Ready), Missing Images / Sources / Editorial, and free-text search.

### Quick actions

Start Review, Open Research, Open Car, Open Variants, Publish Queue (anchor).

### Publish queue

Separate card listing only `READY_FOR_HUMAN_APPROVAL` models with one-click **Open Review**.  
Does **not** approve or publish.

### Progress

Overall completion %, brand health counts, and ready/approved/published vs total models.

---

## Status labels (important)

`READY_FOR_HUMAN_APPROVAL` and `NOT_READY` are **dashboard labels only**.

They are **not** stored in the database and do **not** change `import_status`.

Derivation (simplified):

| Label | Rule |
|-------|------|
| `PUBLISHED` | `is_published = true` |
| `APPROVED` | unpublished + `import_status = approved` |
| `READY_FOR_HUMAN_APPROVAL` | unpublished + `needs_review` + identity + sourced last-checked + editorial (description/pros/cons) + important specs (car or variants) + media signal (gallery, `image_url`, or image candidate) |
| `NEEDS_REVIEW` | `import_status = needs_review` but not ready |
| `NOT_READY` | everything else (shells / incomplete drafts) |

Publishing still requires the existing `getPublishIssues` gate (image, source, last checked, approved status, etc.).

---

## Files

| File | Role |
|------|------|
| `app/admin/production/page.tsx` | Server page |
| `components/admin/admin-production-dashboard.tsx` | Client UI (filters/tables) |
| `lib/admin/production-dashboard.ts` | Pure readiness / stats / filters |
| `lib/admin/production-dashboard-data.ts` | Loads cars + related image/variant/candidate counts |
| `components/admin/admin-nav.tsx` | Nav link |
| `tests/production-dashboard.test.ts` | Unit tests |
| `docs/PRODUCTION_DASHBOARD.md` | This document |

---

## Safety

- Never auto-publishes
- Never auto-approves
- Never mutates cars when opening the dashboard
- Does not redesign research, import, review, or publishing
- Does not add tables or columns

---

## How editors should use it

1. Open `/admin/production`
2. Check **Publish queue** for models ready for human approval
3. Open Review → rewrite drafts, attach/approve images, resolve conflicts
4. Approve manually in Car Editor when the production checklist passes
5. Publish manually afterwards (approval ≠ publish)
