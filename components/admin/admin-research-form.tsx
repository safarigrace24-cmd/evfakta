"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startResearchJobAction } from "@/app/admin/research-actions";
import type { AdminBrand } from "@/lib/admin/brand-types";
import { sourcesForBrand } from "@/lib/admin/research/sources";
import type {
  ResearchProviderKey,
  ResearchSourceMode,
} from "@/lib/admin/research/types";

type ProviderOption = {
  key: ResearchProviderKey;
  label: string;
  description: string;
  supportsLive: boolean;
};

type AdminResearchFormProps = {
  brands: AdminBrand[];
  providers: ProviderOption[];
};

type SourceChoice =
  | { kind: "brand_website" }
  | { kind: "preset"; id: string }
  | { kind: "custom" };

export default function AdminResearchForm({
  brands,
  providers,
}: AdminResearchFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [brandId, setBrandId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [modelQuery, setModelQuery] = useState("");
  const [providerKey, setProviderKey] =
    useState<ResearchProviderKey>("manufacturer_http");
  const [sourceChoice, setSourceChoice] = useState<SourceChoice | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [filename, setFilename] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const selectedBrand = useMemo(
    () => brands.find((item) => item.id === brandId) ?? null,
    [brands, brandId],
  );

  const presets = useMemo(
    () => sourcesForBrand(brandName || selectedBrand?.name),
    [brandName, selectedBrand?.name],
  );

  const selectedProvider = providers.find((p) => p.key === providerKey);

  const resolvedSource = useMemo(() => {
    if (!sourceChoice) return { name: sourceName, url: sourceUrl };
    if (sourceChoice.kind === "brand_website" && selectedBrand?.website_url) {
      return {
        name: sourceName || `${selectedBrand.name} (offisiell)`,
        url: selectedBrand.website_url,
      };
    }
    if (sourceChoice.kind === "preset") {
      const preset = presets.find((item) => item.id === sourceChoice.id);
      if (preset) {
        return {
          name: sourceName || preset.sourceName,
          url: preset.sourceUrl,
        };
      }
    }
    if (sourceChoice.kind === "custom") {
      return {
        name: sourceName || "Egendefinert kilde",
        url: customUrl.trim() || sourceUrl,
      };
    }
    return { name: sourceName, url: sourceUrl };
  }, [
    sourceChoice,
    selectedBrand,
    presets,
    sourceName,
    sourceUrl,
    customUrl,
  ]);

  function onBrandChange(id: string) {
    setBrandId(id);
    const brand = brands.find((item) => item.id === id);
    const name = brand?.name ?? "";
    setBrandName(name);

    const brandPresets = sourcesForBrand(name);
    if (brandPresets[0]) {
      setSourceChoice({ kind: "preset", id: brandPresets[0].id });
      setSourceName(brandPresets[0].sourceName);
      setSourceUrl(brandPresets[0].sourceUrl);
      setCustomUrl("");
      return;
    }
    if (brand?.website_url) {
      setSourceChoice({ kind: "brand_website" });
      setSourceName(`${brand.name} (offisiell)`);
      setSourceUrl(brand.website_url);
      setCustomUrl("");
      return;
    }
    setSourceChoice({ kind: "custom" });
    setSourceName("");
    setSourceUrl("");
    setCustomUrl("");
  }

  function selectPreset(id: string) {
    const preset = presets.find((item) => item.id === id);
    setSourceChoice({ kind: "preset", id });
    if (preset) {
      setSourceName(preset.sourceName);
      setSourceUrl(preset.sourceUrl);
    }
  }

  function selectBrandWebsite() {
    if (!selectedBrand?.website_url) return;
    setSourceChoice({ kind: "brand_website" });
    setSourceName(`${selectedBrand.name} (offisiell)`);
    setSourceUrl(selectedBrand.website_url);
  }

  function selectCustom() {
    setSourceChoice({ kind: "custom" });
    setCustomUrl(sourceUrl);
  }

  function onFile(file: File | null) {
    if (!file) return;
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setRawInput(String(reader.result ?? ""));
    };
    reader.readAsText(file);
  }

  function submit() {
    setError(null);
    setMessage(null);

    if (!brandId && !brandName.trim()) {
      setError("Velg et merke for å starte research.");
      return;
    }

    const url = resolvedSource.url.trim();
    const paste = rawInput.trim();
    if (!url && !paste && providerKey !== "stub") {
      setError("Velg en kilde, eller lim inn tekst under Avansert.");
      return;
    }

    startTransition(async () => {
      const sourceMode: ResearchSourceMode =
        providerKey === "manufacturer_http"
          ? "live"
          : providerKey === "structured_json"
            ? "structured"
            : filename
              ? "manual_upload"
              : paste
                ? "manual_paste"
                : "live";

      const result = await startResearchJobAction({
        brandId: brandId || undefined,
        brandName: brandName || undefined,
        modelQuery: modelQuery || undefined,
        providerKey,
        sourceMode,
        sourceName: resolvedSource.name || undefined,
        sourceUrl: url || undefined,
        filename: filename || undefined,
        rawInput: paste || undefined,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Blocked live fetch still returns ok + jobId (manual handoff).
      setMessage(result.message);
      if (result.jobId) {
        router.push(`/admin/import/research/${result.jobId}`);
      }
    });
  }

  const canStart =
    Boolean(brandId || brandName.trim()) &&
    (Boolean(resolvedSource.url.trim()) ||
      Boolean(rawInput.trim()) ||
      providerKey === "stub");

  return (
    <form
      className="adminImportLayout"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <ol className="adminResearchSteps" aria-label="Research-arbeidsflyt">
        <li className={brandId || brandName ? "is-done" : "is-current"}>
          <span>1</span> Velg merke
        </li>
        <li
          className={
            resolvedSource.url
              ? "is-done"
              : brandId || brandName
                ? "is-current"
                : ""
          }
        >
          <span>2</span> Velg kilde
        </li>
        <li className={isPending ? "is-current" : ""}>
          <span>3</span> Start research
        </li>
        <li>
          <span>4</span> Forhåndsvis · godkjenn · importer
        </li>
      </ol>

      <p className="adminHint">
        Du trenger ikke lime inn lange tekster. Velg merke og offisiell kilde —
        systemet søker og lager utkast. Ingenting publiseres automatisk.
      </p>

      {message && (
        <p className="adminSuccess" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="authAlert authAlertError" role="alert">
          {error}
        </p>
      )}

      <div className="adminResearchPrimary">
        <label className="authField">
          <span>Merke</span>
          <select
            value={brandId}
            onChange={(e) => onBrandChange(e.target.value)}
            disabled={isPending}
            required
          >
            <option value="">— velg merke —</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="adminResearchSources" disabled={!brandId && !brandName}>
          <legend>Kilde</legend>
          {!brandId && !brandName ? (
            <p className="adminHint">Velg merke først for å se kilder.</p>
          ) : (
            <div className="adminResearchSourceList">
              {presets.map((preset) => {
                const checked =
                  sourceChoice?.kind === "preset" &&
                  sourceChoice.id === preset.id;
                return (
                  <label
                    key={preset.id}
                    className={`adminResearchSourceOption${checked ? " is-selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="research-source"
                      checked={checked}
                      disabled={isPending}
                      onChange={() => selectPreset(preset.id)}
                    />
                    <span>
                      <strong>{preset.label}</strong>
                      <small>{preset.sourceUrl}</small>
                    </span>
                  </label>
                );
              })}

              {selectedBrand?.website_url && (
                <label
                  className={`adminResearchSourceOption${
                    sourceChoice?.kind === "brand_website" ? " is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="research-source"
                    checked={sourceChoice?.kind === "brand_website"}
                    disabled={isPending}
                    onChange={selectBrandWebsite}
                  />
                  <span>
                    <strong>Merkets lagrede nettside</strong>
                    <small>{selectedBrand.website_url}</small>
                  </span>
                </label>
              )}

              <label
                className={`adminResearchSourceOption${
                  sourceChoice?.kind === "custom" ? " is-selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="research-source"
                  checked={sourceChoice?.kind === "custom"}
                  disabled={isPending}
                  onChange={selectCustom}
                />
                <span>
                  <strong>Annen offisiell URL</strong>
                  <small>Kun produsent- eller importørsider</small>
                </span>
              </label>

              {sourceChoice?.kind === "custom" && (
                <label className="authField adminFormFull">
                  <span>URL</span>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => {
                      setCustomUrl(e.target.value);
                      setSourceUrl(e.target.value);
                    }}
                    disabled={isPending}
                    placeholder="https://…"
                    required
                  />
                </label>
              )}
            </div>
          )}
        </fieldset>
      </div>

      <div className="adminQuickActions">
        <button
          type="submit"
          className="button primary"
          disabled={isPending || !canStart}
        >
          {isPending ? "Søker…" : "Start research"}
        </button>
      </div>

      <details
        className="adminResearchAdvanced"
        open={advancedOpen}
        onToggle={(event) =>
          setAdvancedOpen((event.target as HTMLDetailsElement).open)
        }
      >
        <summary>Avansert</summary>
        <p className="adminHint">
          Manuell innliming, filopplasting, modellfilter og provider-valg. Bruk
          kun når live-søk er blokkert eller du har strukturert data.
        </p>

        <div className="adminVariantForm">
          <label className="authField">
            <span>Merkenavn (fritekst)</span>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              disabled={isPending}
              placeholder="Tesla"
            />
          </label>

          <label className="authField">
            <span>Modell (valgfritt filter)</span>
            <input
              value={modelQuery}
              onChange={(e) => setModelQuery(e.target.value)}
              disabled={isPending}
              placeholder="Model Y"
            />
          </label>

          <label className="authField">
            <span>Provider</span>
            <select
              value={providerKey}
              onChange={(e) =>
                setProviderKey(e.target.value as ResearchProviderKey)
              }
              disabled={isPending}
            >
              {providers.map((provider) => (
                <option key={provider.key} value={provider.key}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          <label className="authField adminFormFull">
            <span>Kildenavn (overstyr)</span>
            <input
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              disabled={isPending}
              placeholder="Tesla Norge"
            />
          </label>

          <label className="authField adminFormFull">
            <span>Kilde-URL (overstyr)</span>
            <input
              value={sourceUrl}
              onChange={(e) => {
                setSourceUrl(e.target.value);
                if (sourceChoice?.kind === "custom") {
                  setCustomUrl(e.target.value);
                }
              }}
              disabled={isPending}
              placeholder="https://www.tesla.com/no_NO/modely"
            />
          </label>

          <label className="authField adminFormFull">
            <span>Last opp fil (tekst/JSON/CSV)</span>
            <input
              type="file"
              accept=".txt,.json,.csv,.md,text/plain,application/json"
              disabled={isPending}
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>

          <label className="authField adminFormFull">
            <span>Lim inn spesifikasjonstekst / JSON</span>
            <textarea
              rows={10}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              disabled={isPending}
              placeholder="Kun ved behov — f.eks. når nettstedet blokkerer bot-tilgang…"
            />
          </label>
        </div>

        {selectedProvider && (
          <p className="adminHint">{selectedProvider.description}</p>
        )}
      </details>
    </form>
  );
}
