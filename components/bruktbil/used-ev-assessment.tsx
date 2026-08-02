"use client";

import { useMemo, useState } from "react";
import {
  assessUsedEvDocumentation,
  defaultUsedEvAssessmentInput,
  USED_EV_CHECKLIST_ITEMS,
  type UsedEvAssessmentInput,
  type UsedEvChecklistKey,
} from "@/lib/bruktbil/assessment";

type CatalogOption = {
  brand: string;
  model: string;
  year: number | null;
};

type Props = {
  catalogOptions: CatalogOption[];
};

function toOptionalNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export default function UsedEvAssessment({ catalogOptions }: Props) {
  const [input, setInput] = useState<UsedEvAssessmentInput>(
    defaultUsedEvAssessmentInput(),
  );
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const brands = useMemo(() => {
    return [...new Set(catalogOptions.map((o) => o.brand))].sort((a, b) =>
      a.localeCompare(b, "nb"),
    );
  }, [catalogOptions]);

  const models = useMemo(() => {
    if (!input.brand) return [];
    return [
      ...new Set(
        catalogOptions
          .filter((o) => o.brand === input.brand)
          .map((o) => o.model),
      ),
    ].sort((a, b) => a.localeCompare(b, "nb"));
  }, [catalogOptions, input.brand]);

  const result = useMemo(() => assessUsedEvDocumentation(input), [input]);

  function setChecklist(key: UsedEvChecklistKey, checked: boolean) {
    setInput((prev) => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: checked },
    }));
  }

  function copySellerQuestions() {
    const text = [
      `Spørsmål til selger — ${input.brand || "Elbil"} ${input.model || ""}`.trim(),
      "",
      ...result.sellerQuestions.map((q, i) => `${i + 1}. ${q}`),
      "",
      "Merk: EVFAKTA kan ikke bekrefte batteritilstanden. En profesjonell batteritest anbefales før kjøp.",
    ].join("\n");
    void navigator.clipboard?.writeText(text).then(
      () => setCopyMessage("Spørsmål kopiert."),
      () => setCopyMessage("Kunne ikke kopiere automatisk — marker teksten manuelt."),
    );
  }

  return (
    <div className="usedEvAssessment">
      <section
        className="usedEvAssessmentForm"
        aria-labelledby="used-ev-inputs-heading"
      >
        <h2 id="used-ev-inputs-heading">Bilinformasjon</h2>
        <p className="adminHint">
          Verktøyet vurderer dokumentasjonsrisiko — ikke bilens tekniske tilstand.
          EVFAKTA har ikke inspisert kjøretøyet.
        </p>

        <div className="chargingCalcRow">
          <label className="authField">
            <span>Merke</span>
            <input
              list="used-ev-brands"
              value={input.brand}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  brand: e.target.value,
                  model: "",
                }))
              }
              autoComplete="off"
            />
            <datalist id="used-ev-brands">
              {brands.map((brand) => (
                <option key={brand} value={brand} />
              ))}
            </datalist>
          </label>
          <label className="authField">
            <span>Modell</span>
            <input
              list="used-ev-models"
              value={input.model}
              onChange={(e) =>
                setInput((prev) => ({ ...prev, model: e.target.value }))
              }
              autoComplete="off"
            />
            <datalist id="used-ev-models">
              {models.map((model) => (
                <option key={model} value={model} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="chargingCalcRow">
          <label className="authField">
            <span>Årsmodell</span>
            <input
              type="number"
              min={1990}
              max={2100}
              value={input.year ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  year: toOptionalNumber(e.target.value),
                }))
              }
            />
          </label>
          <label className="authField">
            <span>Kilometerstand</span>
            <input
              type="number"
              min={0}
              value={input.mileageKm ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  mileageKm: toOptionalNumber(e.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="chargingCalcRow">
          <label className="authField">
            <span>Pris (NOK, valgfritt)</span>
            <input
              type="number"
              min={0}
              value={input.askingPriceNok ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  askingPriceNok: toOptionalNumber(e.target.value),
                }))
              }
            />
          </label>
          <label className="authField">
            <span>Annonserte rekkevidde (km, valgfritt)</span>
            <input
              type="number"
              min={0}
              value={input.advertisedRangeKm ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  advertisedRangeKm: toOptionalNumber(e.target.value),
                }))
              }
            />
          </label>
        </div>

        <div className="chargingCalcRow">
          <label className="authField">
            <span>Rapportert batterihelse SOH % (valgfritt)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={input.reportedSohPercent ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  reportedSohPercent: toOptionalNumber(e.target.value),
                }))
              }
            />
          </label>
          <label className="authField">
            <span>Gjenstående batterigaranti (år, valgfritt)</span>
            <input
              type="number"
              min={0}
              max={20}
              step={0.5}
              value={input.remainingBatteryWarrantyYears ?? ""}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  remainingBatteryWarrantyYears: toOptionalNumber(
                    e.target.value,
                  ),
                }))
              }
            />
          </label>
        </div>

        <fieldset className="chargingMapFilters">
          <legend>Dokumentasjon oppgitt</legend>
          <label>
            <input
              type="checkbox"
              checked={input.hasBatteryTestDocument}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  hasBatteryTestDocument: e.target.checked,
                }))
              }
            />
            <span>Batteritest-dokumentasjon finnes</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={input.hasServiceHistory}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  hasServiceHistory: e.target.checked,
                }))
              }
            />
            <span>Servicehistorikk dokumentert</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={input.hasDamageHistoryKnown}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  hasDamageHistoryKnown: e.target.checked,
                }))
              }
            />
            <span>Skadehistorikk kjent</span>
          </label>
          <label>
            <input
              type="checkbox"
              checked={input.hasChargingHistoryKnown}
              onChange={(e) =>
                setInput((prev) => ({
                  ...prev,
                  hasChargingHistoryKnown: e.target.checked,
                }))
              }
            />
            <span>Ladehistorikk kjent</span>
          </label>
        </fieldset>
      </section>

      <section
        className="usedEvAssessmentPanel"
        aria-labelledby="used-ev-battery-heading"
      >
        <h2 id="used-ev-battery-heading">Batterivurdering (dokumentasjon)</h2>
        <ul>
          {result.batteryNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="adminHint">
          EVFAKTA kan ikke bekrefte batteritilstanden. En profesjonell batteritest
          anbefales før kjøp.
        </p>
      </section>

      <section
        className="usedEvAssessmentPanel usedEvPrintable"
        aria-labelledby="used-ev-checklist-heading"
      >
        <h2 id="used-ev-checklist-heading">Sjekkliste for brukt elbil</h2>
        <ul className="usedEvChecklist">
          {USED_EV_CHECKLIST_ITEMS.map((item) => (
            <li key={item.key}>
              <label>
                <input
                  type="checkbox"
                  checked={input.checklist[item.key]}
                  onChange={(e) => setChecklist(item.key, e.target.checked)}
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="adminHint">
          Kryss av det du har verifisert. Ubesvarte punkter øker dokumentasjonsrisiko.
        </p>
      </section>

      <section
        className="usedEvAssessmentPanel usedEvPrintable"
        aria-labelledby="used-ev-risk-heading"
      >
        <h2 id="used-ev-risk-heading">Dokumentasjonsrisiko</h2>
        <p
          className={`usedEvRiskBadge usedEvRiskBadge--${result.riskLevel}`}
          role="status"
        >
          {result.riskLabel}
        </p>
        <p className="adminHint">
          Sjekket {result.checkedCount} av {result.totalChecks} punkter.
        </p>
        <ul>
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section
        className="usedEvAssessmentPanel usedEvPrintable"
        aria-labelledby="used-ev-questions-heading"
      >
        <h2 id="used-ev-questions-heading">Spørsmål til selger</h2>
        <ol>
          {result.sellerQuestions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ol>
        <div className="chargingCalcActions">
          <button
            type="button"
            className="button secondary"
            onClick={copySellerQuestions}
          >
            Kopier spørsmål
          </button>
          <button
            type="button"
            className="button primary"
            onClick={() => window.print()}
          >
            Skriv ut / lagre som PDF
          </button>
        </div>
        {copyMessage ? (
          <p className="adminSuccess" role="status">
            {copyMessage}
          </p>
        ) : null}
      </section>
    </div>
  );
}
