/**
 * Used-EV documentation risk assessment.
 * Never diagnoses battery health — only documentation gaps and checklists.
 */

export type UsedEvAssessmentInput = {
  brand: string;
  model: string;
  year: number | null;
  mileageKm: number | null;
  askingPriceNok: number | null;
  advertisedRangeKm: number | null;
  reportedSohPercent: number | null;
  remainingBatteryWarrantyYears: number | null;
  hasBatteryTestDocument: boolean;
  hasServiceHistory: boolean;
  hasDamageHistoryKnown: boolean;
  hasChargingHistoryKnown: boolean;
  checklist: Record<UsedEvChecklistKey, boolean>;
};

export type UsedEvChecklistKey =
  | "battery_health_report"
  | "charging_test"
  | "ac_charging"
  | "dc_fast_charging"
  | "warning_lights"
  | "heating"
  | "air_conditioning"
  | "charging_cable"
  | "tyres"
  | "brakes"
  | "underbody_battery_protection"
  | "software_updates"
  | "service_history"
  | "warranty_docs"
  | "accident_repair_history"
  | "winter_range_expectations";

export const USED_EV_CHECKLIST_ITEMS: Array<{
  key: UsedEvChecklistKey;
  label: string;
}> = [
  { key: "battery_health_report", label: "Batterihelserapport (SOH) fra verksted" },
  { key: "charging_test", label: "Lade-/funksjonstest gjennomført" },
  { key: "ac_charging", label: "AC-lading fungerer" },
  { key: "dc_fast_charging", label: "DC-hurtiglading fungerer" },
  { key: "warning_lights", label: "Ingen advarselslys i instrumentpanel" },
  { key: "heating", label: "Varmeanlegg kontrollert" },
  { key: "air_conditioning", label: "Klimaanlegg kontrollert" },
  { key: "charging_cable", label: "Ladekabel/adaptere følger bilen" },
  { key: "tyres", label: "Dekk i forsvarlig stand" },
  { key: "brakes", label: "Bremser kontrollert" },
  { key: "underbody_battery_protection", label: "Understell og batteribeskyttelse inspisert" },
  { key: "software_updates", label: "Programvare oppdateringer sjekket" },
  { key: "service_history", label: "Servicehistorikk dokumentert" },
  { key: "warranty_docs", label: "Garantidokumentasjon tilgjengelig" },
  { key: "accident_repair_history", label: "Skade- og reparasjonshistorikk kjent" },
  { key: "winter_range_expectations", label: "Vinterrekkevidde diskutert med selger" },
];

export type DocumentationRiskLevel = "low" | "medium" | "high";

export type UsedEvAssessmentResult = {
  riskLevel: DocumentationRiskLevel;
  riskLabel: string;
  reasons: string[];
  batteryNotes: string[];
  sellerQuestions: string[];
  checkedCount: number;
  totalChecks: number;
};

function emptyChecklist(): Record<UsedEvChecklistKey, boolean> {
  return Object.fromEntries(
    USED_EV_CHECKLIST_ITEMS.map((item) => [item.key, false]),
  ) as Record<UsedEvChecklistKey, boolean>;
}

export function defaultUsedEvAssessmentInput(): UsedEvAssessmentInput {
  return {
    brand: "",
    model: "",
    year: null,
    mileageKm: null,
    askingPriceNok: null,
    advertisedRangeKm: null,
    reportedSohPercent: null,
    remainingBatteryWarrantyYears: null,
    hasBatteryTestDocument: false,
    hasServiceHistory: false,
    hasDamageHistoryKnown: false,
    hasChargingHistoryKnown: false,
    checklist: emptyChecklist(),
  };
}

function mileageBand(
  year: number | null,
  mileageKm: number | null,
  nowYear: number,
): "low" | "moderate" | "high" | "unknown" {
  if (year == null || mileageKm == null || year < 1990 || year > nowYear + 1) {
    return "unknown";
  }
  const age = Math.max(1, nowYear - year);
  const avgPerYear = mileageKm / age;
  if (avgPerYear < 10_000) return "low";
  if (avgPerYear <= 20_000) return "moderate";
  return "high";
}

