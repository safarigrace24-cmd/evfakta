"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildChargingCostSearchParams,
  calculateChargingCost,
  CHARGING_COST_PRESETS,
  parseChargingCostSearchParams,
  type ChargingCostInput,
  type ChargingCostPresetId,
} from "@/lib/calculator/charging-cost";

const DEFAULT_INPUT: ChargingCostInput = {
  batteryCapacityKwh: 75,
  startPercent: 20,
  targetPercent: 80,
  pricePerKwh: CHARGING_COST_PRESETS.home.pricePerKwh,
  lossPercent: CHARGING_COST_PRESETS.home.lossPercent,
  monthlyDistanceKm: 1000,
  consumptionKwhPer100Km: 18,
};

function toNumber(value: string): number {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export default function ChargingCostCalculator() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState<ChargingCostInput>(DEFAULT_INPUT);
  const [activePreset, setActivePreset] = useState<ChargingCostPresetId | null>(
    "home",
  );
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  useEffect(() => {
    const fromUrl = parseChargingCostSearchParams(
      new URLSearchParams(searchParams.toString()),
    );
    if (Object.keys(fromUrl).length === 0) return;
    setInput((prev) => ({
      ...prev,
      ...fromUrl,
      monthlyDistanceKm:
        fromUrl.monthlyDistanceKm === undefined
          ? prev.monthlyDistanceKm
          : fromUrl.monthlyDistanceKm,
      consumptionKwhPer100Km:
        fromUrl.consumptionKwhPer100Km === undefined
          ? prev.consumptionKwhPer100Km
          : fromUrl.consumptionKwhPer100Km,
    }));
    setActivePreset(null);
    // Only hydrate once from the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const result = useMemo(() => calculateChargingCost(input), [input]);

  function applyPreset(id: ChargingCostPresetId) {
    const preset = CHARGING_COST_PRESETS[id];
    setActivePreset(id);
    setInput((prev) => ({
      ...prev,
      pricePerKwh: preset.pricePerKwh,
      lossPercent: preset.lossPercent,
    }));
  }

  function reset() {
    setInput(DEFAULT_INPUT);
    setActivePreset("home");
    setShareMessage(null);
    router.replace(pathname, { scroll: false });
  }

  function shareUrl() {
    const params = buildChargingCostSearchParams(input);
    const href = `${pathname}?${params.toString()}`;
    router.replace(href, { scroll: false });
    const full =
      typeof window !== "undefined"
        ? `${window.location.origin}${href}`
        : href;
    void navigator.clipboard?.writeText(full).then(
      () => setShareMessage("Lenke kopiert."),
      () => setShareMessage("Lenke oppdatert i adresselinjen."),
    );
  }

  return (
    <div className="chargingCalcLayout">
      <form
        className="chargingCalcForm"
        onSubmit={(e) => e.preventDefault()}
        aria-labelledby="calc-inputs-heading"
      >
        <h2 id="calc-inputs-heading">Inndata</h2>
        <p className="adminHint">
          Alle priser er dine egne tall. Forhåndsvalgene er redigerbare eksempler —
          ikke aktuelle markedspriser.
        </p>

        <div className="chargingCalcPresets" role="group" aria-label="Forhåndsvalg">
          {(Object.keys(CHARGING_COST_PRESETS) as ChargingCostPresetId[]).map(
            (id) => (
              <button
                key={id}
                type="button"
                className={
                  activePreset === id
                    ? "button secondary buttonSm isActive"
                    : "button secondary buttonSm"
                }
                onClick={() => applyPreset(id)}
              >
                {CHARGING_COST_PRESETS[id].label}
              </button>
            ),
          )}
        </div>
        {activePreset ? (
          <p className="adminHint">{CHARGING_COST_PRESETS[activePreset].hint}</p>
        ) : null}

        <label className="authField">
          <span>Batterikapasitet (kWh)</span>
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={300}
            step={0.1}
            value={input.batteryCapacityKwh}
            onChange={(e) =>
              setInput((prev) => ({
                ...prev,
                batteryCapacityKwh: toNumber(e.target.value),
              }))
            }
          />
        </label>
        <div className="chargingCalcRow">
          <label className="authField">
            <span>Start (%) </span>
            <input
              type="number"
              min={0}
              max={100}
              value={input.startPercent}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  startPercent: toNumber(e.target.value),
                }))
              }
            />
          </label>
          <label className="authField">
            <span>Mål (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={input.targetPercent}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  targetPercent: toNumber(e.target.value),
                }))
              }
            />
          </label>
        </div>
        <div className="chargingCalcRow">
          <label className="authField">
            <span>Strømpris (kr/kWh)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={input.pricePerKwh}
              onChange={(e) => {
                setActivePreset(null);
                setInput((prev) => ({
                  ...prev,
                  pricePerKwh: toNumber(e.target.value),
                }));
              }}
            />
          </label>
          <label className="authField">
            <span>Ladetap (%) — estimat</span>
            <input
              type="number"
              min={0}
              max={79}
              step={1}
              value={input.lossPercent}
              onChange={(e) => {
                setActivePreset(null);
                setInput((prev) => ({
                  ...prev,
                  lossPercent: toNumber(e.target.value),
                }));
              }}
            />
          </label>
        </div>
        <div className="chargingCalcRow">
          <label className="authField">
            <span>Månedlig kjøring (km, valgfritt)</span>
            <input
              type="number"
              min={0}
              value={input.monthlyDistanceKm ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  monthlyDistanceKm:
                    e.target.value === "" ? null : toNumber(e.target.value),
                }))
              }
            />
          </label>
          <label className="authField">
            <span>Forbruk (kWh/100 km, valgfritt)</span>
            <input
              type="number"
              min={0}
              step={0.1}
              value={input.consumptionKwhPer100Km ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  consumptionKwhPer100Km:
                    e.target.value === "" ? null : toNumber(e.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="chargingCalcActions">
          <button type="button" className="button secondary" onClick={reset}>
            Nullstill
          </button>
          <button type="button" className="button primary" onClick={shareUrl}>
            Kopier delbar lenke
          </button>
        </div>
        {shareMessage ? (
          <p className="adminSuccess" role="status">
            {shareMessage}
          </p>
        ) : null}
      </form>

      <section
        className="chargingCalcResults"
        aria-labelledby="calc-results-heading"
      >
        <h2 id="calc-results-heading">Resultater</h2>
        {!result.ok ? (
          <p className="chargingMapError" role="alert">
            {result.error}
          </p>
        ) : (
          <ul className="chargingCalcResultList">
            <li>
              <strong>Energi til batteriet</strong>
              <span>{result.energyAddedKwh} kWh</span>
            </li>
            <li>
              <strong>Estimert energi fra nettet</strong>
              <span>{result.energyFromGridKwh} kWh</span>
            </li>
            <li>
              <strong>Estimert ladekostnad</strong>
              <span>{result.chargeCostNok} kr</span>
            </li>
            <li>
              <strong>Estimert månedlig strømbruk</strong>
              <span>
                {result.monthlyEnergyKwh != null
                  ? `${result.monthlyEnergyKwh} kWh`
                  : "Ikke beregnet"}
              </span>
            </li>
            <li>
              <strong>Estimert månedlig ladekostnad</strong>
              <span>
                {result.monthlyCostNok != null
                  ? `${result.monthlyCostNok} kr`
                  : "Ikke beregnet"}
              </span>
            </li>
            <li>
              <strong>Estimert kostnad per 100 km</strong>
              <span>
                {result.costPer100KmNok != null
                  ? `${result.costPer100KmNok} kr`
                  : "Ikke beregnet"}
              </span>
            </li>
          </ul>
        )}

        <details className="chargingCalcFormulas">
          <summary>Slik regner vi</summary>
          <ul>
            <li>
              Energi til batteri = kapasitet × (mål − start) / 100
            </li>
            <li>
              Energi fra nett = energi til batteri / (1 − ladetap/100)
            </li>
            <li>Ladekostnad = energi fra nett × pris</li>
            <li>
              Månedlig bruk ≈ (km/100) × forbruk; kostnad inkluderer ladetap
            </li>
          </ul>
        </details>

        <p className="chargingCalcDisclaimer" role="note">
          Resultatene er estimater. Faktisk forbruk og ladetap varierer med bil,
          temperatur, hastighet og ladeforhold.
        </p>
      </section>
    </div>
  );
}
