import { createGoogleAiImageProvider } from "@/lib/admin/ai-providers/google-provider";
import { createStubAiImageProvider } from "@/lib/admin/ai-providers/stub-provider";
import type { AIImageProvider, AiProviderId } from "@/lib/admin/ai-providers/types";

/**
 * Registered provider adapters.
 * Google uses a live Gemini generateContent adapter (feature-flagged).
 * Other vendors remain stubs until wired.
 */
export const AI_IMAGE_PROVIDERS: Record<AiProviderId, AIImageProvider> = {
  none: createStubAiImageProvider({
    id: "none",
    label: "None (manual only)",
    credentialEnvKeys: [],
  }),
  manual: createStubAiImageProvider({
    id: "manual",
    label: "Manual upload",
    credentialEnvKeys: [],
  }),
  openai: createStubAiImageProvider({
    id: "openai",
    label: "OpenAI Images",
    credentialEnvKeys: ["OPENAI_API_KEY", "AI_OPENAI_API_KEY"],
  }),
  google: createGoogleAiImageProvider(),
  ideogram: createStubAiImageProvider({
    id: "ideogram",
    label: "Ideogram",
    credentialEnvKeys: ["IDEOGRAM_API_KEY", "AI_IDEOGRAM_API_KEY"],
  }),
  flux: createStubAiImageProvider({
    id: "flux",
    label: "Flux",
    credentialEnvKeys: ["FLUX_API_KEY", "AI_FLUX_API_KEY", "BFL_API_KEY"],
  }),
  stable_diffusion: createStubAiImageProvider({
    id: "stable_diffusion",
    label: "Stable Diffusion",
    credentialEnvKeys: [
      "STABILITY_API_KEY",
      "AI_STABLE_DIFFUSION_API_KEY",
      "STABLE_DIFFUSION_API_KEY",
    ],
  }),
};
