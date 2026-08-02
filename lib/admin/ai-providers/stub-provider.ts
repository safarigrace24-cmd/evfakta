/**
 * Shared stub base for provider adapters that are not yet connected
 * to an external API. Returns a common unavailable result — never throws
 * vendor-specific errors into Image Review.
 */

import type {
  AIImageProvider,
  AiImageGenerateRequest,
  AiImageProviderResult,
  AiProviderHealth,
  AiProviderId,
} from "@/lib/admin/ai-providers/types";

type StubOptions = {
  id: AiProviderId;
  label: string;
  /** Env var names an editor/ops person would set when wiring this provider. */
  credentialEnvKeys: string[];
};

function unavailableResult(
  provider: AiProviderId,
  request: AiImageGenerateRequest,
  message: string,
  startedAt: number,
): AiImageProviderResult {
  return {
    ok: false,
    image: null,
    metadata: {
      adapter: "stub",
      reason: "provider_not_connected",
    },
    prompt: request.prompt,
    negativePrompt: request.negativePrompt ?? null,
    provider,
    generationTimeMs: Math.max(0, Date.now() - startedAt),
    warnings: [message],
    status: "unavailable",
    jobId: null,
    error: message,
    unavailable: true,
  };
}

export function createStubAiImageProvider(options: StubOptions): AIImageProvider {
  const { id, label, credentialEnvKeys } = options;

  const notConnectedMessage =
    `${label} adapter is registered but not connected yet. ` +
    `Set AI_PROVIDER=${id} when ready, add credentials (${credentialEnvKeys.join(", ") || "n/a"}), ` +
    `then implement the remote generate() call. Until then, use Awaiting Generation + manual upload.`;

  return {
    id,
    label,
    capabilities: {
      remoteGenerate: false,
      regenerate: false,
      edit: false,
      asyncJobs: false,
    },

    async generate(request) {
      const startedAt = Date.now();
      return unavailableResult(id, request, notConnectedMessage, startedAt);
    },

    async regenerate(request) {
      const startedAt = Date.now();
      return unavailableResult(
        id,
        request,
        `${label}: regenerate() not connected yet. ${notConnectedMessage}`,
        startedAt,
      );
    },

    async edit(request) {
      const startedAt = Date.now();
      return unavailableResult(
        id,
        request,
        `${label}: edit() not connected yet. ${notConnectedMessage}`,
        startedAt,
      );
    },

    async getStatus(jobId) {
      return {
        ok: false,
        image: null,
        metadata: { jobId, adapter: "stub" },
        prompt: "",
        provider: id,
        generationTimeMs: 0,
        warnings: [`${label}: getStatus() not connected yet.`],
        status: "unavailable",
        jobId,
        error: "Provider not connected",
        unavailable: true,
      };
    },

    async cancel(jobId) {
      return {
        ok: false,
        image: null,
        metadata: { jobId, adapter: "stub" },
        prompt: "",
        provider: id,
        generationTimeMs: 0,
        warnings: [`${label}: cancel() not connected yet.`],
        status: "cancelled",
        jobId,
        error: "Provider not connected",
        unavailable: true,
      };
    },

    async healthCheck(): Promise<AiProviderHealth> {
      const configured = credentialEnvKeys.some((key) => {
        const value = process.env[key];
        return Boolean(value && value.trim());
      });
      return {
        provider: id,
        healthy: false,
        configured,
        connected: false,
        statusCode: "stub",
        message: configured
          ? `${label}: credentials present, but remote adapter is not implemented yet.`
          : `${label}: adapter stub only — not connected to any external API.`,
        checkedAt: new Date().toISOString(),
      };
    },
  };
}