export function assessUsedEvDocumentation(
  input: UsedEvAssessmentInput,
  nowYear = new Date().getFullYear(),
): UsedEvAssessmentResult {
  const reasons: string[] = [];
  const batteryNotes: string[] = [];
  const sellerQuestions: string[] = [];

  const checkedCount = USED_EV_CHECKLIST_ITEMS.filter(
    (item) => input.checklist[item.key],
  ).length;
  const totalChecks = USED_EV_CHECKLIST_ITEMS.length;
  const uncheckedRatio = 1 - checkedCount / totalChecks;

  if (!input.hasBatteryTestDocument) {
    reasons.push("Mangler dokumentert batteritest.");
    batteryNotes.push(
      "EVFAKTA kan ikke bekrefte batteritilstanden. En profesjonell batteritest anbefales før kjøp.",
    );
    sellerQuestions.push(
      "Kan du sende en nylig batterihelserapport (SOH) fra verksted eller produsent?",
    );
  } else {
    batteryNotes.push("Batteritest-dokumentasjon er oppgitt — kontroller dato og kilde.");
  }

  if (input.reportedSohPercent == null) {
    batteryNotes.push(
      "Rapportert batterihelse er ikke oppgitt. Be om dokumentasjon — ikke stol på muntlige tall alene.",
    );
    sellerQuestions.push("Hva er dokumentert batterihelse (SOH), og hvem har målt den?");
  } else {
    batteryNotes.push(
      `Oppgitt SOH er ${input.reportedSohPercent} %. Dette er brukerens tall — EVFAKTA har ikke verifisert målingen.`,
    );
  }

  if (input.remainingBatteryWarrantyYears == null) {
    batteryNotes.push("Gjenstående batterigaranti er ikke oppgitt. Dette bør undersøkes.");
    sellerQuestions.push("Hvor lang batterigaranti gjenstår, og hva dekker den?");
  } else if (input.remainingBatteryWarrantyYears <= 0) {
    batteryNotes.push("Oppgitt batterigaranti ser ut til å være utløpt. Bekreft med dokumentasjon.");
  } else {
    batteryNotes.push(
      `Oppgitt gjenstående batterigaranti: ca. ${input.remainingBatteryWarrantyYears} år — bekreft med papirer.`,
    );
  }

  const band = mileageBand(input.year, input.mileageKm, nowYear);
  if (band === "high") {
    reasons.push("Høy gjennomsnittlig kilometerstand i forhold til alder.");
    batteryNotes.push(
      "Kilometerstanden er høy relativt til alder. Be om ladehistorikk og batteritest.",
    );
  } else if (band === "moderate") {
    batteryNotes.push("Kilometerstand er moderat relativt til alder — fortsatt be om dokumentasjon.");
  } else if (band === "low") {
    batteryNotes.push("Kilometerstand er lav relativt til alder — dokumentasjon er fortsatt viktig.");
  } else {
    batteryNotes.push("Alder eller kilometerstand mangler — kilometer/år kan ikke vurderes.");
  }

  batteryNotes.push("Vinterrekkevidde bør sjekkes i forholdene du faktisk kjører i.");
  batteryNotes.push("Be om DC-hurtigladings­historikk og servicehistorikk.");
  batteryNotes.push("Be om skade- og reparasjonshistorikk før bud.");

  if (!input.hasServiceHistory) {
    reasons.push("Servicehistorikk er ikke bekreftet.");
    sellerQuestions.push("Kan du dokumentere servicehistorikk for bilen?");
  }
  if (!input.hasDamageHistoryKnown) {
    reasons.push("Skadehistorikk er ikke kjent.");
    sellerQuestions.push("Har bilen vært i uhell, og finnes skaderapporter?");
  }
  if (!input.hasChargingHistoryKnown) {
    reasons.push("Ladehistorikk er ikke kjent.");
    sellerQuestions.push(
      "Har bilen hovedsakelig blitt AC-ladet hjemme, eller ofte DC-hurtigladet?",
    );
  }

  for (const item of USED_EV_CHECKLIST_ITEMS) {
    if (!input.checklist[item.key]) {
      sellerQuestions.push(`Er dette sjekket/dokumentert: ${item.label}?`);
    }
  }

  // Deduplicate questions
  const uniqueQuestions = [...new Set(sellerQuestions)];

  let riskPoints = 0;
  if (!input.hasBatteryTestDocument) riskPoints += 3;
  if (input.reportedSohPercent == null) riskPoints += 2;
  if (input.remainingBatteryWarrantyYears == null) riskPoints += 1;
  if (!input.hasServiceHistory) riskPoints += 2;
  if (!input.hasDamageHistoryKnown) riskPoints += 2;
  if (!input.hasChargingHistoryKnown) riskPoints += 1;
  if (band === "high") riskPoints += 1;
  if (uncheckedRatio > 0.6) riskPoints += 3;
  else if (uncheckedRatio > 0.35) riskPoints += 2;
  else if (uncheckedRatio > 0.15) riskPoints += 1;

  let riskLevel: DocumentationRiskLevel = "low";
  if (riskPoints >= 8) riskLevel = "high";
  else if (riskPoints >= 4) riskLevel = "medium";

  const riskLabel =
    riskLevel === "low"
      ? "Lav dokumentasjonsrisiko"
      : riskLevel === "medium"
        ? "Middels dokumentasjonsrisiko"
        : "Høy dokumentasjonsrisiko";

  if (riskLevel === "low") {
    reasons.unshift(
      "Mye dokumentasjon er krysset av — fortsatt anbefales profesjonell kontroll før kjøp.",
    );
  } else if (riskLevel === "medium") {
    reasons.unshift(
      "Flere viktige punkter mangler dokumentasjon. Dette bør undersøkes før bud.",
    );
  } else {
    reasons.unshift(
      "Vesentlig dokumentasjon mangler. EVFAKTA anbefaler å ikke kjøpe uten verkstedkontroll og batteritest.",
    );
  }

  return {
    riskLevel,
    riskLabel,
    reasons,
    batteryNotes,
    sellerQuestions: uniqueQuestions.slice(0, 12),
    checkedCount,
    totalChecks,
  };
}
