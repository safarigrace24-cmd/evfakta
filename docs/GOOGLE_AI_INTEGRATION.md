# Google AI / Gemini image + text integration (EVFAKTA)

Admin-only Google AI Studio (Gemini) for images and editorial drafts.

Related: `docs/AI_PROVIDER_ARCHITECTURE.md`, `docs/AI_IMAGE_CANDIDATE_WORKFLOW.md`

---

## Required environment variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `AI_PROVIDER=google` | Server | Primary Google image adapter |
| `GOOGLE_AI_API_KEY` | **Server only** | Google AI Studio / Gemini API key |
| `GOOGLE_AI_IMAGES_ENABLED=false` | Server | Image generation flag |
| `OPENAI_API_KEY` | **Server only** | OpenAI Images automatic fallback |
| `OPENAI_IMAGE_MODEL` | Optional | Default `gpt-image-1` |
| `GOOGLE_AI_TEXT_ENABLED=false` | Server | Editorial text drafts flag |
| `GOOGLE_AI_IMAGE_MODEL` | Optional | Default `gemini-2.5-flash-image` (single config point) |
| `GOOGLE_AI_TEXT_MODEL` | Optional | Default `gemini-2.5-flash` |

Never use `NEXT_PUBLIC_` for `GOOGLE_AI_API_KEY`.

---

## Image model verification (2026-08-02)

Live Models API returned these **stable** Gemini image models (Imagen 4 and `*-preview` aliases were not used):

1. `gemini-3.1-flash-image`
2. `gemini-3.1-flash-lite-image`
3. `gemini-3-pro-image`
4. `gemini-2.5-flash-image`

Each received **one** sequential `generateContent` test (no parallel requests; wait between calls).

| Model | HTTP | Quota tier | Image returned | Result |
|-------|------|------------|----------------|--------|
| `gemini-3.1-flash-image` | 429 | FreeTier | No | FAIL — `RESOURCE_EXHAUSTED`, FreeTier quotas |
| `gemini-3.1-flash-lite-image` | 429 | FreeTier | No | FAIL — same |
| `gemini-3-pro-image` | 429 | FreeTier | No | FAIL — same |
| `gemini-2.5-flash-image` | 429 | FreeTier | No | FAIL — same |

**Selected production model:** none (no successful image bytes).  
Default env model remains `gemini-2.5-flash-image` via `getGoogleAiImageModel()` / `GOOGLE_AI_IMAGE_MODEL`.  
**Do not** set `GOOGLE_AI_IMAGES_ENABLED=true` until a real generation returns image bytes.

---

## Quota behaviour

- Image calls currently hit **FreeTier** quotas with effective **limit 0**, even when the project is believed to be Tier 1 for other products.
- Gemini **text** drafts can succeed while **image** models remain blocked.
- Category `quota_limit_0` → Norwegian admin message; **not** retried.
- Temporary rate limits (`Retry-After` / rate-limit wording without FreeTier zero) → retryable.
- Billing / model unavailable → not retried; clear admin copy.

Admin message when image quota is inactive:

> Google har ikke aktivert bildekvote for dette prosjektet ennå. Du kan laste opp et generert bilde manuelt.

---

## Retry policy (images)

Implemented in `lib/admin/ai-providers/google-provider.ts`:

- At most **2 retries** after the first failure (max 3 HTTP attempts)
- Exponential backoff (`1s`, `2s`), capped; respects `Retry-After` when present (max 30s)
- **No continuous retry loop**
- **No retry** on FreeTier / limit 0 / billing / model unavailable / auth
- Retries happen **inside one** `generate()` call — preview/accept actions do **not** create duplicate pending candidates from retry noise

---

## Fallback / manual upload

**Automatic:** When `AI_PROVIDER=google` and Google image generation fails (quota / billing / unavailable / HTTP 429, including flag off), the facade retries **once** with OpenAI Images (`OPENAI_API_KEY`). Google remains primary; editors never choose a provider. Gemini **text** is unchanged.

**Manual:** When Google and OpenAI both fail (or OpenAI key missing):

1. Prompt + image type preserved in Lag AI-bilde
2. Soft-fail to **Awaiting Generation** (no fake success image)
3. Admin can **Prøv igjen** or **Last opp resultat**
4. Manual bytes still go through Storage → Pending → Image Review
5. No auto-approve, auto-Hero, or auto-publish

---

## AI Image workflow

```
Admin → Car Editor → Images → Lag AI-bilde
  → Generate → Preview → Pending candidate
  → Image Review → Human approval
```

No automatic publish, hero, or approval.

---

## AI Text workflow (Editorial Assistant)

```
Admin → Editorial Assistant
  → Generate Description / FAQ / Summary / Suggest Metadata
  → Review draft in UI
  → Editor copies into fields manually
```

Nothing is stored automatically.

---

## Feature flags

Keep false until keys + health + **real image bytes** pass QA, then:

```bash
AI_PROVIDER=google
GOOGLE_AI_IMAGES_ENABLED=true
GOOGLE_AI_TEXT_ENABLED=true
# optional:
# GOOGLE_AI_IMAGE_MODEL=gemini-2.5-flash-image
```

---

## Security

- Server-side only for `GOOGLE_AI_API_KEY`
- Never log or print the key
- Never commit `.env.local`

---

## Code map

| Piece | Path |
|-------|------|
| Image adapter + retries | `lib/admin/ai-providers/google-provider.ts` |
| Model default + classification | `lib/admin/ai-providers/google-ai.ts` |
| Text client | `lib/admin/google-ai-text.ts` |
| Editorial prompts | `lib/admin/google-ai-editorial-drafts.ts` |
| Editorial actions | `app/admin/editorial-actions.ts` |
| Feature flags | `lib/integrations/feature-flags.ts` |
