"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState, useTransition } from "react";
import {
  approveImageCandidateAction,
  rejectImageCandidateAction,
  setHeroImageCandidateAction,
} from "@/app/admin/image-review-actions";
import { regenerateAiIllustrationCandidateAction } from "@/app/admin/ai-image-actions";
import AdminAiIllustrationPanel, {
  AiCandidateUploadButton,
} from "@/components/admin/admin-ai-illustration-panel";
import AdminImageCandidatePreview from "@/components/admin/admin-image-candidate-preview";
import {
  AI_VISUAL_CHECKLIST_ITEMS,
  type AiVisualChecklistKey,
} from "@/lib/admin/ai-image-candidates";
import type {
  ImageQualityWarning,
  ImageReviewCard,
  ImageReviewReadiness,
} from "@/lib/admin/image-review";
import type { AdminCar } from "@/lib/admin/types";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import { CAR_IMAGE_TYPE_LABELS } from "@/lib/admin/car-image-types";

type Props = {
  car: AdminCar;
  cards: ImageReviewCard[];
  gallery: CarImageRow[];
  readiness: ImageReviewReadiness;
  emptyCandidatesMessage?: string | null;
};

function statusClass(status: ImageReviewCard["status"]): string {
  if (status === "Approved") return "adminStatusBadge isApproved";
  if (status === "Rejected") return "adminStatusBadge isDraft";
  return "adminStatusBadge isNeedsReview";
}

function statusLabelNb(status: ImageReviewCard["status"] | string): string {
  if (status === "Approved") return "Godkjent";
  if (status === "Rejected") return "Avvist";
  if (status === "Candidate") return "Kandidat";
  if (status === "Awaiting Generation") return "Venter på generering";
  return String(status);
}

function readinessLabelNb(label: string): string {
  if (label === "Image Ready") return "Bilder klare";
  if (label === "Images Pending Review") return "Bilder venter på gjennomgang";
  return label;
}

function reviewLabelNb(label: string): string {
  const map: Record<string, string> = {
    "Awaiting Generation": "Venter på generering",
    "Not visually verified": "Ikke visuelt verifisert",
    "Visually verified": "Visuelt verifisert",
    "Editorial Archive": "Redaksjonelt arkiv",
    Low: "Lav",
    Medium: "Middels",
    High: "Høy",
    "Generate or upload illustration": "Generer eller last opp illustrasjon",
    "Complete visual quality checklist": "Fullfør sjekkliste for bildekvalitet",
    "Prefer official manufacturer image — move AI to Editorial Archive":
      "Foretrekk offisiell produsentfoto — flytt AI til redaksjonelt arkiv",
    "May approve after Visually verified confirmation":
      "Kan godkjennes etter bekreftet visuelt verifisert",
    "Approved & verified — official preferred when available":
      "Godkjent og verifisert — offisiell foto foretrukket når tilgjengelig",
    "Keep in Editorial Archive (do not delete)":
      "Behold i redaksjonelt arkiv (ikke slett)",
  };
  return map[label] ?? label;
}

