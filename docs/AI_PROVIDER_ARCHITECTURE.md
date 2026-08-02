# EVFAKTA AI Provider Architecture

Provider-agnostic layer for AI illustration generation.

**Editors never choose a provider.** The admin workflow stays identical regardless of which backend is configured.

Related: `docs/AI_IMAGE_CANDIDATE_WORKFLOW.md` (editorial rules, Visual Quality Review, Image Ready).

---

## Goal

Future-proof the AI Image system so EVFAKTA can switch providers without changing:

- Admin → Images → **✨ Lag AI-bilde**
- Generate → Preview → Review → Approve

No CMS redesign. No Image Review rewrite when adding a vendor.

---

## Architecture

```
Admin UI (Lag AI-bilde)
        ↓
Server actions (app/admin/ai-image-actions.ts)
        ↓
Facade (lib/admin/ai-image-provider.ts)
        ↓
Registry (lib/admin/ai-providers/registry.ts)
        ↓  AI_PROVIDER=…
AIImageProvider adapter (openai | google | ideogram | flux | …)
        ↓  common AiImageProviderResult
Existing EVFAKTA Storage / candidate workflow
        ↓
Image Review (unchanged gates)
```

Rules:

1. **One interface** — every vendor implements `AIImageProvider`.
2. **Config selects active provider** — never the admin UI.
3. **Common response** — callers never parse vendor JSON.
4. **Shared storage** — bytes always go through existing candidate/Storage helpers. No provider-specific buckets or paths.
5. **No auto-approve / auto-hero / auto-publish** — provider success only creates a Pending candidate (or preview bytes).

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
| `metadata` | Provider-agnostic extras (model name, seed, etc.) |
| `prompt` | Prompt used |
| `provider` | Active provider id |
| `generationTimeMs` | Wall-clock duration |
| `warnings` | Soft issues for editors / logs |
| `status` | `queued` \| `running` \| `completed` \| `failed` \| `cancelled` \| `unavailable` |
| `jobId` | Optional async job id |
| `unavailable` | Adapter not connected / not configured |

---

## Supported providers

Registered in `lib/admin/ai-providers/providers.ts`:

| Id | Label | Status |
|----|-------|--------|
| `none` | None (manual only) | Default — Awaiting Generation |
| `manual` | Manual upload | Same as none (explicit) |
| `openai` | OpenAI Images | Live Images API — **automatic fallback** when Google fails |
| `google` | Google AI Studio / Gemini | Live adapter (`generateContent`) — **primary**; flagged off until image quota returns bytes |
| `ideogram` | Ideogram | Stub — not connected |
| `flux` | Flux | Stub — not connected |
| `stable_diffusion` | Stable Diffusion | Stub — not connected |

Stubs return `unavailable` so the admin flow falls through to manual upload without inventing images.

### Google Gemini images

- Endpoint: `generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Model from **one** helper: `getGoogleAiImageModel()` ← `GOOGLE_AI_IMAGE_MODEL` or default `gemini-2.5-flash-image`
- Gated by `GOOGLE_AI_IMAGES_ENABLED` + `GOOGLE_AI_API_KEY`
- Do **not** use deprecated Imagen 4 predict endpoints for this path
- Verified stable model ids (Models API): `gemini-3.1-flash-image`, `gemini-3.1-flash-lite-image`, `gemini-3-pro-image`, `gemini-2.5-flash-image`
- **2026-08-02 probe:** all four returned HTTP 429 FreeTier (`limit: 0`) — no image bytes → keep production flag **false**
- See `docs/GOOGLE_AI_INTEGRATION.md` for the full test table

### Retry policy (Google adapter)

- At most **2 retries** (max 3 HTTP attempts per `generate()`)
- Exponential backoff; honour `Retry-After` when present
- Distinguish: `quota_limit_0` · `temporary_rate_limit` · `billing_problem` · `model_unavailable`
- FreeTier / limit 0 → **no retry**; Norwegian admin copy + manual upload
- Retries stay inside the adapter — **no duplicate pending candidates** from retry loops

### Automatic OpenAI failover

When `AI_PROVIDER=google` and Google fails for **quota / billing / unavailable / HTTP 429** (including `GOOGLE_AI_IMAGES_ENABLED=false`):

1. Facade calls `generateWithAutomaticFailover()`
2. OpenAI Images is tried **once** (`OPENAI_API_KEY` required)
3. Success bytes go through the same Storage → Pending → Image Review path
4. Editors never choose or see a provider picker

Configured via:

```bash
AI_PROVIDER=google
OPENAI_API_KEY=
# OPENAI_IMAGE_MODEL=gpt-image-1
```

### Manual upload fallback

When Google **and** OpenAI fail (or no OpenAI key):

1. Lag AI-bilde keeps prompt + image type
2. Soft-fail to Awaiting Generation
3. **Prøv igjen** / **Last opp resultat**
4. Same Image Review gates (no auto-approve / auto-Hero / auto-publish)

---

## Configuration

Environment only (server-side). Example in `.env.local.example`:

```bash
# Active provider — editors never see this
AI_PROVIDER=none

