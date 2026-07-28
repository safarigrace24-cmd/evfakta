/**
 * Public feature status for platform destinations.
 * All of these remain in main navigation.
 * Incomplete features show “Under utvikling” in chrome and on-page — they are not hidden from nav.
 */
export const publicFeatures = {
  calculator: { enabled: false, href: "/kalkulator" as const, inNav: true },
  cheapest: { enabled: false, href: "/rimeligste" as const, inNav: true },
  tools: { enabled: false, href: "/verktoy" as const, inNav: true },
  testData: { enabled: false, href: "/testdata" as const, inNav: true },
  chargingMap: { enabled: false, href: "/ladekart" as const, inNav: true },
  usedEvGuide: { enabled: true, href: "/bruktbil" as const, inNav: true },
  info: { enabled: true, href: "/info" as const, inNav: true },
} as const;

/** True when a nav destination exists but is not launch-ready. */
export function isNavRouteUnderDevelopment(href: string): boolean {
  return Object.values(publicFeatures).some(
    (feature) => feature.href === href && feature.enabled === false,
  );
}
