# EVFAKTA AI Image Candidate Workflow

**Status:** Safe secondary workflow (does not replace official-image production)  
**Audience:** Image Production Assistant + human editors  
**Related:** `docs/IMAGE_PRODUCTION_STANDARD.md`, `docs/IMAGE_REVIEW_WORKFLOW.md`

Official manufacturer photography remains the **preferred** source for vehicle model pages.

AI-generated images must **never** be presented as official manufacturer photography.

Every generated image must be marked:

> **AI-generert illustrasjon**  
> **Ikke offisielt produsentbilde**

Nothing may appear publicly before manual approval of the **car** (`is_published`) and of the **image** in Image Review.

---

## Admin workflow (three-image standard)

Primary vehicle-page AI flow: **`docs/THREE_IMAGE_AI_WORKFLOW.md`**.

Default roles: **Front · Interior · Rear** (3 alternatives each).  
Side / Charging / Cargo / banners are not generated unless explicitly requested.

The AI Image Generator is **admin-only**. It must never appear on the public website.

### Locations

| Surface | Path |
|---------|------|
| Car Editor → Images tab | `/admin/biler/[carId]/rediger` |
| Image Review (optional) | `/admin/images/[carId]` |

Images tab actions:

1. **Last opp bilder**  
2. **Generer 3 AI-bilder** (primary)  
3. **Lag AI-bilde (eksplisitt)** (optional single / editor-requested detail)

Non-admin callers receive **`403 Forbidden`**.

### Generation modal

1. **Vehicle context** — Brand, Model, Variant, Model year, current approved Hero (if any)  
2. **Provider status + cost placeholder** — active `AI_PROVIDER` health; cost estimate is a placeholder until metering exists  
3. **Official preference** — shows when official gallery images exist; **Replace AI with official image** archives AI candidates (never deletes; never auto-publishes)  
4. **Image type** — Hero, Front, Front Three Quarter, Side, Rear, Interior, Charging, Cargo, Article Cover, Homepage Banner, Social Media  
5. **Prompt editor** — auto-built from model data; editor may edit Prompt, Negative Prompt, Style, Aspect Ratio  
6. **Generate Image** — via the active `AI_PROVIDER` adapter (`docs/AI_PROVIDER_ARCHITECTURE.md`). Until an adapter is connected, **Awaiting Generation** + manual upload. Editors never choose a provider.  
7. **Preview** — Approve / Reject / Generate Again / Upload Different Version  
8. **Generation history + compare** — session history of previews; side-by-side compare of previous generations  

### Generator quality check (before sending to review)

Approve in the modal stays disabled until all are checked:

- Correct vehicle  
- Correct front  
- Correct headlights  
- Correct proportions  
- Correct wheels  
- Correct body shape  
- No AI artifacts  
- Safe for public use  

**Approve → Image Review** creates a **Pending** AI candidate in Storage and opens `/admin/images/[carId]`.  
It does **not** gallery-approve, does **not** set Hero, and does **not** publish.

### Final Quality Review + Approval

Final approve/reject/hero still happens in **Image Review** with the full Visual Quality Review checklist + **Visually verified** gate (see below).

### Hero

Hero selection requires a separate confirmation after Approved + Visually verified.  
Hero is **never** automatic.

### Storage

Uses the existing `research_image_candidates` + `car-images` Storage review-copy workflow.  
Metadata in `notes`: prompt, negative prompt, style, aspect ratio, generated_at, editor, usage type, approval history.  
No second image system. No fake manufacturer URLs.

### Replacement by official images

When official manufacturer photography becomes available:

- Prefer the official image publicly  
- Keep the AI candidate in **Editorial Archive** / history  
- Do not delete  

---

## When AI images may be created

Use AI generation only when:

- official image candidates are unavailable  
- official URLs are broken  
- usage rights are unclear  
- the editor explicitly requests an illustration  
- the image is intended for articles, homepage banners, or social media  

Do **not** create AI images when verified official photography is available.

---

## Model-page restrictions

For vehicle model pages:

- never claim the image is an exact representation  
- never invent a trim, model year, wheel design, badge, or interior detail  
- do not add fake manufacturer logos  
- do not add fake license plates  
- do not show technical details that are not verified  

Prefer a clean neutral studio-style illustration (Design System 2.0: forest green `#0F6B45`, background `#F7F8F6`, Scandinavian composition, realistic lighting, minimal noise).

Visible internal warning:

> Illustrative image — verify against official model before public use.

Do not generate factual interior, dashboard, charging-port, cargo, or technical-detail images unless the editor explicitly requests them (`editor_requested_detail` + change request required).

---

## Human review (Image Review)

All AI candidates appear in **Image Review** (`/admin/images/[carId]`).

The editor can:

| Action | Behavior |
|--------|----------|
| Preview | Storage preview when bytes exist; Awaiting Generation placeholder otherwise |
| Approve | Requires full Visual Quality Review + **Visually verified** + AI acknowledgment — never auto-approve |
| Reject | History retained |
| Regenerate | Creates a **new** pending candidate with updated prompt; previous kept |
| Request changes | Stored on the prior candidate + used in the new prompt |
| Choose usage type | Hero / front 3/4 / side / article / homepage / social / editor detail |
| Choose Hero | Requires **Approved** + **Visually verified** + explicit Hero confirmation — never auto-hero |

Never auto-approve.  
Never auto-select Hero.  
Never auto-publish.

---

## Visual Quality Review

No AI-generated vehicle image may be approved unless a human confirms that it visually represents the correct vehicle.

### Review panel (every AI candidate)

