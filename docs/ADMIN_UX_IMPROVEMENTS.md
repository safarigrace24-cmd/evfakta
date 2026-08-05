# Admin CMS UX Improvements

Editor-experience improvements for the EVFAKTA Admin CMS.  
**No redesign. No schema changes. No production workflow changes. No removed functionality.**

## What changed

### 1. Review Assistant clarity
- Completion now shows a **progress bar**, **glyph bar**, **percentage**, and **status text**.
- Status:
  - `< 95%` → `Needs Review`
  - `≥ 95%` → `🟢 Ready for Publish`

### 2. AI Status (honest, per-service)
Replaced the misleading “whole assistant unavailable” copy with per-service status:

- `🟢 AI Text Available` / `🟠 AI Text unavailable`
- `🟢 AI Image Available (OpenAI)` / `🟠 AI Image unavailable (OpenAI)`
- `🟢 Google Image Available` / `🟠 Google Image unavailable`

The sidebar only says all AI services are unavailable when **text and every image path** fail.

Draft generation errors now say **AI Text** failed (image fallback may still work).

### 3. Clickable launch blockers
Publish / launch blockers in the Review Assistant are clickable and jump to the right editor tab/section, e.g.:

| Blocker | Jump |
|---------|------|
| Battery | Specifications → Battery |
| Images / hero / front / side | Images tab |
| Editorial / draft markers | Editorial tab |
| Missing sources / last checked | Sources tab |
| Missing identity / SEO title | Overview → Identity |

### 4. Field Review cards
- Status labels: `🟢 Approved` / `🟠 Pending` / `🔴 Rejected`
- Confidence shown as a progress meter
- Highlight bands: Below 70%, Below 90%, Below 95%, 95%+

### 5. Editorial Assistant — Improve all
New button: **✨ Improve all editorial text**

- Generates preview drafts (description, summary, FAQ, SEO title, meta description, metadata)
- **Never auto-saves**
- Shows preview first
- Editor must click **Apply** (buffer only; paste into form manually)

Existing generate / rewrite / shorten / SEO / FAQ / metadata actions remain.

### 6. Publish button
Publish stays disabled unless Review Assistant `canPublish` is true (existing gates):

- Completion ≥ 95%
- Image readiness (hero/front/side)
- Launch/publish readiness
- No draft markers
- No missing required fields / approval when required

Hover (`title`) lists **exactly** why publishing is blocked.

### 7. Missing data panel
Each missing checklist item is clickable and opens the matching tab/section.

### 8. Header production summary
Editor header now shows:

- Completion %
- Images ✓/—
- Editorial ✓/—
- Specifications ✓/—
- SEO ✓/—
- Publish Ready ✓/—
- Import status + Published

### 9. Images tab workflow summary
Inside Images tab (above existing gallery controls):

- Official images
- AI candidates
- Pending / Approved / Rejected
- Hero / Gallery counts
- Generation history + link to Image Review

Existing upload / AI generate / reorder / primary workflow is unchanged.

## Files touched (high level)

- `components/admin/admin-editorial-assistant.tsx`
- `components/admin/admin-car-editor-header.tsx`
- `components/admin/admin-car-editor-workspace.tsx`
- `components/admin/admin-field-review-cards.tsx`
- `components/admin/admin-car-gallery.tsx`
- `components/admin/admin-car-form.tsx` (section anchors only)
- `app/admin/editorial-actions.ts`
- `app/admin/ai-image-actions.ts`
- `lib/admin/editor-navigation.ts`
- `lib/admin/admin-ai-status.ts`
- `app/globals.css`
- `tests/editor-navigation.test.ts`

## QA

```bash
npm run lint
npm test
npm run build
```

## Out of scope / unchanged

- Database schema
- Publish readiness rules (presentation + navigation only)
- Auto-publish / auto-approve behaviour
- Public site design
- Commit / push (intentionally not done)
