/**
 * Public feature status for platform destinations.
 * All of these remain in main navigation.
 * Incomplete features show “Under utvikling” in chrome and on-page — they are not hidden from nav.
 *
 * Charging map: nav WIP follows the same env gate as the page (`CHARGING_MAP_ENABLED`).
 * Client components read `NEXT_PUBLIC_CHARGING_MAP_ENABLED` when set; otherwise fall back
 * to treating the map as launch-ready in chrome (page still hard-gates on server env).
 */
export const publicFeatures = {
  calculator: { enabled: true, href: "/kalkulator" as const, inNav: true },
  cheapest: { enabled: false, href: "/rimeligste" as const, inNav: true },
  tools: { enabled: false, href: "/verktoy" as const, inNav: true },
  testData: { enabled: false, href: "/testdata" as const, inNav: true },
  /**
   * Chrome readiness for /ladekart.
   * Server page still requires CHARGING_MAP_ENABLED + keys.
   * Set NEXT_PUBLIC_CHARGING_MAP_ENABLED=true alongside the server flag so nav/hub match.
   */
  chargingMap: { enabled: true, href: "/ladekart" as const, inNav: true },
  usedEvGuide: { enabled: true, href: "/bruktbil" as const, inNav: true },
  info: { enabled: true, href: "/info" as const, inNav: true },
  /**
   * Floating chatbot chrome. Server still requires CHATBOT_ENABLED + GEMINI_API_KEY.
   * Set NEXT_PUBLIC_CHATBOT_ENABLED=true so the widget can render on the client.
   */
  chatbot: { enabled: true, href: "/modeller" as const, inNav: false },
} as const;

/** Client-visible gate for the floating chat button. */
export function isChatbotPubliclyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHATBOT_ENABLED?.trim().toLowerCase() === "true";
}

function isChargingMapPubliclyReady(): boolean {
  const publicFlag = process.env.NEXT_PUBLIC_CHARGING_MAP_ENABLED?.trim().toLowerCase();
  if (publicFlag === "true") return true;
  if (publicFlag === "false") return false;
  // Default: no WIP badge — page shows Coming Soon if server flag/keys are missing.
  return true;
}

/** True when a nav destination exists but is not launch-ready. */
export function isNavRouteUnderDevelopment(href: string): boolean {
  if (href === "/ladekart") {
    return !isChargingMapPubliclyReady();
  }
  return Object.values(publicFeatures).some(
    (feature) => feature.href === href && feature.enabled === false,
  );
}
