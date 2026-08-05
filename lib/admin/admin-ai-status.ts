/**
 * Admin AI service status labels for the editor sidebar.
 * Pure presentation helpers — availability flags come from server actions.
 */

export type AdminAiServiceLine = {
  id: "text" | "image_openai" | "image_google";
  available: boolean;
  label: string;
};

export type AdminAiServicesStatus = {
  lines: AdminAiServiceLine[];
  /** True only when text AND all image paths are unavailable. */
  allFailed: boolean;
  summaryLabel: string;
};

export function buildAdminAiServicesStatus(input: {
  textAvailable: boolean;
  openaiImageAvailable: boolean;
  googleImageAvailable: boolean;
}): AdminAiServicesStatus {
  const lines: AdminAiServiceLine[] = [
    {
      id: "text",
      available: input.textAvailable,
      label: input.textAvailable
        ? "🟢 AI Text Available"
        : "🟠 AI Text unavailable",
    },
    {
      id: "image_openai",
      available: input.openaiImageAvailable,
      label: input.openaiImageAvailable
        ? "🟢 AI Image Available (OpenAI)"
        : "🟠 AI Image unavailable (OpenAI)",
    },
    {
      id: "image_google",
      available: input.googleImageAvailable,
      label: input.googleImageAvailable
        ? "🟢 Google Image Available"
        : "🟠 Google Image unavailable",
    },
  ];

  const anyImage = input.openaiImageAvailable || input.googleImageAvailable;
  const allFailed = !input.textAvailable && !anyImage;

  return {
    lines,
    allFailed,
    summaryLabel: allFailed
      ? "🔴 All AI services unavailable"
      : "AI Status",
  };
}
