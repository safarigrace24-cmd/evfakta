# EVFAKTA AI Provider Architecture

**Status: FINAL / LOCKED**

This document is the permanent EVFAKTA AI image architecture.  
Do not reverse provider priority. Do not redesign this system.

Related: `docs/AI_IMAGE_CANDIDATE_WORKFLOW.md` (editorial rules, Visual Quality Review, Image Ready).

---

## Permanent provider priority

| Role | Provider |
|------|----------|
| **Primary Provider** | **Google Gemini** |
| **Fallback Provider** | **OpenAI Images** |

**Never reverse this priority.**

- Google Gemini is always primary when `AI_PROVIDER=google`.
- OpenAI Images is **fallback only** — never the default primary for EVFAKTA production image generation.
- The editor must **never** notice the switch. No provider picker. No “switched to OpenAI” UI.

---

## Locked workflow

```
Google Gemini (PRIMARY)
        ↓
   If success
        ↓
   Use Google image
        ↓
   If Google fails because of:
     - quota
     - billing
     - 429
     - provider unavailable
     - timeout
        ↓
   Automatically use OpenAI Images (FALLBACK)
        ↓
   Same bytes → Storage → Pending → Image Review → Approve → Hero → Publish
```

Downstream editorial steps stay **exactly the same** regardless of which provider returned pixels:

1. **Storage** — EVFAKTA Storage review copy  
2. **Pending** — research image candidate `status=pending`  
3. **Image Review** — Visual Quality Review checklist  
4. **Approve** — manual only  
5. **Hero** — separate explicit confirmation (`confirmAiHero`)  
6. **Publish** — existing publish gates; never auto-publish  

No redesign of Lag AI-bilde, Image Review, Storage paths, or publish gates.

---

## Architecture

```
Admin UI (Lag AI-bilde)
        ↓
Server actions (app/admin/ai-image-actions.ts)
        ↓
Facade (lib/admin/ai-image-provider.ts)
        ↓
Automatic failover (lib/admin/ai-providers/failover.ts)
        ↓
Primary: Google Gemini  →  on eligible failure  →  Fallback: OpenAI Images (once)
        ↓  common AiImageProviderResult
Existing EVFAKTA Storage / candidate workflow
        ↓
Image Review (unchanged gates)
```

Rules:

1. **One interface** — every vendor implements `AIImageProvider`.
2. **Config selects primary** — `AI_PROVIDER=google` for production image AI. Editors never choose.
3. **Automatic Google → OpenAI failover** — hard-wired when primary is Google and failure is eligible.
4. **Common response** — callers never parse vendor JSON.
5. **Shared storage** — bytes always go through existing candidate/Storage helpers.
6. **No auto-approve / auto-hero / auto-publish** — provider success only creates a Pending candidate (or preview bytes).

---

## Failover conditions (LOCKED)

When `AI_PROVIDER=google`, OpenAI is tried **once** if Google fails for:

| Condition | Examples |
|-----------|----------|
| Quota | FreeTier `limit: 0`, quota exhausted |
| Billing | Billing / payment required |
| 429 | Rate limit / temporary rate limit |
| Provider unavailable | Feature flag off, missing key, adapter `unavailable` |
| Timeout / hard failure classed as unavailable | Adapter returns unavailable / eligible failure metadata |

Implementation: `lib/admin/ai-providers/failover.ts` via `generateWithAutomaticFailover()`.

If OpenAI also fails (or no `OPENAI_API_KEY`): soft-fail to **Awaiting Generation** + manual upload. Same Image Review gates.

---

## Configuration (production intent)

```bash
# PRIMARY — never reverse for EVFAKTA image generation
AI_PROVIDER=google

# Google Gemini (primary)
GOOGLE_AI_API_KEY=
GOOGLE_AI_IMAGES_ENABLED=true   # only when Google can return image bytes
# GOOGLE_AI_IMAGE_MODEL=gemini-2.5-flash-image

# FALLBACK ONLY — OpenAI Images
OPENAI_API_KEY=
# OPENAI_IMAGE_MODEL=gpt-image-1
```

Notes:

- If Google images are temporarily flag-disabled (`GOOGLE_AI_IMAGES_ENABLED=false`), the automatic OpenAI fallback still applies when primary is `google` — editors still see the same Lag AI-bilde flow.
- Setting `AI_PROVIDER=openai` as primary is **not** the EVFAKTA permanent architecture. Production priority remains Google → OpenAI fallback.

---

## Provider interface

Defined in `lib/admin/ai-providers/types.ts`:

