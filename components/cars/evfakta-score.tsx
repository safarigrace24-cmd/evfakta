import type { Car } from "@/data/cars";
import { SCORE_LABELS, type ScoreKey } from "@/lib/scores/types";

type EvfaktaScoreProps = {
  car: Car;
};

const DISPLAY_KEYS: ScoreKey[] = [
  "overall_score",
  "range_score",
  "charging_score",
  "winter_score",
  "comfort_score",
  "space_score",
  "value_score",
  "reliability_score",
];

function scoreValue(car: Car, key: ScoreKey): number | null {
  switch (key) {
    case "range_score":
      return car.rangeScore ?? null;
    case "charging_score":
      return car.chargingScore ?? null;
    case "winter_score":
      return car.winterScore ?? null;
    case "comfort_score":
      return car.comfortScore ?? null;
    case "space_score":
      return car.spaceScore ?? null;
    case "value_score":
      return car.valueScore ?? null;
    case "reliability_score":
      return car.reliabilityScore ?? null;
    case "overall_score":
      return car.overallScore ?? null;
  }
}

export default function EvfaktaScore({ car }: EvfaktaScoreProps) {
  const entries = DISPLAY_KEYS.map((key) => ({
    key,
    label: SCORE_LABELS[key],
    value: scoreValue(car, key),
  })).filter((entry) => entry.value != null);

  if (entries.length === 0) return null;

  const overall = car.overallScore;

  return (
    <section className="scorePanel" aria-labelledby="evfakta-score-heading">
      <div className="scorePanelHeader">
        <div>
          <h2 id="evfakta-score-heading">EVFAKTA Score</h2>
          <p>Manuelle redaksjonelle vurderinger (0–10). Ikke auto-generert.</p>
        </div>
        {overall != null && (
          <div className="scoreOverall" aria-label={`Totalscore ${overall}`}>
            <span>Totalt</span>
            <strong>{overall}</strong>
          </div>
        )}
      </div>

      <ul className="scoreList">
        {entries
          .filter((entry) => entry.key !== "overall_score")
          .map((entry) => (
            <li key={entry.key} className="scoreItem">
              <span>{entry.label}</span>
              <div className="scoreBarTrack" aria-hidden="true">
                <span
                  className="scoreBarFill"
                  style={{ width: `${Math.max(0, Math.min(10, entry.value ?? 0)) * 10}%` }}
                />
              </div>
              <strong>{entry.value}</strong>
            </li>
          ))}
      </ul>

      {car.scoreNotes && (
        <p className="scoreNotes">
          <strong>Merknad:</strong> {car.scoreNotes}
        </p>
      )}
      {car.scoreMethodology && (
        <p className="scoreMethodology">
          <strong>Metodikk:</strong> {car.scoreMethodology}
        </p>
      )}
    </section>
  );
}