# Optional future failover list (architectural; not auto-used yet)
# AI_PROVIDER_FALLBACK=openai,google,flux

# Google Gemini images (keep false until a real generate returns bytes)
GOOGLE_AI_IMAGES_ENABLED=false
GOOGLE_AI_API_KEY=
# GOOGLE_AI_IMAGE_MODEL=gemini-2.5-flash-image
```

Accepted values (aliases in parentheses):

- `none` / `manual`
- `openai` (`dalle`, `openai_images`)
- `google` (`imagen`, `gemini`)
- `ideogram`
- `flux`
- `stable_diffusion` (`sd`, `stability`)

Credential env keys: `GOOGLE_AI_API_KEY` is used by the Google adapter when enabled. Other vendor keys remain reserved for stubs.

Switching providers:

1. Set `AI_PROVIDER=…`
2. Implement/wire that adapter’s remote `generate()` (set `capabilities.remoteGenerate = true`)
3. For Google: also set `GOOGLE_AI_IMAGES_ENABLED=true` only after a successful image QA
4. Redeploy

No admin workflow redesign.

---

## Failover

Architectural support only — **no automatic failover yet**.

- `AI_PROVIDER` — primary
- `AI_PROVIDER_FALLBACK` — ordered list of secondary ids
- `getFallbackAiImageProviders()` — exposes the list for a future orchestrator

When failover is enabled later, orchestration must stay **above** Image Review (in the facade / actions), so Review continues to see only common results + Storage paths.

---

## Storage

All providers must:

1. Return image bytes in `AiImageProviderResult.image` (or `unavailable`)
2. Let `createAiIllustrationCandidate` / `attachGeneratedBytesToAiCandidate` persist via the existing EVFAKTA Storage workflow

Do **not**:

- Store under vendor-specific paths
- Hotlink temporary vendor CDN URLs as permanent gallery sources
- Skip Image Review

---

## Future providers

To add a vendor:

1. Add id to `AiProviderId` / `AI_PROVIDER_IDS`
2. Register adapter in `AI_IMAGE_PROVIDERS` (start as stub or implement remote calls)
3. Document credential env keys
4. Keep `capabilities.remoteGenerate = false` until live

No changes to Lag AI-bilde UI, Image Review gates, or Storage helpers.

---

## Security

- Provider keys are **server-only** — never `NEXT_PUBLIC_*`
- Non-admin callers receive **`403 Forbidden`** on AI actions
- Adapters must not log full API keys or raw credential headers
- Generated assets remain **illustrations**, never labeled as official manufacturer photography
- Provider success ≠ editorial approval

---

## Workflow (unchanged for editors)

```
Admin → Images → ✨ Lag AI-bilde
  → Generate (active AI_PROVIDER adapter)
  → Preview / quality check
  → Approve → Pending candidate (Storage)
  → Image Review (Visual Quality Review → Approve → optional Hero)
```

Official photography remains preferred. AI never satisfies Image Ready alone.

---

## Code map

| Piece | Path |
|-------|------|
| Interface + result types | `lib/admin/ai-providers/types.ts` |
| Stub base | `lib/admin/ai-providers/stub-provider.ts` |
| Registry / config | `lib/admin/ai-providers/registry.ts` |
| Provider map | `lib/admin/ai-providers/providers.ts` |
| Public exports | `lib/admin/ai-providers/index.ts` |
| Action-facing facade | `lib/admin/ai-image-provider.ts` |
| Admin actions | `app/admin/ai-image-actions.ts` |
| Modal | `components/admin/admin-ai-image-generator-modal.tsx` |

---

## Status (this milestone)

- [x] Provider interface
- [x] Config via `AI_PROVIDER`
- [x] Stub adapters for listed vendors
- [x] Facade used by admin generate/preview
- [x] Shared Storage path preserved
- [x] Failover list reserved (not automatic)
- [ ] Connect OpenAI / other remote APIs (explicit follow-up)
- [x] Google Gemini image adapter (feature-flagged) — see `docs/GOOGLE_AI_INTEGRATION.md`
