"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  buildAiGeneratorPromptAction,
  generateAiImageCandidateAction,
  getAiImageGeneratorContextAction,
  preferOfficialOverAiAction,
  previewGenerateAiImageAction,
  type AiOfficialGalleryThumb,
} from "@/app/admin/ai-image-actions";
import {
  AI_ILLUSTRATIVE_BADGE,
  AI_WARNING,
  type AiIllustrationUsageType,
} from "@/lib/admin/ai-image-candidates";
import {
  AI_GENERATOR_ASPECT_RATIOS,
  AI_GENERATOR_IMAGE_TYPES,
  AI_GENERATOR_PRECHECK_ITEMS,
  AI_GENERATOR_STYLES,
  createAiGeneratorHistoryId,
  defaultNegativePrompt,
  isAiGeneratorPrecheckComplete,
  type AiGeneratorAspectRatio,
  type AiGeneratorHistoryEntry,
  type AiGeneratorPrecheckKey,
  type AiGeneratorStyle,
} from "@/lib/admin/ai-image-generator";

export type AiGeneratorVehicle = {
  carId: string;
  brand: string;
  model: string;
  variant?: string | null;
  year?: number | null;
  heroImageUrl?: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  vehicle: AiGeneratorVehicle;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function usageLabel(usageType: AiIllustrationUsageType): string {
  return (
    AI_GENERATOR_IMAGE_TYPES.find((option) => option.value === usageType)?.label ||
    usageType
  );
}

export default function AdminAiImageGeneratorModal({
  open,
  onClose,
  vehicle,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [usageType, setUsageType] =
    useState<AiIllustrationUsageType>("front_illustration");
  const [style, setStyle] = useState<AiGeneratorStyle>("scandinavian_studio");
  const [aspectRatio, setAspectRatio] =
    useState<AiGeneratorAspectRatio>("16:9");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState(defaultNegativePrompt());
  const [changeRequest, setChangeRequest] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [awaitingGeneration, setAwaitingGeneration] = useState(false);
  const [providerAvailable, setProviderAvailable] = useState(false);
  const [providerId, setProviderId] = useState("none");
  const [providerLabel, setProviderLabel] = useState("None (manual only)");
  const [providerConnected, setProviderConnected] = useState(false);
  const [providerHealthy, setProviderHealthy] = useState(false);
  const [providerMessage, setProviderMessage] = useState("");
  const [providerStatusCode, setProviderStatusCode] = useState("not_configured");
  const [costLabel, setCostLabel] = useState("Cost estimate");
  const [costAmount, setCostAmount] = useState("— (not metered yet)");
  const [costNote, setCostNote] = useState("");
  const [officialImagesExist, setOfficialImagesExist] = useState(false);
  const [officialImageCount, setOfficialImageCount] = useState(0);
  const [officialImages, setOfficialImages] = useState<AiOfficialGalleryThumb[]>(
    [],
  );
  const [history, setHistory] = useState<AiGeneratorHistoryEntry[]>([]);
  const [compareLeftId, setCompareLeftId] = useState<string | null>(null);
  const [compareRightId, setCompareRightId] = useState<string | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [precheck, setPrecheck] = useState<Record<AiGeneratorPrecheckKey, boolean>>(
    () =>
      Object.fromEntries(
        AI_GENERATOR_PRECHECK_ITEMS.map((item) => [item.key, false]),
      ) as Record<AiGeneratorPrecheckKey, boolean>,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, begin] = useTransition();

  const precheckKeys = AI_GENERATOR_PRECHECK_ITEMS.filter(
    (item) => precheck[item.key],
  ).map((item) => item.key);
  const precheckComplete = isAiGeneratorPrecheckComplete(precheckKeys);

  const compareLeft = useMemo(
    () => history.find((entry) => entry.id === compareLeftId) || null,
    [history, compareLeftId],
  );
  const compareRight = useMemo(
    () => history.find((entry) => entry.id === compareRightId) || null,
    [history, compareRightId],
  );

  function applyProviderFields(result: {
    providerAvailable?: boolean;
    providerId?: string;
    providerLabel?: string;
    providerConnected?: boolean;
    providerHealthy?: boolean;
    providerMessage?: string;
    providerStatusCode?: string;
    costEstimateLabel?: string;
    costEstimateAmount?: string;
    costEstimateNote?: string;
    officialImagesExist?: boolean;
    officialImageCount?: number;
    officialImages?: AiOfficialGalleryThumb[];
  }) {
    if (typeof result.providerAvailable === "boolean") {
      setProviderAvailable(result.providerAvailable);
    }
    if (result.providerId) setProviderId(result.providerId);
    if (result.providerLabel) setProviderLabel(result.providerLabel);
    if (typeof result.providerConnected === "boolean") {
      setProviderConnected(result.providerConnected);
    }
    if (typeof result.providerHealthy === "boolean") {
      setProviderHealthy(result.providerHealthy);
    }
    if (result.providerMessage) setProviderMessage(result.providerMessage);
    if (result.providerStatusCode) setProviderStatusCode(result.providerStatusCode);
    if (result.costEstimateLabel) setCostLabel(result.costEstimateLabel);
    if (result.costEstimateAmount) setCostAmount(result.costEstimateAmount);
    if (result.costEstimateNote) setCostNote(result.costEstimateNote);
    if (typeof result.officialImagesExist === "boolean") {
      setOfficialImagesExist(result.officialImagesExist);
    }
    if (typeof result.officialImageCount === "number") {
      setOfficialImageCount(result.officialImageCount);
    }
    if (result.officialImages) setOfficialImages(result.officialImages);
  }

  function pushHistoryEntry(entry: Omit<AiGeneratorHistoryEntry, "id" | "createdAt">) {
    const next: AiGeneratorHistoryEntry = {
      ...entry,
      id: createAiGeneratorHistoryId(),
      createdAt: new Date().toISOString(),
    };
    setHistory((prev) => [next, ...prev].slice(0, 20));
    setCompareLeftId((prev) => prev || next.id);
    setCompareRightId((prevRight) => {
      if (!prevRight) return next.id;
      return prevRight;
    });
    return next;
  }

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPreviewUrl(null);
    setAwaitingGeneration(false);
    setMessage(null);
    setError(null);
    setHistory([]);
    setCompareLeftId(null);
    setCompareRightId(null);
    setShowCompare(false);
    setChangeRequest("");
    setPrecheck(
      Object.fromEntries(
        AI_GENERATOR_PRECHECK_ITEMS.map((item) => [item.key, false]),
      ) as Record<AiGeneratorPrecheckKey, boolean>,
    );
    begin(async () => {
      const context = await getAiImageGeneratorContextAction({
        carId: vehicle.carId,
        aspectRatio,
      });
      if (context.ok) {
        applyProviderFields(context);
        setMessage(context.message);
      }
      const built = await buildAiGeneratorPromptAction({
        carId: vehicle.carId,
        usageType,
        style,
        aspectRatio,
        changeRequest: "",
      });
      if (built.ok) {
        setPrompt(built.prompt || "");
        setNegativePrompt(built.negativePrompt || defaultNegativePrompt());
        applyProviderFields(built);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh when opening
  }, [open, vehicle.carId]);

  useEffect(() => {
    if (!open || step !== 2) return;
    begin(async () => {
      const built = await buildAiGeneratorPromptAction({
        carId: vehicle.carId,
        usageType,
        style,
        aspectRatio,
        changeRequest,
      });
      if (built.ok && built.prompt) {
        setPrompt(built.prompt);
        applyProviderFields(built);
      }
    });
  }, [usageType, style, aspectRatio, open, step, vehicle.carId, changeRequest]);

  if (!open) return null;

  function runGenerate() {
    setError(null);
    setMessage(null);
    begin(async () => {
      const result = await previewGenerateAiImageAction({
        carId: vehicle.carId,
        usageType,
        prompt,
        negativePrompt,
        aspectRatio,
        changeRequest,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrompt(result.prompt || prompt);
      setNegativePrompt(result.negativePrompt || negativePrompt);
      setAwaitingGeneration(Boolean(result.awaitingGeneration));
      setPreviewUrl(result.previewDataUrl || null);
      applyProviderFields(result);
      setMessage(result.message);
      pushHistoryEntry({
        usageType,
        usageLabel: usageLabel(usageType),
        prompt: result.prompt || prompt,
        negativePrompt: result.negativePrompt || negativePrompt,
        previewUrl: result.previewDataUrl || null,
        awaitingGeneration: Boolean(result.awaitingGeneration),
        source: result.previewDataUrl
          ? "provider"
          : result.awaitingGeneration
            ? "awaiting"
            : "provider",
        providerLabel: result.providerLabel || providerLabel,
        costEstimate: result.costEstimateAmount || costAmount,
      });
      setStep(4);
    });
  }

  function runAcceptToReview(imageBase64?: string | null) {
    setError(null);
    setMessage(null);
    if (!precheckComplete) {
      setError("Alle kvalitetssjekkbokser må være krysset av før Approve.");
      return;
    }
    begin(async () => {
      const result = await generateAiImageCandidateAction({
        carId: vehicle.carId,
        usageType,
        prompt,
        negativePrompt,
        style,
        aspectRatio,
        changeRequest,
        precheckKeys,
        imageBase64:
          imageBase64 ||
          (previewUrl?.startsWith("data:") ? previewUrl : null),
        attemptProvider: false,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      const path = result.reviewPath || `/admin/images/${vehicle.carId}`;
      onClose();
      router.push(path);
      router.refresh();
    });
  }

  function runPreferOfficial() {
    setError(null);
    setMessage(null);
    begin(async () => {
      const result = await preferOfficialOverAiAction({ carId: vehicle.carId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      applyProviderFields(result);
      setMessage(result.message);
      const path = result.reviewPath || `/admin/images/${vehicle.carId}`;
      onClose();
      router.push(path);
      router.refresh();
    });
  }

  async function onUploadPreview(file: File) {
    try {
      const dataUrl = await fileToBase64(file);
      setPreviewUrl(dataUrl);
      setAwaitingGeneration(false);
      setMessage("Opplastet forhåndsvisning klar.");
      pushHistoryEntry({
        usageType,
        usageLabel: usageLabel(usageType),
        prompt,
        negativePrompt,
        previewUrl: dataUrl,
        awaitingGeneration: false,
        source: "upload",
        providerLabel: "Manual upload",
        costEstimate: "— (upload)",
      });
      setStep(4);
    } catch {
      setError("Kunne ikke lese filen.");
    }
  }

  function restoreFromHistory(entry: AiGeneratorHistoryEntry) {
    setUsageType(entry.usageType as AiIllustrationUsageType);
    setPrompt(entry.prompt);
    setNegativePrompt(entry.negativePrompt);
    setPreviewUrl(entry.previewUrl);
    setAwaitingGeneration(entry.awaitingGeneration);
    setMessage(`Restored generation from history (${entry.usageLabel}).`);
    setStep(4);
  }

  return (
    <div
      className="adminAiGeneratorOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-generator-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose();
      }}
    >
      <div className="adminAiGeneratorModal">
        <header className="adminAiGeneratorHeader">
          <div>
            <h2 id="ai-generator-title">Lag AI-bilde</h2>
            <p className="adminHint">
              Admin only · Oppretter kun Pending AI Candidate · Aldri auto-godkjenning
            </p>
          </div>
          <button
            type="button"
            className="button ghost buttonSm"
            disabled={isPending}
            onClick={onClose}
          >
            Lukk
          </button>
        </header>

        <div className="adminAiGeneratorBadges">
          <span className="adminAiBadge">{AI_ILLUSTRATIVE_BADGE}</span>
          <span className="adminAiBadge isWarning">{AI_WARNING}</span>
        </div>

        <dl className="adminAiGeneratorVehicle">
          <div>
            <dt>Vehicle</dt>
            <dd>
              {vehicle.brand} {vehicle.model}
            </dd>
          </div>
          <div>
            <dt>Brand</dt>
            <dd>{vehicle.brand || "—"}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{vehicle.model || "—"}</dd>
          </div>
          <div>
            <dt>Variant</dt>
            <dd>{vehicle.variant || "—"}</dd>
          </div>
          <div>
            <dt>Model year</dt>
            <dd>{vehicle.year ?? "—"}</dd>
          </div>
        </dl>

        <section
          className="adminAiGeneratorStatus"
          aria-label="Provider status and cost"
        >
          <div>
            <strong>Provider status</strong>
            <p>
              <code>{providerId}</code> · {providerLabel}
            </p>
            <p className="adminHint">
              Status:{" "}
              <strong>
                {providerStatusCode === "connected"
                  ? "Connected"
                  : providerStatusCode === "missing_api_key"
                    ? "Missing API key"
                    : providerStatusCode === "model_unavailable"
                      ? "Model unavailable"
                      : providerStatusCode === "quota_or_billing"
                        ? "Kvote / bildekvote ikke aktiv"
                        : providerStatusCode === "feature_disabled"
                          ? "Feature disabled"
                          : providerStatusCode === "temporary_error"
                            ? "Temporary provider error"
                            : providerConnected && providerHealthy
                              ? "Connected"
                              : providerAvailable
                                ? "Selected (not ready)"
                                : "Manual / Awaiting Generation"}
              </strong>
              {providerMessage ? ` — ${providerMessage}` : ""}
            </p>
          </div>
          <div>
            <strong>{costLabel}</strong>
            <p className="adminAiCostAmount">{costAmount}</p>
            <p className="adminHint">{costNote || "Cost metering placeholder."}</p>
          </div>
        </section>

        {officialImagesExist ? (
          <section className="adminAiOfficialBanner" role="status">
            <div>
              <strong>Official images exist ({officialImageCount})</strong>
              <p className="adminHint">
                Official manufacturer photography is preferred. AI stays secondary and
                labeled as illustration. You can replace AI candidates with official.
              </p>
              {officialImages.length > 0 ? (
                <ul className="adminAiOfficialThumbs">
                  {officialImages.map((image) => (
                    <li key={image.id}>
                      <div className="adminAiOfficialThumbFrame">
                        <Image
                          src={image.imageUrl}
                          alt={image.imageTypeLabel}
                          fill
                          sizes="96px"
                          unoptimized
                          className="adminImagePreviewImg"
                        />
                      </div>
                      <span>
                        {image.isPrimary ? "Hero · " : ""}
                        {image.imageTypeLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              className="button secondary buttonSm"
              disabled={isPending}
              onClick={runPreferOfficial}
            >
              Replace AI with official image
            </button>
          </section>
        ) : (
          <p className="adminHint">
            No official gallery images detected yet for this model.
          </p>
        )}

        {vehicle.heroImageUrl ? (
          <div className="adminAiGeneratorHero">
            <span>Current approved Hero</span>
            <div className="adminAiGeneratorHeroFrame">
              <Image
                src={vehicle.heroImageUrl}
                alt="Current hero"
                fill
                sizes="220px"
                unoptimized
                className="adminImagePreviewImg"
              />
            </div>
          </div>
        ) : (
          <p className="adminHint">No approved Hero yet.</p>
        )}

        <nav className="adminAiGeneratorSteps" aria-label="Generator steps">
          {[
            { n: 1, label: "Image type" },
            { n: 2, label: "Prompt" },
            { n: 3, label: "Generate" },
            { n: 4, label: "Preview" },
          ].map((item) => (
            <button
              key={item.n}
              type="button"
              className={step === item.n ? "is-active" : undefined}
              disabled={isPending}
              onClick={() => setStep(item.n)}
            >
              {item.n}. {item.label}
            </button>
          ))}
        </nav>

        {step === 1 ? (
          <section className="adminAiGeneratorSection">
            <h3>1. Image type selector</h3>
            <ul className="adminAiGeneratorTypeList">
              {AI_GENERATOR_IMAGE_TYPES.map((option) => (
                <li key={option.value}>
                  <label>
                    <input
                      type="radio"
                      name="ai-usage-type"
                      checked={usageType === option.value}
                      onChange={() => setUsageType(option.value)}
                      disabled={isPending}
                    />
                    <span>{option.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            {(usageType === "interior_illustration" ||
              usageType === "charging_illustration" ||
              usageType === "cargo_illustration" ||
              usageType === "editor_requested_detail") && (
              <label className="authField">
                <span>Explicit editor note (required)</span>
                <textarea
                  rows={2}
                  value={changeRequest}
                  onChange={(e) => setChangeRequest(e.target.value)}
                  disabled={isPending}
                  placeholder="Why this detail view is needed"
                />
              </label>
            )}
            <div className="adminQuickActions">
              <button
                type="button"
                className="button primary buttonSm"
                disabled={isPending}
                onClick={() => setStep(2)}
              >
                Next: Prompt editor
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="adminAiGeneratorSection">
            <h3>2. Prompt editor</h3>
            <label className="authField">
              <span>Prompt</span>
              <textarea
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isPending}
              />
            </label>
            <label className="authField">
              <span>Negative prompt</span>
              <textarea
                rows={3}
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                disabled={isPending}
              />
            </label>
            <div className="adminAiGeneratorRow">
              <label className="authField">
                <span>Style</span>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as AiGeneratorStyle)}
                  disabled={isPending}
                >
                  {AI_GENERATOR_STYLES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="authField">
                <span>Aspect Ratio</span>
                <select
                  value={aspectRatio}
                  onChange={(e) =>
                    setAspectRatio(e.target.value as AiGeneratorAspectRatio)
                  }
                  disabled={isPending}
                >
                  {AI_GENERATOR_ASPECT_RATIOS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="adminQuickActions">
              <button
                type="button"
                className="button ghost buttonSm"
                disabled={isPending}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                type="button"
                className="button primary buttonSm"
                disabled={isPending || !prompt.trim()}
                onClick={() => setStep(3)}
              >
                Next: Generate Image
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="adminAiGeneratorSection">
            <h3>3. Generate Image</h3>
            <p className="adminHint">
              {providerAvailable
                ? "AI provider selected — Generate Image creates a preview (still Pending until Image Review)."
                : "No connected AI provider — Generate Image opens Awaiting Generation and allows manual upload."}
            </p>
            <p className="adminHint">
              {costLabel}: <strong>{costAmount}</strong>
            </p>
            <div className="adminQuickActions">
              <button
                type="button"
                className="button primary"
                disabled={isPending || !prompt.trim()}
                onClick={runGenerate}
              >
                {isPending ? "Working…" : "Generate Image"}
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={isPending || !prompt.trim()}
                onClick={runGenerate}
              >
                Prøv igjen
              </button>
              <label className="button ghost buttonSm adminAiUploadLabel">
                Last opp resultat
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  disabled={isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    begin(async () => {
                      await onUploadPreview(file);
                    });
                  }}
                />
              </label>
              <button
                type="button"
                className="button ghost"
                disabled={isPending}
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="adminAiGeneratorSection">
            <h3>4. Preview after generation</h3>
            {awaitingGeneration && !previewUrl ? (
              <div className="adminNotice" role="status">
                <strong>Awaiting Generation</strong>
                <p>
                  {message?.trim() ||
                    "Google har ikke aktivert bildekvote for dette prosjektet ennå. Du kan laste opp et generert bilde manuelt."}
                </p>
                <p className="adminHint">
                  Prompt og bildetype er bevart. Ingen falsk kandidat er opprettet.
                  Provider styres av <code>AI_PROVIDER</code> — redaktører velger
                  aldri provider.
                </p>
                <div className="adminQuickActions">
                  <button
                    type="button"
                    className="button secondary buttonSm"
                    disabled={isPending || !prompt.trim()}
                    onClick={runGenerate}
                  >
                    Prøv igjen
                  </button>
                  <label className="button primary buttonSm adminAiUploadLabel">
                    Last opp resultat
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      hidden
                      disabled={isPending}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        begin(async () => {
                          await onUploadPreview(file);
                        });
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : null}

            {previewUrl ? (
              <div className="adminAiGeneratorPreviewFrame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="AI preview" />
              </div>
            ) : null}

            <div className="adminAiGeneratorHistory">
              <div className="adminAiGeneratorHistoryHeader">
                <h4>Generation history</h4>
                <button
                  type="button"
                  className="button ghost buttonSm"
                  disabled={isPending || history.length < 2}
                  onClick={() => setShowCompare((prev) => !prev)}
                >
                  {showCompare ? "Hide compare" : "Compare previous generations"}
                </button>
              </div>
              {history.length === 0 ? (
                <p className="adminHint">No generations in this session yet.</p>
              ) : (
                <ul className="adminAiGeneratorHistoryList">
                  {history.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="adminAiHistoryItem"
                        disabled={isPending}
                        onClick={() => restoreFromHistory(entry)}
                      >
                        {entry.previewUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={entry.previewUrl} alt="" />
                        ) : (
                          <span className="adminAiHistoryPlaceholder">Awaiting</span>
                        )}
                        <span>
                          <strong>{entry.usageLabel}</strong>
                          <br />
                          {new Date(entry.createdAt).toLocaleTimeString()} ·{" "}
                          {entry.source} · {entry.costEstimate}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {showCompare && history.length >= 2 ? (
              <div className="adminAiComparePanel">
                <h4>Compare previous generations</h4>
                <div className="adminAiGeneratorRow">
                  <label className="authField">
                    <span>Left</span>
                    <select
                      value={compareLeftId || ""}
                      onChange={(e) => setCompareLeftId(e.target.value || null)}
                      disabled={isPending}
                    >
                      {history.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.usageLabel} ·{" "}
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="authField">
                    <span>Right</span>
                    <select
                      value={compareRightId || ""}
                      onChange={(e) => setCompareRightId(e.target.value || null)}
                      disabled={isPending}
                    >
                      {history.map((entry) => (
                        <option key={entry.id} value={entry.id}>
                          {entry.usageLabel} ·{" "}
                          {new Date(entry.createdAt).toLocaleTimeString()}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="adminAiCompareFrames">
                  <div>
                    {compareLeft?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={compareLeft.previewUrl} alt="Compare left" />
                    ) : (
                      <p className="adminHint">No preview</p>
                    )}
                  </div>
                  <div>
                    {compareRight?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={compareRight.previewUrl} alt="Compare right" />
                    ) : (
                      <p className="adminHint">No preview</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <fieldset className="adminAiVisualChecklist" disabled={isPending}>
              <legend>Quality check (mandatory before Approve)</legend>
              <ul>
                {AI_GENERATOR_PRECHECK_ITEMS.map((item) => (
                  <li key={item.key}>
                    <label className="adminAiIllustrationCheck">
                      <input
                        type="checkbox"
                        checked={precheck[item.key]}
                        onChange={(e) =>
                          setPrecheck((prev) => ({
                            ...prev,
                            [item.key]: e.target.checked,
                          }))
                        }
                      />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div className="adminQuickActions">
              <button
                type="button"
                className="button primary"
                disabled={isPending || !precheckComplete}
                title={
                  !precheckComplete
                    ? "Complete all quality checkboxes"
                    : undefined
                }
                onClick={() => runAcceptToReview()}
              >
                Approve → Image Review
              </button>
              <button
                type="button"
                className="button ghost"
                disabled={isPending}
                onClick={() => {
                  setPreviewUrl(null);
                  setAwaitingGeneration(false);
                  setStep(3);
                }}
              >
                Reject
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={isPending || !prompt.trim()}
                onClick={runGenerate}
              >
                Prøv igjen
              </button>
              <label className="button ghost buttonSm adminAiUploadLabel">
                Last opp resultat
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  disabled={isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    begin(async () => {
                      await onUploadPreview(file);
                    });
                  }}
                />
              </label>
              {officialImagesExist ? (
                <button
                  type="button"
                  className="button secondary buttonSm"
                  disabled={isPending}
                  onClick={runPreferOfficial}
                >
                  Replace AI with official image
                </button>
              ) : null}
            </div>
            <p className="adminHint">
              Approve oppretter en <strong>Pending</strong> AI-kandidat og åpner Image
              Review. Hero er aldri automatisk. Offisielle bilder forblir foretrukket.
            </p>
          </section>
        ) : null}

        {(message || error) && (
          <div
            className="adminNotice"
            role="status"
            style={error ? { borderColor: "#c2410c", background: "#fff7ed" } : undefined}
          >
            {error || message}
          </div>
        )}
      </div>
    </div>
  );
}
