# EVFAKTA Image Production Standard

**Status:** Permanent production standard  
**Audience:** Editorial Production Assistant + human editors  
**Related:** `docs/IMAGE_REVIEW_WORKFLOW.md`, `docs/REFERENCE_WORKFLOW.md`, `docs/PRODUCTION_CHECKLIST.md`, `docs/RESEARCH_PIPELINE.md`

This document is the **source of truth** for vehicle image production on EVFAKTA.

The human editor must only need to:

1. Review candidates  
2. Approve or reject  
3. Choose the hero image  
4. Publish the car manually  

No image is auto-approved. No image is auto-published. No car is published by image workflows.

---

## Approved sources

Use only:

- Official manufacturer websites  
- Official Norwegian manufacturer / importer websites  
- Official manufacturer media / press sites  
- Official manufacturer configurator / CDN images  
- Official press kits  
- Images uploaded by the EVFAKTA owner  
- Images with **explicit** reusable licensing  

Google may be used **only** to find the official manufacturer page.  
Never store a Google Images / `imgres` / search-result URL as `source_url` or `original_url`.

---

## Rejected sources

Do **not** use:

- Random Google Images results  
- Pinterest  
- Social media reposts (Facebook, Instagram, TikTok, X/Twitter, Reddit)  
- Dealer photos without clear permission  
- Watermarked images  
- Stock photos pretending to show the exact model  
- AI-generated images presented as factual vehicle photography  

Code enforcement (soft + hard):

- Collection filters reject known aggregator hosts (`lib/admin/image-production.ts`)  
- Image Review **cannot approve** rejected-source candidates  
- Import gallery apply rejects the same hosts  

---

## Image types

Collect where available:

| Type | Notes |
|------|--------|
| Hero | Card / primary display — chosen by editor |
| Front | Required for Image Ready |
| Front three-quarter | Recommended |
| Side | Required for Image Ready |
| Rear | Recommended |
| Rear three-quarter | Recommended |
| Interior | Recommended |
| Dashboard | Optional |
| Rear seats | Optional |
| Cargo | Optional |
| Charging port | Optional |
| Detail | Optional |
| Lifestyle exterior | Optional |

**Minimum for Image Ready:** Hero + Front + Side  
**Strongly preferred complete set:** + Rear + Interior  

---

## Source metadata (every candidate)

Stored on `research_image_candidates` (existing schema — no new tables required):

| Field | Purpose |
|-------|---------|
| Linked car via research item / `car_id` | Model identity |
| `image_type` | Front / side / rear / interior / … |
| `original_url` | Direct image file URL |
| `source_name` | Manufacturer / press kit name |
| `source_url` | Official page (never a Google result) |
| `license_note` | Rights / press terms reminder |
| `usage_terms` | Usage conditions |
| `alt_text` | Accessibility / identity |
| `notes` | Resolution, date checked, identity warnings |
| `status` | `pending` → `approved` / `rejected` → `applied` |
| `is_primary_candidate` | Hero nomination (editor-controlled) |
| `storage_path` / `applied_image_id` | After attach |

If rights are unclear:

- Keep candidate **pending**  
- Add warning **Unclear usage rights**  
- Do **not** approve  
- Do **not** attach  

If model identity is uncertain, mark notes with:

`Needs Manual Identity Check`

---

## Research process

When a car has no (or incomplete) image candidates:

1. Official Norwegian sources first (`lib/admin/research/sources.ts` presets)  
2. Official global manufacturer sources second  
3. Official media / press resources third  
4. Collect best candidate **file** URLs only  
5. Deduplicate identical URLs  
6. Reject broken / aggregator URLs  
7. Flag low resolution when dimensions are known  
8. Flag wrong trim / year / market when suspected  

Do not guess which model an image belongs to.

Candidates are created as `status = pending` only.

---

## Review process

Every candidate must appear in:

**`/admin/images/[carId]`**

Editor can:

- Preview  
- Approve  
- Reject  
- Choose / replace Hero  
- Open full size  
- Open source  

Overview: `/admin/images`  
Production signals: `/admin/production`  

No image may bypass Image Review.

Details: `docs/IMAGE_REVIEW_WORKFLOW.md`

---

## Approval process

**Never** approve automatically.  
**Never** choose Hero automatically.  
**Never** publish automatically.

When the editor approves:

1. Require a durable local **review copy** in Storage (already downloaded at candidate creation / Image Review open)
2. Reject known bad sources and **Download Failed** candidates
3. **Promote** the review copy into the gallery Storage path (server-side copy — do **not** re-fetch the OEM URL)
4. Create / update `car_images` with the Storage public URL
5. Preserve original URL + rights notes on the candidate (`applied`)
6. Keep rejected history forever