function CandidateCard({
  car,
  card,
  isPending,
  onAction,
  onOpenFullSize,
}: {
  car: AdminCar;
  card: ImageReviewCard;
  isPending: boolean;
  onAction: (
    action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>,
  ) => void;
  onOpenFullSize: (url: string) => void;
}) {
  const [liveResolution, setLiveResolution] = useState<string | null>(card.resolution);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [confirmAiApprove, setConfirmAiApprove] = useState(false);
  const [confirmAiHero, setConfirmAiHero] = useState(false);
  const [confirmVisuallyVerified, setConfirmVisuallyVerified] = useState(
    card.aiVisuallyVerified,
  );
  const [checklist, setChecklist] = useState<Record<AiVisualChecklistKey, boolean>>(
    () =>
      Object.fromEntries(
        AI_VISUAL_CHECKLIST_ITEMS.map((item) => [item.key, card.aiVisuallyVerified]),
      ) as Record<AiVisualChecklistKey, boolean>,
  );
  const [changeRequest, setChangeRequest] = useState("");

  const warnings: ImageQualityWarning[] = [...card.warnings];
  if (previewFailed && !card.aiAwaitingGeneration && !warnings.includes("Broken URL")) {
    warnings.push("Broken URL");
  }

  const checklistKeys = AI_VISUAL_CHECKLIST_ITEMS.filter(
    (item) => checklist[item.key],
  ).map((item) => item.key);
  const checklistComplete =
    checklistKeys.length === AI_VISUAL_CHECKLIST_ITEMS.length;
  const visuallyVerifiedReady = confirmVisuallyVerified && checklistComplete;

  const resolution = liveResolution || card.resolution || "—";
  const openSourceHref = card.sourceUrl || card.originalUrl;
  const canApproveOfficial =
    !card.isAiIllustration &&
    card.status !== "Approved" &&
    card.status !== "Rejected" &&
    !previewFailed &&
    Boolean(card.previewUrl) &&
    !warnings.includes("Download Failed");
  const canApproveAi =
    card.isAiIllustration &&
    !card.aiAwaitingGeneration &&
    !card.aiEditorialArchive &&
    card.status !== "Approved" &&
    card.status !== "Rejected" &&
    Boolean(card.previewUrl) &&
    confirmAiApprove &&
    visuallyVerifiedReady;
  const canHeroAi =
    card.isAiIllustration &&
    (card.status === "Approved" || card.dbStatus === "applied") &&
    (card.aiVisuallyVerified || visuallyVerifiedReady) &&
    !card.aiEditorialArchive &&
    confirmAiHero;

  return (
    <li className={`adminImageReviewCard${card.isAiIllustration ? " isAiIllustration" : ""}`}>
      {card.aiAwaitingGeneration ? (
        <div className="adminImageReviewPreview is-error">
          <div className="adminImageReviewPlaceholder">
            <strong>Venter på generering</strong>
            <span>
              Prompt klar — generer eksternt eller last opp. Ikke offisiell produsentfoto.
            </span>
          </div>
        </div>
      ) : (
        <AdminImageCandidatePreview
          url={card.previewUrl}
          alt={card.altText || `${car.brand} ${car.model} ${card.imageTypeLabel}`}
          isHero={card.isHeroCandidate}
          onOpenFullSize={onOpenFullSize}
          onResolution={setLiveResolution}
          onLoadStateChange={(state) => setPreviewFailed(state === "error")}
        />
      )}

      <div className="adminImageReviewCardBody">
        <div className="adminImageReviewCardMeta">
          <span className={statusClass(card.status)}>
            {statusLabelNb(card.status)}
          </span>
          <strong>{card.imageTypeLabel}</strong>
          {card.isAiIllustration ? (
            <>
              <span className="adminAiBadge">{card.aiQualityReview?.illustrativeBadge}</span>
              <span className="adminAiBadge isWarning">
                {card.aiQualityReview?.notOfficialBadge}
              </span>
            </>
          ) : null}
        </div>

        {card.isAiIllustration && card.aiQualityReview ? (
          <div className="adminAiQualityPanel" role="region" aria-label="AI visuell kvalitetsgjennomgang">
            <p className="adminNotice" role="status">
              {card.aiPublicLabel}
              <br />
              {card.aiInternalWarning}
            </p>
            <dl className="adminAiQualityMeta">
              <div>
                <dt>AI-tillit</dt>
                <dd>{reviewLabelNb(card.aiQualityReview.confidence)}</dd>
              </div>
              <div>
                <dt>Visuell gjennomgang</dt>
                <dd>{reviewLabelNb(card.aiQualityReview.visualReview)}</dd>
              </div>
              <div>
                <dt>Offisielt bilde tilgjengelig?</dt>
                <dd>{card.aiQualityReview.officialImageAvailable ? "Ja" : "Nei"}</dd>
              </div>
              <div>
                <dt>Anbefalt handling</dt>
                <dd>{reviewLabelNb(card.aiQualityReview.recommendedAction)}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <dl className="adminTopicMeta">
          <div>
            <dt>Bildetype</dt>
            <dd>{card.imageTypeLabel}</dd>
          </div>
          <div>
            <dt>Kilde</dt>
            <dd>{card.sourceName || "—"}</dd>
          </div>
          <div>
            <dt>Kilde-URL</dt>
            <dd className="adminImageReviewUrl">
              {card.sourceUrl ? (
                <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                  {card.sourceUrl}
                </a>
              ) : card.isAiIllustration ? (
                "— (ingen oppdiktet produsent-URL)"
              ) : (
                "—"
              )}
            </dd>
          </div>
          {card.aiUsageType ? (
            <div>
              <dt>Brukstype</dt>
              <dd>{card.aiUsageType}</dd>
            </div>
          ) : null}
          <div>
            <dt>Oppløsning</dt>
            <dd>{resolution}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {card.aiAwaitingGeneration
                ? "Venter på generering"
                : statusLabelNb(card.status)}
            </dd>
          </div>
        </dl>

        {card.aiGenerationPrompt ? (
          <details className="adminAiPromptDetails">
            <summary>Genereringsprompt</summary>
            <pre className="adminAiPrompt">{card.aiGenerationPrompt}</pre>
          </details>
        ) : null}

        {warnings.length > 0 ? (
          <ul className="adminImageReviewWarnings">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        {card.isAiIllustration &&
        !card.aiAwaitingGeneration &&
        !card.aiEditorialArchive &&
        card.status === "Candidate" ? (
          <fieldset className="adminAiVisualChecklist" disabled={isPending}>
            <legend>Visuell kvalitetsgjennomgang (påkrevd)</legend>
            <ul>
              {AI_VISUAL_CHECKLIST_ITEMS.map((item) => (
                <li key={item.key}>
                  <label className="adminAiIllustrationCheck">
                    <input
                      type="checkbox"
                      checked={checklist[item.key]}
                      onChange={(event) =>
                        setChecklist((prev) => ({
                          ...prev,
                          [item.key]: event.target.checked,
                        }))
                      }
                    />
                    <span>{item.label}</span>
                  </label>
                </li>
              ))}
            </ul>
            <label className="adminAiIllustrationCheck adminAiVisuallyVerified">
              <input
                type="checkbox"
                checked={confirmVisuallyVerified}
                onChange={(event) => setConfirmVisuallyVerified(event.target.checked)}
                disabled={!checklistComplete}
              />
              <span>
                <strong>Visuelt verifisert</strong> — Jeg bekrefter at illustrasjonen
                visuelt representerer riktig bil (krever full sjekkliste over).
              </span>
            </label>
            <label className="adminAiIllustrationCheck">
              <input
                type="checkbox"
                checked={confirmAiApprove}
                onChange={(event) => setConfirmAiApprove(event.target.checked)}
                disabled={!visuallyVerifiedReady}
              />
              <span>
                Jeg bekrefter at dette er en AI-generert illustrasjon (ikke offisiell
                produsentfoto) og kun kan godkjennes etter visuell verifisering.
              </span>
            </label>
          </fieldset>
        ) : null}

        {card.isAiIllustration &&
        card.status !== "Rejected" &&
        !card.aiEditorialArchive ? (
          <label className="adminAiIllustrationCheck">
            <input
              type="checkbox"
              checked={confirmAiHero}
              onChange={(event) => setConfirmAiHero(event.target.checked)}
              disabled={
                isPending ||
                !(card.status === "Approved" || card.dbStatus === "applied") ||
                !(card.aiVisuallyVerified || visuallyVerifiedReady)
              }
            />
            <span>
              Bekreft eksplisitt Hero for denne godkjente og visuelt verifiserte
              AI-illustrasjonen (offisiell foto foretrukket; aldri auto-valgt).
            </span>
          </label>
        ) : null}

        {card.isAiIllustration ? (
          <div className="adminAiChangeRequest">
            <label>
              <span>Be om endringer / regenerer</span>
              <input
                type="text"
                value={changeRequest}
                onChange={(event) => setChangeRequest(event.target.value)}
                placeholder="Beskriv ønskede endringer"
                disabled={isPending}
              />
            </label>
          </div>
        ) : null}

        <div className="adminQuickActions adminImageReviewActions">
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={
              isPending ||
              (card.isAiIllustration ? !canApproveAi : !canApproveOfficial)
            }
            title={
              card.aiAwaitingGeneration
                ? "Venter på generering — last opp eller generer først"
                : card.aiEditorialArchive
                  ? "Redaksjonelt arkiv — offisiell foto foretrukket"
                  : card.isAiIllustration && !visuallyVerifiedReady
                    ? "Fullfør visuell kvalitetsgjennomgang og bekreft visuelt verifisert"
                    : card.isAiIllustration && !confirmAiApprove
                      ? "Bekreft AI-illustrasjon først"
                      : warnings.includes("Download Failed")
                        ? "Nedlasting feilet — last opp manuelt i galleriet"
                        : previewFailed || !card.previewUrl
                          ? "Lokal gjennomgangskopi mangler — kan ikke godkjenne OEM-hotlink"
                          : undefined
            }
            onClick={() =>
              onAction(() =>
                approveImageCandidateAction({
                  imageId: card.id,
                  attachToGallery: true,
                  confirmAiIllustration: card.isAiIllustration
                    ? confirmAiApprove
                    : undefined,
                  confirmVisuallyVerified: card.isAiIllustration
                    ? confirmVisuallyVerified
                    : undefined,
                  visualChecklistKeys: card.isAiIllustration
                    ? checklistKeys
                    : undefined,
                }),
              )
            }
          >
            Godkjenn
          </button>

          <button
            type="button"
            className="button ghost buttonSm"
            disabled={isPending || card.isInGallery || card.status === "Rejected"}
            onClick={() =>
              onAction(() => rejectImageCandidateAction({ imageId: card.id }))
            }
          >
            Avvis
          </button>

          <button
            type="button"
            className="button primary buttonSm"
            disabled={
              isPending ||
              card.status === "Rejected" ||
              card.aiAwaitingGeneration ||
              (card.isAiIllustration
                ? !canHeroAi
                : false)
            }
            title={
              card.isAiIllustration &&
              !(card.status === "Approved" || card.dbStatus === "applied")
                ? "Godkjenn og visuelt verifisert kreves før Hero"
                : card.isAiIllustration &&
                    !(card.aiVisuallyVerified || visuallyVerifiedReady)
                  ? "Visuelt verifisert kreves før Hero"
                  : card.isAiIllustration && !confirmAiHero
                    ? "Bekreft AI-Hero først"
                    : undefined
            }
            onClick={() =>
              onAction(() =>
                setHeroImageCandidateAction({
                  imageId: card.id,
                  confirmAiHero: card.isAiIllustration ? confirmAiHero : undefined,
                }),
              )
            }
          >
            Velg Hero
          </button>

          {card.aiAwaitingGeneration ? (
            <AiCandidateUploadButton imageId={card.id} disabled={isPending} />
          ) : (
            <button
              type="button"
              className="button ghost buttonSm"
              disabled={!card.previewUrl || previewFailed}
              onClick={() => {
                if (card.previewUrl) onOpenFullSize(card.previewUrl);
              }}
            >
              Forhåndsvis full størrelse
            </button>
          )}

          {card.isAiIllustration ? (
            <button
              type="button"
              className="button ghost buttonSm"
              disabled={isPending || !changeRequest.trim()}
              onClick={() =>
                onAction(() =>
                  regenerateAiIllustrationCandidateAction({
                    imageId: card.id,
                    changeRequest,
                    usageType: card.aiUsageType || undefined,
                  }),
                )
              }
            >
              Regenerer
            </button>
          ) : (
            <a
              href={openSourceHref}
              target="_blank"
              rel="noreferrer"
              className="button ghost buttonSm"
            >
              Åpne kilde
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export default function AdminImageReviewWorkspace({
  car,
  cards,
  gallery,
  readiness,
  emptyCandidatesMessage = null,
}: Props) {
  const router = useRouter();
  const [isPending, begin] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  function run(
    action: () => Promise<{ ok: true; message: string } | { ok: false; error: string }>,
  ) {
    setMessage(null);
    setError(null);
    begin(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setMessage(result.message);
      startTransition(() => router.refresh());
    });
  }

  return (
    <div className="adminImageReview">
      <section className="adminImageReviewSummary" aria-labelledby="image-readiness-heading">
        <div>
          <h2 id="image-readiness-heading">Publiseringsbilder</h2>
          <p className="adminHint">
            Hver research-kandidat viser forhåndsvisning. Bilder klare krever godkjent
            offisiell Hero + Front + Side (AI-illustrasjoner teller aldri som Bilder
            klare). Godkjenning publiserer aldri bilen.
          </p>
        </div>
        <span
          className={
            readiness.imagesReady
              ? "adminStatusBadge status-completed"
              : "adminStatusBadge isNeedsReview"
          }
        >
          {readinessLabelNb(readiness.label)}
        </span>
      </section>

      <div className="adminStatsGrid adminImageReviewStats">
        <article className="adminStatCard">
          <span>Hero</span>
          <strong>{readiness.hasApprovedHero ? "Godkjent" : "Mangler"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Front</span>
          <strong>{readiness.hasApprovedFront ? "Godkjent" : "Mangler"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Side</span>
          <strong>{readiness.hasApprovedSide ? "Godkjent" : "Mangler"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Kandidater</span>
          <strong>{readiness.pendingCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Godkjent</span>
          <strong>{readiness.approvedCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Avvist</span>
          <strong>{readiness.rejectedCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Galleri</span>
          <strong>{readiness.galleryCount}</strong>
        </article>
      </div>

      {(message || error) && (
        <div
          className="adminNotice"
          role="status"
          style={error ? { borderColor: "#c2410c", background: "#fff7ed" } : undefined}
        >
          {error || message}
        </div>
      )}

      <AdminAiIllustrationPanel
        carId={car.id}
        brand={car.brand || ""}
        model={car.model || ""}
        variant={car.variant}
        year={car.year}
        heroImageUrl={
          gallery.find((image) => image.is_primary)?.image_url ||
          car.image_url ||
          null
        }
      />

      <section className="adminImageReviewSection" aria-labelledby="candidates-heading">
        <div className="adminProductionSectionHeader">
          <h2 id="candidates-heading">Bildekandidater</h2>
          <p className="adminHint">
            {cards.length} brukbar{cards.length === 1 ? "" : "e"} kandidat
            {cards.length === 1 ? "" : "er"} (mislykkede nedlastinger beholdes i
            historikk). Offisielle kandidater foretrekkes; AI-rader merkes som
            illustrasjoner.
          </p>
        </div>

        {cards.length === 0 ? (
          <p className="adminEmpty">
            {emptyCandidatesMessage ||
              "Ingen research-bildekandidater for denne modellen ennå. Hent via Research, og gjennomgå her — eller opprett en AI-illustrasjonskandidat over når offisielle bilder mangler."}
          </p>
        ) : (
          <ul className="adminImageReviewGrid">
            {cards.map((card) => (
              <CandidateCard
                key={card.id}
                car={car}
                card={card}
                isPending={isPending}
                onAction={run}
                onOpenFullSize={setLightboxUrl}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="adminImageReviewSection" aria-labelledby="gallery-heading">
        <div className="adminProductionSectionHeader">
          <h2 id="gallery-heading">Godkjent galleri (festet)</h2>
          <p className="adminHint">
            Disse radene vises på forsiden, merkesider, modellkort, sammenligning,
            favoritter og modellgalleriet etter publisering. AI-rader skal forbli merket
            som illustrasjoner.
          </p>
        </div>
        {gallery.length === 0 ? (
          <p className="adminEmpty">Ingen festede galleribilder ennå.</p>
        ) : (
          <ul className="adminImageReviewGalleryList">
            {gallery.map((image) => (
              <li key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.alt_text || "Galleribilde"}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <strong>
                    {image.is_primary ? "Hero · " : ""}
                    {CAR_IMAGE_TYPE_LABELS[image.image_type]}
                  </strong>
                  <span>
                    {image.is_primary ? "Primær" : "Galleri"}
                    {image.alt_text?.toLowerCase().includes("ai-generated")
                      ? " · AI-illustrasjon"
                      : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="adminQuickActions">
          <Link href={`/admin/biler/${car.id}/rediger`} className="button secondary">
            Åpne bilderedigering
          </Link>
          <Link href="/admin/images" className="button ghost">
            Alle modeller
          </Link>
        </div>
      </section>

      {lightboxUrl ? (
        <div
          className="adminImageReviewLightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Full size preview"
          onClick={() => setLightboxUrl(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setLightboxUrl(null);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Full size preview"
            referrerPolicy="no-referrer"
            onClick={(event) => event.stopPropagation()}
          />
          <button
            type="button"
            className="button secondary buttonSm"
            onClick={() => setLightboxUrl(null)}
          >
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
