/**
 * Pure UI copy helpers for charging map location errors (testable without DOM).
 */

export type ChargingLocationErrorCode =
  | "permission_denied"
  | "unavailable"
  | "timeout"
  | "unsupported";

export function chargingLocationErrorMessage(
  code: ChargingLocationErrorCode | null,
): string {
  switch (code) {
    case "permission_denied":
      return "Posisjonstillatelse ble avslått. Du kan fortsatt se kartet over Norge.";
    case "unavailable":
      return "Posisjonen er utilgjengelig akkurat nå.";
    case "timeout":
      return "Tidsavbrudd ved henting av posisjon.";
    case "unsupported":
      return "Nettleseren støtter ikke posisjonstjenester.";
    default:
      return "";
  }
}