```ts
interface AIImageProvider {
  readonly id: AiProviderId;
  readonly label: string;
  readonly capabilities: {
    remoteGenerate: boolean;
    regenerate: boolean;
    edit: boolean;
    asyncJobs: boolean;
  };

  generate(request): Promise<AiImageProviderResult>;
  regenerate(request): Promise<AiImageProviderResult>;
  edit(request): Promise<AiImageProviderResult>;
  getStatus(jobId): Promise<AiImageProviderResult>;
  cancel(jobId): Promise<AiImageProviderResult>;
  healthCheck(): Promise<AiProviderHealth>;
}
```

### Common response (`AiImageProviderResult`)

| Field | Purpose |
|-------|---------|
| `image` | `Buffer \| null` — pixels when generation succeeded |
| `metadata` | Provider-agnostic extras (model, fallback flags, etc.) |
| `prompt` | Prompt used |
| `provider` | Provider id that returned the result |
| `generationTimeMs` | Wall-clock duration |
| `warnings` | Soft issues for logs (not a provider picker) |
| `status` | `queued` \| `running` \| `completed` \| `failed` \| `cancelled` \| `unavailable` |
| `jobId` | Optional async job id |
| `unavailable` | Adapter not connected / not configured |

---

## Supported providers

Registered in `lib/admin/ai-providers/providers.ts`:

| Id | Label | Role |
|----|-------|------|
| `google` | Google AI Studio / Gemini | **PRIMARY** — permanent EVFAKTA primary |
| `openai` | OpenAI Images | **FALLBACK ONLY** — automatic when Google fails |
| `none` / `manual` | Manual only | Awaiting Generation / upload |
| `ideogram` | Ideogram | Stub — not connected |
| `flux` | Flux | Stub — not connected |
| `stable_diffusion` | Stable Diffusion | Stub — not connected |

### Google Gemini (primary)

- Endpoint: `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Model: `getGoogleAiImageModel()` ← `GOOGLE_AI_IMAGE_MODEL` or default `gemini-2.5-flash-image`
- Gated by `GOOGLE_AI_IMAGES_ENABLED` + `GOOGLE_AI_API_KEY`
- Retry inside the Google adapter: at most 2 retries; FreeTier limit 0 → no retry
- See `docs/GOOGLE_AI_INTEGRATION.md`

### OpenAI Images (fallback only)

- Used automatically once when Google fails under the conditions above
- Requires `OPENAI_API_KEY`
- Same Storage → Pending → Image Review path as Google success
- Editors never select OpenAI in the UI

---

## Storage (unchanged)

All providers must:

1. Return image bytes in `AiImageProviderResult.image` (or `unavailable`)
2. Let `createAiIllustrationCandidate` / `attachGeneratedBytesToAiCandidate` persist via the existing EVFAKTA Storage workflow

Do **not**:

- Store under vendor-specific paths
- Hotlink temporary vendor CDN URLs as permanent gallery sources
- Skip Image Review
- Auto-approve, auto-Hero, or auto-publish

---

## Editor workflow (LOCKED — unchanged)

```
Admin → Images → ✨ Lag AI-bilde
  → Generate (Google primary; OpenAI automatic fallback if eligible)
  → Preview / quality check
  → Accept → Pending candidate (Storage)
  → Image Review (Visual Quality Review → Approve → optional Hero with confirmAiHero)
  → Publish only via existing publish gates
```

Official photography remains preferred. AI never satisfies Image Ready alone.

---

## Security

- Provider keys are **server-only** — never `NEXT_PUBLIC_*`
- Non-admin callers receive **`403 Forbidden`** on AI actions
- Adapters must not log full API keys or raw credential headers
- Generated assets remain **illustrations**, never labeled as official manufacturer photography
- Provider success ≠ editorial approval

---

## Code map

| Piece | Path |
|-------|------|
| Interface + result types | `lib/admin/ai-providers/types.ts` |
| Stub base | `lib/admin/ai-providers/stub-provider.ts` |
| Registry / config | `lib/admin/ai-providers/registry.ts` |
| Provider map | `lib/admin/ai-providers/providers.ts` |
| **Google → OpenAI failover (LOCKED)** | `lib/admin/ai-providers/failover.ts` |
| Public exports | `lib/admin/ai-providers/index.ts` |
| Action-facing facade | `lib/admin/ai-image-provider.ts` |
| Admin actions | `app/admin/ai-image-actions.ts` |
| Modal | `components/admin/admin-ai-image-generator-modal.tsx` |

---

## Locked checklist

- [x] Primary Provider: **Google Gemini**
- [x] Fallback Provider: **OpenAI Images** (automatic, editor-invisible)
- [x] Failover on quota / billing / 429 / unavailable / timeout class
- [x] Storage → Pending → Image Review → Approve → Hero → Publish unchanged
- [x] No provider picker in admin UI
- [x] No auto-approve / auto-hero / auto-publish
- [x] Architecture documented as **FINAL**

**Do not reverse Google ↔ OpenAI priority. Do not redesign this system again.**
