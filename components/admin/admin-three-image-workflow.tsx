"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  generateThreeAiImagesAction,
  regenerateThreeImageRoleAction,
  rejectThreeImageAlternativeAction,
  selectThreeImageAlternativeAction,
  type CarImageWorkflowSummary,
} from "@/app/admin/ai-image-actions";

type AdminThreeImageWorkflowProps = {
  carId: string;
  threeImage: CarImageWorkflowSummary["threeImage"];
  reviewPath: string;
  onMessage: (message: string | null) => void;
  onError: (error: string | null) => void;
  onRefresh: () => void;
};

export default function AdminThreeImageWorkflow({
  carId,
  threeImage,
  reviewPath,
  onMessage,
  onError,
  onRefresh,
}: AdminThreeImageWorkflowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(
    action: () => Promise<
      | { ok: true; message: string }
      | { ok: false; error: string }
    >,
  ) {
    onError(null);
    onMessage(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        onError(result.error);
        return;
      }
      onMessage(result.message);
      onRefresh();
      router.refresh();
    });
  }

  const roles = ["Front", "Interior", "Rear"] as const;

  return (
    <div className="adminThreeImageWorkflow" aria-label="Three-image AI workflow">
      <div className="adminThreeImageHeader">
        <div>
          <h3>AI-galleri (3 bilder)</h3>
          <p className="adminHint">
            Genererer kun Front, Interior og Rear — tre alternativer per rolle.
            Valgte bilder forblir Pending til manuell godkjenning. Hero krever
            egen bekreftelse.
          </p>
        </div>
        <button
          type="button"
          className="button primary buttonSm"
          disabled={isPending}
          onClick={() => run(() => generateThreeAiImagesAction({ carId }))}
        >
          {isPending ? "Genererer…" : "Generer 3 AI-bilder"}
        </button>
      </div>

      <div className="adminThreeImageStatusGrid">
        {threeImage.roles.map((role) => (
          <div key={role.usageType}>
            <span>{role.label}</span>
            <strong data-status={role.status}>{role.status}</strong>
          </div>
        ))}
        <div>
          <span>Gallery Complete</span>
          <strong data-status={threeImage.galleryComplete ? "Approved" : "Missing"}>
            {threeImage.galleryComplete ? "YES" : "NO"}
          </strong>
        </div>
      </div>

      <div className="adminThreeImageGroups">
        {roles.map((label) => {
          const role = threeImage.roles.find((item) => item.label === label);
          const alts = threeImage.alternatives.filter((item) => item.label === label);
          if (!role) return null;
          return (
            <section key={label} className="adminThreeImageGroup">
              <div className="adminThreeImageGroupHeader">
                <h4>
                  {label}{" "}
                  <em>
                    ({role.status}
                    {role.alternativeCount ? ` · ${role.alternativeCount} alt.` : ""})
                  </em>
                </h4>
                <button
                  type="button"
                  className="button ghost buttonSm"
                  disabled={isPending || role.status === "Approved"}
                  onClick={() =>
                    run(() =>
                      regenerateThreeImageRoleAction({
                        carId,
                        usageType: role.usageType,
                      }),
                    )
                  }
                >
                  Generate again
                </button>
              </div>
              {alts.length === 0 ? (
                <p className="adminHint">
                  {role.status === "Approved"
                    ? "Approved gallery image exists for this role."
                    : "No pending alternatives yet."}
                </p>
              ) : (
                <ul className="adminThreeImageAltList">
                  {alts.map((alt) => (
                    <li
                      key={alt.id}
                      className={
                        alt.preferred
                          ? "adminThreeImageAlt adminThreeImageAltPreferred"
                          : "adminThreeImageAlt"
                      }
                    >
                      <div className="adminThreeImageAltPreview">
                        {alt.previewUrl ? (
                          <Image
                            src={alt.previewUrl}
                            alt={`${label} option ${alt.optionIndex}`}
                            fill
                            sizes="160px"
                            unoptimized
                          />
                        ) : (
                          <span>No preview</span>
                        )}
                        <span className="adminThreeImageAltBadge">
                          Option {alt.optionIndex}
                          {alt.preferred ? " · Selected" : ""}
                        </span>
                      </div>
                      <div className="adminThreeImageAltActions">
                        <button
                          type="button"
                          className="button secondary buttonSm"
                          disabled={isPending || alt.preferred}
                          onClick={() =>
                            run(() =>
                              selectThreeImageAlternativeAction({
                                candidateId: alt.id,
                              }),
                            )
                          }
                        >
                          Select
                        </button>
                        <button
                          type="button"
                          className="button ghost buttonSm"
                          disabled={isPending}
                          onClick={() =>
                            run(() =>
                              rejectThreeImageAlternativeAction({
                                candidateId: alt.id,
                              }),
                            )
                          }
                        >
                          Reject
                        </button>
                        {alt.previewUrl ? (
                          <a
                            className="button ghost buttonSm"
                            href={alt.previewUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open full size
                          </a>
                        ) : null}
                      </div>
                      <p className="adminHint">
                        Pending · AI-generert illustrasjon – ikke offisielt
                        produsentbilde
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <p className="adminHint">
        Godkjenn valgte kandidater i{" "}
        <Link href={reviewPath}>Image Review</Link>. Front kan deretter settes
        som Hero med egen bekreftelse.
      </p>
    </div>
  );
}