Approve never sets `import_status` or `is_published`.

Candidate creation downloads immediately:

1. Fetch `original_url` server-side once  
2. Process with Sharp → WebP (max 1600×1600, quality 82)  
3. Store under `car-images/{brand}/{model}/review-{id}.webp`  
4. Keep `original_url` + provenance on the row  
5. On failure → mark notes **Download Failed** (no preview URL)
6. Permanently failed roles automatically queue replacement research (history retained; Image Review hides failed cards by default)

---

## Storage rules

Bucket: `car-images` (existing)

Preferred path structure for **new** approved uploads:

```text
car-images/
  {brand-slug}/
    {model-slug}/
      review-{id}.webp   # temporary Image Review copy (before approve)
      hero-{id}.webp
      front-{id}.webp
      side-{id}.webp
      rear-{id}.webp
      interior-{id}.webp
      gallery-{id}.webp

  {brand-slug}/
    {model-slug}/
      {variant-slug}/
        ...
```

Unique IDs prevent overwriting unrelated approved images.  
Legacy paths `{slug}/{uuid}.webp` remain valid for existing assets.
Image Review previews **only** Storage URLs — never manufacturer CDN hotlinks.

---

## Optimization rules

For **approved** images only:

- Preserve aspect ratio  
- No stretch  
- No aggressive crop of the vehicle  
- Strip unnecessary processing metadata via Sharp pipeline  
- Output optimized WebP  
- Max edge 1600 px (without enlargement)  

Public delivery continues through existing Next.js `Image` / public URL helpers.  
Do **not** create a second parallel image system.

---

## Public usage

After the **car is published**, attached gallery images feed:

- Homepage model cards  
- Models catalog  
- Brand pages  
- Model page gallery  
- Compare  
- Favorites  
- Related models  

Rules:

- Hero (`is_primary` / `cars.image_url`) → cards and primary display  
- Other approved `car_images` → gallery  
- Pending / rejected candidates → **never** public  
- Unpublished cars → gallery RLS keeps images private  

---

## Image readiness

| Label | Rule |
|-------|------|
| **Image Ready** | Approved Hero + Front + Side |
| **Images Pending Review** | Anything else |

Informational for Production / Image Review.  
Publish still requires gallery attach + editorial gates (`docs/PRODUCTION_CHECKLIST.md`).

Required for every future model batch: Image Ready before human publish approval.

---

## Legal / rights warnings

Surface in Image Review when applicable:

- Rejected source  
- Unclear usage rights  
- Missing attribution  
- Low resolution  
- Duplicate  
- Broken URL  
- Unsupported file type  
- Needs Manual Identity Check  

Do not invent usage rights.  
Do not silently replace an editor-approved Storage object — upload a new file and let the editor confirm.

---

## Production batch integration

Image production is **mandatory** for every brand / model batch.

For every batch:

1. Check whether each model has image candidates  
2. Collect missing official candidates into `research_image_candidates` (`pending`)  
3. Update the production report with image metrics  
4. Include exact Image Review URLs: `/admin/images/{carId}`  

Report helpers (code):

- `buildImageProductionModelReport`  
- `summarizeImageProductionBatch`  
- `formatImageProductionBatchMarkdown`  

in `lib/admin/image-production.ts`

Required report fields:

- Number of models  
- Candidates collected  
- Image types found  
- Broken candidates  
- Rights warnings  
- Low-resolution warnings  
- Models Image Ready  
- Models Images Pending  
- Exact Image Review admin paths  

Production dashboard rows also expose `imageReviewPath`.

---

## Safety checklist

Never:

- Auto-approve images  
- Auto-publish models  
- Invent usage rights  
- Use random Google images  
- Use AI-generated model photos as factual photography  
- Overwrite editor-approved images without confirmation  
- Remove rejected history  
- Modify database schema unless absolutely required  

---

## Implementation map

| Concern | Location |
|---------|----------|
| Policy + reports | `lib/admin/image-production.ts` |
| Readiness / review cards | `lib/admin/image-review.ts` |
| Approve / reject / hero actions | `app/admin/image-review-actions.ts` |
| Attach + Storage upload | `lib/admin/research/apply.ts` |
| Manual gallery upload | `app/admin/gallery-actions.ts` |
| Research extract filter | `lib/admin/research/extract.ts` |
| Admin UI | `/admin/images`, `/admin/images/[carId]` |
| Production signals | `/admin/production` |

---

## Document control

| Item | Value |
|------|--------|
| Document | `docs/IMAGE_PRODUCTION_STANDARD.md` |
| Owners | EVFAKTA editorial production |
| Change policy | Update when image production process changes; do not redesign CMS here |
