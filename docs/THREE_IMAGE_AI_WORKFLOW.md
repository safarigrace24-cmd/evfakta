# EVFAKTA Three-Image AI Workflow

**Status:** Active admin workflow (does not replace official manufacturer photography)  
**Date:** 2026-08-06  
**Related:** `docs/AI_IMAGE_CANDIDATE_WORKFLOW.md`, `docs/AI_PROVIDER_ARCHITECTURE.md`, `docs/IMAGE_REVIEW_WORKFLOW.md`

---

## Standard

For each vehicle, AI generation defaults to **exactly three roles**:

1. **Front**
2. **Interior**
3. **Rear**

Do **not** auto-generate Side, Charging, Cargo, Lifestyle, Banner, Social, or extra gallery images unless an admin explicitly requests them later via **Lag AI-bilde (eksplisitt)** → *Editor-requested detail*.

---

## Admin action

**Images tab** → **Generer 3 AI-bilder**

Creates up to **3 pending alternatives per missing role**:

| Role | Alternatives |
|------|:------------:|
| Front | Option 1 / 2 / 3 |
| Interior | Option 1 / 2 / 3 |
| Rear | Option 1 / 2 / 3 |

### Existing vehicles

- Never delete already approved official images.
- Generate **only missing** roles among Front / Interior / Rear.
- If Front already exists in the gallery → generate Interior + Rear only.

### Editor actions per alternative

- **Select** — mark preferred (still Pending)
- **Reject** — reject candidate (history kept)
- **Generate again** — reject prior pending alts for that role, create 3 new ones
- **Open full size**

---

## Approval

Selected candidates remain **Pending** until Image Review:

1. Visual quality checklist
2. Confirm identity / front-rear / body / interior / badges / artifacts / safe for public
3. Manual approve → attach to `car_images`
4. **Hero** from approved Front requires a **separate** confirmation (`confirmAiHero`)
5. Never auto-publish the car

Internal label on every AI candidate:

> AI-generert illustrasjon – ikke offisielt produsentbilde

---

## Public gallery

Completed AI gallery order:

1. Front / Hero  
2. Interior  
3. Rear  

Other image types (official Side, etc.) sort after these three. AI images are never added to the public gallery automatically without approve + car publish.

---

## Providers

| Priority | Provider |
|----------|----------|
| Primary | Google Gemini |
| Fallback | OpenAI Images |

Editors never choose a provider. Failures from quota / billing / 429 / unavailable / timeout trigger automatic OpenAI fallback. Provider id is stored in candidate notes (`ai_provider:…`).

---

## Admin summary

| Field | Values |
|-------|--------|
| Front | Missing / Pending / Approved |
| Interior | Missing / Pending / Approved |
| Rear | Missing / Pending / Approved |
| Gallery Complete | **YES** only when all three are Approved |

---

## Implementation map

| Piece | Path |
|-------|------|
| Pure helpers | `lib/admin/three-image-ai-workflow.ts` |
| Generate / select / reject | `app/admin/ai-image-actions.ts` |
| Images tab UI | `components/admin/admin-three-image-workflow.tsx` |
| Gallery host | `components/admin/admin-car-gallery.tsx` |
| Public order | `lib/cars/get-published-cars.ts` (`mapGalleryImages`) |
| Tests | `tests/three-image-ai-workflow.test.ts` |
| Seal U verify script | `scripts/verify-three-image-ai-seal-u.ts` |

---

## Safety

- No auto-approve  
- No auto-Hero  
- No auto-publish  
- No duplicate pending alternatives after retry (prior pending rejected first)  
- No API keys in UI  
- Official Image Ready (Hero + Front + Side for launch batches) is unchanged — this workflow is the AI illustration standard for vehicle pages when official photography is incomplete
