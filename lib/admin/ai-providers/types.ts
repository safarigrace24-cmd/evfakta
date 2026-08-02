/**
 * EVFAKTA AI image provider contract.
 *
 * All providers implement the same interface so admin workflow
 * (Lag AI-bilde → Generate → Preview → Image Review) never changes.
 *
 * No provider may invent image bytes. Unconnected adapters return unavailable.
 */

import type { AiGeneratorAspectRatio } from "@/lib/admin/ai-image-generator";

/** Config keys for selecting the active provider (env: AI_PROVIDER). */
export type AiProviderId =
  | "none"
  | "manual"
  | "openai"
  | "google"
  | "ideogram"
  | "flux"
  | "stable_diffusion";

export type AiProviderJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "unavailable";

export type AiImageGenerateRequest = {
  prompt: string;
  negativePrompt?: string | null;
  aspectRatio: AiGeneratorAspectRatio;
  style?: string | null;
  /** Optional seed for deterministic regenerate when a provider supports it. */
  seed?: number | null;
  /** Prior job id when regenerating / editing. */
  previousJobId?: string | null;
  /** Prior image bytes for edit operations (provider-specific). */
  sourceImageBuffer?: Buffer | null;
  editInstruction?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Common response object every provider must return.
 * Callers (admin actions → Storage) never depend on vendor-specific shapes.
 */
export type AiImageProviderResult = {
  ok: boolean;
  /** Image bytes when generation succeeded. Null when awaiting / unavailable / failed. */
  image: Buffer | null;
  metadata: Record<string, unknown>;
  prompt: string;
  negativePrompt?: string | null;
  provider: AiProviderId;
  /** Wall-clock generation time in milliseconds. */
  generationTimeMs: number;
  warnings: string[];
  status: AiProviderJobStatus;
  jobId?: string | null;
  error?: string | null;
  /**
   * True when this environment cannot produce pixels (adapter not wired,
   * missing credentials, or AI_PROVIDER=none/manual).
   * Admin should fall through to Awaiting Generation + manual upload.
   */
  unavailable?: boolean;
};

export type AiProviderHealthCode =
  | "connected"
  | "missing_api_key"
  | "feature_disabled"
  | "model_unavailable"
  | "quota_or_billing"
  | "temporary_error"
  | "not_configured"
  | "stub";

export type AiProviderHealth = {
  provider: AiProviderId;
  healthy: boolean;
  configured: boolean;
  /** Adapter implemented and ready to call a remote API. */
  connected: boolean;
  /** Admin-visible status without exposing secrets. */
  statusCode: AiProviderHealthCode;
  message: string;
  checkedAt: string;
};

/**
 * Provider interface — every adapter implements these methods.
 * Failover can later call the same methods on a secondary provider
 * without rewriting Image Review.
 */
export interface AIImageProvider {
  readonly id: AiProviderId;
  readonly label: string;
  /**
   * Sync capability flags. `remoteGenerate` is true only after a real
   * adapter is wired to an external API (stubs keep this false).
   */
  readonly capabilities: {
    remoteGenerate: boolean;
    regenerate: boolean;
    edit: boolean;
    asyncJobs: boolean;
  };

  generate(request: AiImageGenerateRequest): Promise<AiImageProviderResult>;
  regenerate(request: AiImageGenerateRequest): Promise<AiImageProviderResult>;
  edit(request: AiImageGenerateRequest): Promise<AiImageProviderResult>;
  getStatus(jobId: string): Promise<AiImageProviderResult>;
  cancel(jobId: string): Promise<AiImageProviderResult>;
  healthCheck(): Promise<AiProviderHealth>;
}

export const AI_PROVIDER_IDS: readonly AiProviderId[] = [
  "none",
  "manual",
  "openai",
  "google",
  "ideogram",
  "flux",
  "stable_diffusion",
] as const;

export function isAiProviderId(value: string | null | undefined): value is AiProviderId {
  if (!value) return false;
  return (AI_PROVIDER_IDS as readonly string[]).includes(value.trim().toLowerCase());
}