| Field | Meaning |
|-------|---------|
| AI Confidence | Low (awaiting) · Medium (generated, unverified) · High (visually verified) |
| Visual Review | Awaiting Generation · Not visually verified · Visually verified · Editorial Archive |
| Official image available? | Yes / No (official gallery photography preferred) |
| Recommended action | Next editorial step for this candidate |

Visible badges on every AI card:

- **Illustrative image**  
- **Not official manufacturer photography**

### Approval checklist (mandatory)

The editor must explicitly confirm **all** of:

- Overall vehicle identity is correct  
- Front design matches the official vehicle  
- Headlights are correct  
- Body shape is correct  
- Doors and proportions are correct  
- Wheels look realistic  
- Rear design (if visible) matches  
- Vehicle color is acceptable  
- No obvious AI artifacts  
- No incorrect manufacturer badges  
- No fictional trim details  
- Safe for public display  

Then confirm:

> **Visually verified**

The **Approve** button stays disabled until Visually verified is confirmed (after the full checklist).

Encoded in `notes` (no schema change): `visual_checklist:…` + `visual_review:verified`.

### Hero restrictions

An AI image cannot be selected as Hero unless:

1. Status is **Approved** (or applied)  
2. **Visually verified** is recorded  
3. Editor gives an explicit Hero confirmation  
4. Candidate is **not** in Editorial Archive  

### Public usage

AI illustrations may appear publicly only when:

1. Officially approved in Image Review  
2. Visually verified  
3. Clearly labeled as an illustration  
4. No official manufacturer image exists  
5. The car is published intentionally (separate action)  

Helper: `canAiIllustrationAppearPublicly` in `lib/admin/ai-image-candidates.ts`.

**Image Ready** still requires official photography. AI never satisfies Image Ready.

### Official replacement rules

When an official manufacturer image becomes available:

1. Official image is **automatically preferred**  
2. AI illustrations for that car move to **Editorial Archive** (`editorial-archive` in notes)  
3. AI hero nomination is cleared (`is_primary_candidate = false`)  
4. AI gallery primary flags are cleared  
5. The AI row is **not deleted**  

Triggered when opening Image Review if official gallery rows exist, and when an official candidate is approved. Manual archive remains available via `markAiIllustrationEditorialOnlyAction`.

---

## Image types (allowed)

- Hero illustration  
- Front three-quarter illustration  
- Side illustration  
- Article cover  
- Homepage banner  
- Social media image  
- Editor-requested detail (explicit only)  

---

## Generation capability

If image-generation is **not** available in the current environment:

1. Do **not** fabricate an image  
2. Create a high-quality generation prompt  
3. Mark the candidate **Awaiting Generation**  
4. Wait for the editor to generate externally or upload the image into Image Review  

Uploaded bytes are stored in the existing `car-images` Storage bucket as a review WebP (same architecture as official candidates).

---

## Storage and metadata (no schema change)

Candidates reuse `research_image_candidates` + Image Review.

| Requirement | Existing field encoding |
|-------------|-------------------------|
| car_id | via `research_items.existing_car_id` |
| model name | `notes` → `model:…` |
| image type | `image_type` (+ `usage:…` in notes) |
| generation prompt | `notes` → `generation_prompt:«…»` |
| generated_at | `notes` → `generated_at:…` |
| source_name | `EVFAKTA AI Illustration` |
| source_category | `notes` → `source_category:ai_generated` |
| status | `pending` until human approve/reject |
| usage note | `notes` → `usage_note:…` |
| warning | `license_note` / `usage_terms` / `notes` → Not official manufacturer photography |
| visual checklist | `notes` → `visual_checklist:vehicle_identity,…` |
| visually verified | `notes` → `visual_review:verified` |
| editorial archive | `notes` → `editorial-archive` (+ editorial-use-only) |
| approval history | `notes` → `approval_event:…` |

- `source_url` stays **null** (no fake manufacturer URLs)  
- Awaiting Generation uses provenance placeholder `evfakta-ai-illustration:awaiting-generation` (not an OEM URL)  
- After upload, `original_url` is the EVFAKTA Storage public URL  

---

## Labeling

| Surface | Label |
|---------|--------|
| Image Review card | **Illustrative image** + **Not official manufacturer photography** |
| Quality warnings | AI-generated · Not official · Awaiting Generation · Not visually verified · Editorial Archive |
| Alt text | Includes “AI-generated illustration, not official manufacturer photography” |
| Gallery list | Shows “AI illustration” when alt text marks it |

---

## Code map

| Piece | Path |
|-------|------|
| Pure helpers / prompts | `lib/admin/ai-image-candidates.ts` |
| Generator modal helpers | `lib/admin/ai-image-generator.ts` |
| Provider facade | `lib/admin/ai-image-provider.ts` |
| Provider abstraction | `lib/admin/ai-providers/` — see `docs/AI_PROVIDER_ARCHITECTURE.md` |
| Create / upload service | `lib/admin/ai-image-candidate-service.ts` |
| Admin actions | `app/admin/ai-image-actions.ts` |
| Approve / Hero gates | `app/admin/image-review-actions.ts` |
| Lag AI-bilde modal | `components/admin/admin-ai-image-generator-modal.tsx` |
| Images tab button | `components/admin/admin-car-gallery.tsx` |
| Image Review UI panel | `components/admin/admin-ai-illustration-panel.tsx` |
| Workspace integration | `components/admin/admin-image-review-workspace.tsx` |

---

## Safety checklist

- [ ] No automatic approval  
- [ ] No automatic publication  
- [ ] No AI image described as official  
- [ ] Approve disabled until Visually verified  
- [ ] Hero requires Approved + Visually verified  
- [ ] Official images remain preferred (AI → Editorial Archive)  
- [ ] Existing official Image Review workflow unchanged in intent  
- [ ] No commit / push required for this documentation alone  
