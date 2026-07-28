"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState, useTransition } from "react";
import {
  approveImageCandidateAction,
  rejectImageCandidateAction,
  setHeroImageCandidateAction,
} from "@/app/admin/image-review-actions";
import AdminImageCandidatePreview from "@/components/admin/admin-image-candidate-preview";
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

  const warnings: ImageQualityWarning[] = [...card.warnings];
  if (previewFailed && !warnings.includes("Broken URL")) {
    warnings.push("Broken URL");
  }

  const resolution = liveResolution || card.resolution || "—";
  const openSourceHref = card.sourceUrl || card.originalUrl;

  return (
    <li className="adminImageReviewCard">
      <AdminImageCandidatePreview
        url={card.previewUrl}
        alt={card.altText || `${car.brand} ${car.model} ${card.imageTypeLabel}`}
        isHero={card.isHeroCandidate}
        onOpenFullSize={onOpenFullSize}
        onResolution={setLiveResolution}
        onLoadStateChange={(state) => setPreviewFailed(state === "error")}
      />

      <div className="adminImageReviewCardBody">
        <div className="adminImageReviewCardMeta">
          <span className={statusClass(card.status)}>{card.status}</span>
          <strong>{card.imageTypeLabel}</strong>
        </div>

        <dl className="adminTopicMeta">
          <div>
            <dt>Image type</dt>
            <dd>{card.imageTypeLabel}</dd>
          </div>
          <div>
            <dt>Source</dt>
            <dd>{card.sourceName || "—"}</dd>
          </div>
          <div>
            <dt>Source URL</dt>
            <dd className="adminImageReviewUrl">
              {card.sourceUrl ? (
                <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                  {card.sourceUrl}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt>Resolution</dt>
            <dd>{resolution}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{card.status}</dd>
          </div>
        </dl>

        {warnings.length > 0 ? (
          <ul className="adminImageReviewWarnings">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        ) : null}

        <div className="adminQuickActions adminImageReviewActions">
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={
              isPending ||
              card.status === "Approved" ||
              card.status === "Rejected" ||
              previewFailed ||
              !card.previewUrl ||
              warnings.includes("Download Failed")
            }
            title={
              warnings.includes("Download Failed")
                ? "Download Failed — upload manually in the gallery"
                : previewFailed || !card.previewUrl
                  ? "Local review copy missing — cannot approve OEM hotlink"
                  : undefined
            }
            onClick={() =>
              onAction(() =>
                approveImageCandidateAction({
                  imageId: card.id,
                  attachToGallery: true,
                }),
              )
            }
          >
            Approve
          </button>

          <button
            type="button"
            className="button ghost buttonSm"
            disabled={isPending || card.isInGallery || card.status === "Rejected"}
            onClick={() =>
              onAction(() => rejectImageCandidateAction({ imageId: card.id }))
            }
          >
            Reject
          </button>

          <button
            type="button"
            className="button primary buttonSm"
            disabled={isPending || card.status === "Rejected"}
            onClick={() =>
              onAction(() => setHeroImageCandidateAction({ imageId: card.id }))
            }
          >
            Choose Hero
          </button>

          <button
            type="button"
            className="button ghost buttonSm"
            disabled={!card.previewUrl || previewFailed}
            onClick={() => {
              if (card.previewUrl) onOpenFullSize(card.previewUrl);
            }}
          >
            Preview Full Size
          </button>

          <a
            href={openSourceHref}
            target="_blank"
            rel="noreferrer"
            className="button ghost buttonSm"
          >
            Open Source
          </a>
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
          <h2 id="image-readiness-heading">Publication images</h2>
          <p className="adminHint">
            Every research candidate shows its image URL preview. Image Ready requires approved
            Hero + Front + Side. Approval never publishes the car.
          </p>
        </div>
        <span
          className={
            readiness.imagesReady
              ? "adminStatusBadge status-completed"
              : "adminStatusBadge isNeedsReview"
          }
        >
          {readiness.label}
        </span>
      </section>

      <div className="adminStatsGrid adminImageReviewStats">
        <article className="adminStatCard">
          <span>Hero</span>
          <strong>{readiness.hasApprovedHero ? "Approved" : "Missing"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Front</span>
          <strong>{readiness.hasApprovedFront ? "Approved" : "Missing"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Side</span>
          <strong>{readiness.hasApprovedSide ? "Approved" : "Missing"}</strong>
        </article>
        <article className="adminStatCard">
          <span>Candidates</span>
          <strong>{readiness.pendingCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Approved</span>
          <strong>{readiness.approvedCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Rejected</span>
          <strong>{readiness.rejectedCount}</strong>
        </article>
        <article className="adminStatCard">
          <span>Gallery</span>
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

      <section className="adminImageReviewSection" aria-labelledby="candidates-heading">
        <div className="adminProductionSectionHeader">
          <h2 id="candidates-heading">Image candidates</h2>
          <p className="adminHint">
            {cards.length} usable candidate{cards.length === 1 ? "" : "s"} (failed downloads kept in
            history)
          </p>
        </div>

        {cards.length === 0 ? (
          <p className="adminEmpty">
            {emptyCandidatesMessage ||
              "No research image candidates for this model yet. Collect them via Research, then review here."}
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
          <h2 id="gallery-heading">Approved gallery (attached)</h2>
          <p className="adminHint">
            These rows appear on Homepage, Brand pages, Model cards, Compare, Favorites, and the
            model gallery after the car is published.
          </p>
        </div>
        {gallery.length === 0 ? (
          <p className="adminEmpty">No attached gallery images yet.</p>
        ) : (
          <ul className="adminImageReviewGalleryList">
            {gallery.map((image) => (
              <li key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.image_url}
                  alt={image.alt_text || "Gallery image"}
                  referrerPolicy="no-referrer"
                />
                <div>
                  <strong>
                    {image.is_primary ? "Hero · " : ""}
                    {CAR_IMAGE_TYPE_LABELS[image.image_type]}
                  </strong>
                  <span>{image.is_primary ? "Primary" : "Gallery"}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="adminQuickActions">
          <Link href={`/admin/biler/${car.id}/rediger`} className="button secondary">
            Open car editor gallery
          </Link>
          <Link href="/admin/images" className="button ghost">
            All models
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
