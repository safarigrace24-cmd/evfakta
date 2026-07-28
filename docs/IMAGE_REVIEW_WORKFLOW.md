# EVFAKTA Image Review Workflow

Editorial review for images already collected during research.

**Permanent production standard:** `docs/IMAGE_PRODUCTION_STANDARD.md`  
(source policy, storage, optimization, batch reporting, Image Ready rules)

This is **not** an upload system and **not** a CMS redesign.

Images are **never** automatically approved.  
Images are **never** automatically published.  
Rejected images are **never** deleted automatically.

---

## Where it lives

| Surface | Path |
|---------|------|
| Overview | `/admin/images` |
| Per-model review | `/admin/images/[carId]` |
| Production dashboard signals | `/admin/production` |
| Research collection (upstream) | `/admin/import/research` |

Candidates are stored in `research_image_candidates` (existing research pipeline).  
Approved/attached gallery rows live in `car_images`.

No new database tables are required for this workflow.

---

## Editor workflow

1. Research / batch scripts collect image candidates (`status = pending`).
2. Open **Images** in admin (or Production → Review Images).
3. Open a model.
4. Review every candidate card:
   - Preview
   - Image type
   - Source / source URL
   - Resolution (when noted)
   - Status
   - Quality warnings
5. Act:
   - **Approve** — marks Approved and attempts gallery attach
   - **Reject** — marks Rejected; kept in history
   - **Choose Hero Image** / **Replace Hero** — exactly one hero per model
   - **Preview Full Size**
   - **Open Source**
6. When Hero + Front + Side are approved, the model shows **Image Ready**.
7. Publication of the car remains a separate manual action.

---

## Status values (editor-facing)

| Editor label | DB status |
|--------------|-----------|
| Candidate | `pending` |
| Approved | `approved` or `applied` |
| Rejected | `rejected` |

`applied` means the candidate was attached into `car_images`.  
It still displays as **Approved** in the Image Review UI.

---

## Approval process

- Only an admin action can approve.
- Approve never sets `import_status` or `is_published`.
- Approve may attach the file into `car_images` so it can appear on public surfaces **after** the car is published.
- Source-page URLs (not real image files) cannot be approved as images — upload manually in the car gallery instead.
- Reject keeps the row for history. Nothing is auto-deleted.

---

## Hero selection

- Hero is represented by `is_primary_candidate` on candidates and `is_primary` on gallery rows.
- Only **one** hero per model.
- **Choose Hero Image** clears other hero flags for that model.
- **Replace Hero** is the same action when a hero already exists.
- If the chosen candidate is already in the gallery, primary gallery + `cars.image_url` are synced.

---

## Publication requirements (image readiness)

Dashboard / Image Review label:

### Image Ready

Only when **all** are true:

1. Hero approved
2. Front approved
3. Side approved

Approved means:

- Gallery row of that type / primary, **or**
- Candidate with status `approved` / `applied` of that type / primary

### Images Pending Review

Anything else.

These labels are **informational**. They do not publish or approve the car.

---

## Where approved gallery images appear

After a car is published, attached `car_images` (and primary `cars.image_url`) feed:

- Homepage
- Brand pages
- Model cards
- Compare
- Favorites
- Model page gallery

Candidates that are only `pending` / `rejected` never appear publicly.

---

## Quality warnings

Cards may show:

| Warning | Meaning |
|---------|---------|
| Low resolution | Noted dimensions below 800×600 |
| Duplicate | Same original URL already listed for the model |
| Broken URL | Not a fetchable image file URL (often a source page) |
| Missing attribution | No source name / source URL |

Warnings guide editors; they do not auto-reject.

---

## Production dashboard

Added counters / filters:

- **Images Ready**
- **Images Pending**
- **Missing Hero**
- **Missing Gallery**

These are derived views only. They do not change workflow state.

---

## Failed candidates + automatic replacement

When a candidate is permanently marked:

- **Download Failed**
- **HTTP 410**
- **No local review copy**

the system:

1. Keeps the failed row in history (`superseded` when replaced)
2. Queues a replacement **image-role research job** for that role (Hero / Front / Side / …)
3. Searches the official source page for alternate downloadable assets
4. Downloads immediately into EVFAKTA Storage
5. Inserts a new **pending** candidate (never auto-approved, never auto-Hero)

Image Review **hides** failed / superseded candidates by default.  
Editors normally only see usable Storage-backed candidates.

If no official replacement is found:

> No official image available yet.

---

## Preview storage (critical)

Image Review **never** hotlinks manufacturer CDN URLs.

Flow:

1. Candidate is created with `original_url` + source metadata (preserved forever)
2. Server downloads the image immediately into Supabase Storage (`car-images`, role `review`)
3. Image Review previews **only** the local Storage URL
4. On approve → promote/copy the review file into the gallery path (**no re-download**)
5. If download fails → notes marked **Download Failed** (no dead preview URL)

Restarting the app does not break previews — they live in EVFAKTA Storage.

---

## Safety rules

- No automatic approval
- No automatic publication
- No automatic deletion
- No schema redesign required
- Manual car approval / publish remain separate
- No OEM CDN hotlinking in Image Review
