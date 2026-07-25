export const SCORE_KEYS = [
  "range_score",
  "charging_score",
  "winter_score",
  "comfort_score",
  "space_score",
  "value_score",
  "reliability_score",
  "overall_score",
] as const;

export type ScoreKey = (typeof SCORE_KEYS)[number];

export const SCORE_LABELS: Record<ScoreKey, string> = {
  range_score: "Rekkevidde",
  charging_score: "Lading",
  winter_score: "Vinter",
  comfort_score: "Komfort",
  space_score: "Plass",
  value_score: "Pris/verdi",
  reliability_score: "Pålitelighet",
  overall_score: "Totalt",
};

export type EvfaktaScores = {
  rangeScore: number | null;
  chargingScore: number | null;
  winterScore: number | null;
  comfortScore: number | null;
  spaceScore: number | null;
  valueScore: number | null;
  reliabilityScore: number | null;
  overallScore: number | null;
  scoreNotes: string | null;
  scoreMethodology: string | null;
};

export function hasAnyScore(scores: EvfaktaScores): boolean {
  return SCORE_KEYS.some((key) => {
    const camel =
      key === "range_score"
        ? "rangeScore"
        : key === "charging_score"
          ? "chargingScore"
          : key === "winter_score"
            ? "winterScore"
            : key === "comfort_score"
              ? "comfortScore"
              : key === "space_score"
                ? "spaceScore"
                : key === "value_score"
                  ? "valueScore"
                  : key === "reliability_score"
                    ? "reliabilityScore"
                    : "overallScore";
    return scores[camel] != null;
  });
}
