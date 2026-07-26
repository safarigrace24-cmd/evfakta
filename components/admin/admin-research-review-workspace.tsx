"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  applyResearchJobAction,
  bulkSetResearchFieldStatusAction,
  markResearchMissingFieldAction,
  setResearchFieldStatusAction,
  setResearchImageStatusAction,
  updateResearchFieldCandidateAction,
} from "@/app/admin/research-actions";
import type {
  ResearchFieldCandidate,
  ResearchImageCandidate,
  ResearchItem,
  ResearchJob,
} from "@/lib/admin/research/types";
import {
  RESEARCH_REVIEW_CATEGORIES,
  buildFocusQueue,
  buildTopicQueue,
  categoryTone,
  computeResearchReviewSummary,
  countCategory,
  fieldsForScope,
  focusProgress,
  indexAfterDecision,
  isPreviewableImageUrl,
  labelImageCandidate,
  listVariantScopes,
  researchFieldLabel,
  topicStatusIcon,
  type ResearchQueueItem,
  type ResearchReviewCategoryId,
  type ResearchVariantScope,
} from "@/lib/admin/research/review-workspace";

type Detail = {
  item: ResearchItem;
  fields: ResearchFieldCandidate[];
  images: ResearchImageCandidate[];
};

type AdminResearchReviewWorkspaceProps = {
  job: ResearchJob;
  details: Detail[];
  onMessage: (message: string | null) => void;
  onError: (error: string | null) => void;
  onRefresh: () => void;
};

function formatValue(value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Ja" : "Nei";
  return String(value);
}

function formatConfidence(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatChecked(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("nb-NO");
}

function scopeKey(scope: ResearchVariantScope): string {
  return scope.kind === "base" ? "base" : `variant:${scope.slug}`;
}

function scopeLabel(scope: ResearchVariantScope): string {
  return scope.kind === "base" ? "Grunnmodell" : scope.name;
}

function parseEditedValue(raw: string, current: unknown): unknown {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  if (typeof current === "boolean") {
    if (trimmed.toLowerCase() === "true" || trimmed === "1" || trimmed.toLowerCase() === "ja") {
      return true;
    }
    if (trimmed.toLowerCase() === "false" || trimmed === "0" || trimmed.toLowerCase() === "nei") {
      return false;
    }
  }
  if (typeof current === "number" || /^-?\d+(\.\d+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* keep string */
    }
  }
  return trimmed;
}

function queueItemLabel(item: ResearchQueueItem): string {
  if (item.kind === "field") return researchFieldLabel(item.field.field_key);
  if (item.kind === "conflict") return researchFieldLabel(item.fieldKey);
  if (item.kind === "missing") return researchFieldLabel(item.fieldKey);
  return item.image.image_type || "Bilde";
}

export default function AdminResearchReviewWorkspace({
  job,
  details: initialDetails,
  onMessage,
  onError,
  onRefresh,
}: AdminResearchReviewWorkspaceProps) {
  const [details, setDetails] = useState(initialDetails);
  const [activeItemId, setActiveItemId] = useState(initialDetails[0]?.item.id ?? "");
  const [scope, setScope] = useState<ResearchVariantScope>({ kind: "base" });
  const [openTopic, setOpenTopic] = useState<ResearchReviewCategoryId | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [focusMode, setFocusMode] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [editing, setEditing] = useState(false);
  const [customConflictValue, setCustomConflictValue] = useState("");
  const [showRawKey, setShowRawKey] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDetails(initialDetails);
    if (
      activeItemId &&
      !initialDetails.some((entry) => entry.item.id === activeItemId)
    ) {
      setActiveItemId(initialDetails[0]?.item.id ?? "");
    }
  }, [initialDetails, activeItemId]);

  const active = details.find((entry) => entry.item.id === activeItemId) ?? details[0];
  const fields = active?.fields ?? [];
  const images = active?.images ?? [];
  const item = active?.item;

  const scopes = useMemo(
    () => (item ? listVariantScopes(item, fields) : [{ kind: "base" as const }]),
    [item, fields],
  );

  const scopedFields = useMemo(
    () => fieldsForScope(fields, scope),
    [fields, scope],
  );

  const summary = useMemo(
    () =>
      item
        ? computeResearchReviewSummary({ item, fields, images })
        : null,
    [item, fields, images],
  );

  const topicRows = useMemo(() => {
    return RESEARCH_REVIEW_CATEGORIES.map((category) => {
      const counts = countCategory(
        category,
        category.id === "variants" ? fields : scopedFields,
        item?.missing_fields ?? [],
        images,
      );
      const tone = categoryTone(counts);
      return { category, counts, tone, icon: topicStatusIcon(tone) };
    });
  }, [fields, scopedFields, item?.missing_fields, images]);

  const topicQueue = useMemo(() => {
    if (!openTopic || !item) return [];
    return buildTopicQueue({
      categoryId: openTopic,
      fields: openTopic === "variants" ? fields : scopedFields,
      missingFields: item.missing_fields ?? [],
      images,
      includeResolved: true,
    });
  }, [openTopic, scopedFields, fields, item, images]);

  const focusQueue = useMemo(() => {
    if (!item) return [];
    return buildFocusQueue({
      fields: scopedFields,
      missingFields: item.missing_fields ?? [],
      images,
    });
  }, [scopedFields, item, images]);

  const activeQueue = focusMode ? focusQueue : topicQueue;
  const currentItem =
    queueIndex >= 0 && queueIndex < activeQueue.length
      ? activeQueue[queueIndex]
      : null;
  const progress = focusProgress(activeQueue, queueIndex);

  useEffect(() => {
    if (!activeQueue.length) {
      setQueueIndex(0);
      return;
    }
    if (queueIndex >= activeQueue.length) {
      setQueueIndex(activeQueue.length - 1);
    }
  }, [activeQueue, queueIndex]);

  function patchFieldLocal(
    itemId: string,
    fieldId: string,
    patch: Partial<ResearchFieldCandidate>,
  ) {
    setDetails((current) =>
      current.map((entry) =>
        entry.item.id !== itemId
          ? entry
          : {
              ...entry,
              fields: entry.fields.map((field) =>
                field.id === fieldId ? { ...field, ...patch } : field,
              ),
            },
      ),
    );
  }

  function patchFieldsLocal(
    itemId: string,
    updates: Array<{ fieldId: string; patch: Partial<ResearchFieldCandidate> }>,
  ) {
    const map = new Map(updates.map((row) => [row.fieldId, row.patch]));
    setDetails((current) =>
      current.map((entry) =>
        entry.item.id !== itemId
          ? entry
          : {
              ...entry,
              fields: entry.fields.map((field) =>
                map.has(field.id) ? { ...field, ...map.get(field.id) } : field,
              ),
            },
      ),
    );
  }

  function advanceAfterDecision(nextFields?: ResearchFieldCandidate[]) {
    const nextQueue = focusMode
      ? buildFocusQueue({
          fields: fieldsForScope(nextFields ?? fields, scope),
          missingFields: item?.missing_fields ?? [],
          images,
        })
      : openTopic
        ? buildTopicQueue({
            categoryId: openTopic,
            fields:
              openTopic === "variants"
                ? nextFields ?? fields
                : fieldsForScope(nextFields ?? fields, scope),
            missingFields: item?.missing_fields ?? [],
            images,
            includeResolved: true,
          })
        : [];
    const nextIndex = indexAfterDecision(nextQueue, queueIndex);
    setQueueIndex(nextIndex >= 0 ? nextIndex : 0);
    setEditing(false);
    setCustomConflictValue("");
  }

  function setFieldStatus(
    fieldId: string,
    status: "approved" | "rejected" | "pending",
  ) {
    if (!item) return;
    startTransition(async () => {
      const result = await setResearchFieldStatusAction({ fieldId, status });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      const nextFields = fields.map((field) =>
        field.id === fieldId ? { ...field, status } : field,
      );
      patchFieldLocal(item.id, fieldId, { status });
      onMessage(result.message);
      if (status === "approved" || status === "rejected") {
        advanceAfterDecision(nextFields);
      }
    });
  }

  function resolveConflictChoose(chosen: ResearchFieldCandidate) {
    if (!item) return;
    const groupKey =
      chosen.conflict_group ||
      `${chosen.entity_type}:${chosen.variant_slug ?? "car"}:${chosen.field_key}`;
    const siblings = fields.filter(
      (field) =>
        (field.conflict_group ||
          `${field.entity_type}:${field.variant_slug ?? "car"}:${field.field_key}`) ===
          groupKey && field.id !== chosen.id,
    );

    startTransition(async () => {
      const approve = await setResearchFieldStatusAction({
        fieldId: chosen.id,
        status: "approved",
      });
      if (!approve.ok) {
        onError(approve.error);
        return;
      }
      if (siblings.length) {
        await bulkSetResearchFieldStatusAction({
          updates: siblings.map((field) => ({
            fieldId: field.id,
            status: "rejected",
          })),
        });
      }
      const nextFields = fields.map((field) => {
        if (field.id === chosen.id) return { ...field, status: "approved" as const };
        if (siblings.some((sibling) => sibling.id === field.id)) {
          return { ...field, status: "rejected" as const };
        }
        return field;
      });
      patchFieldsLocal(item.id, [
        { fieldId: chosen.id, patch: { status: "approved" } },
        ...siblings.map((field) => ({
          fieldId: field.id,
          patch: { status: "rejected" as const },
        })),
      ]);
      onMessage("Konflikt løst — valgt kandidat godkjent.");
      advanceAfterDecision(nextFields);
    });
  }

  function resolveConflictCustom(
    groupOptions: ResearchFieldCandidate[],
    value: string,
  ) {
    if (!item || !groupOptions[0]) return;
    const primary = groupOptions[0];
    const parsed = parseEditedValue(value, primary.proposed_value);
    startTransition(async () => {
      const updated = await updateResearchFieldCandidateAction({
        fieldId: primary.id,
        proposedValue: parsed,
        status: "approved",
        notes: "Custom value entered during conflict resolution.",
      });
      if (!updated.ok) {
        onError(updated.error);
        return;
      }
      const others = groupOptions.slice(1);
      if (others.length) {
        await bulkSetResearchFieldStatusAction({
          updates: others.map((field) => ({
            fieldId: field.id,
            status: "rejected",
          })),
        });
      }
      const nextFields = fields.map((field) => {
        if (field.id === primary.id) {
          return {
            ...field,
            proposed_value: parsed,
            status: "approved" as const,
            notes: "Custom value entered during conflict resolution.",
          };
        }
        if (others.some((other) => other.id === field.id)) {
          return { ...field, status: "rejected" as const };
        }
        return field;
      });
      patchFieldsLocal(item.id, [
        {
          fieldId: primary.id,
          patch: {
            proposed_value: parsed,
            status: "approved",
            notes: "Custom value entered during conflict resolution.",
          },
        },
        ...others.map((field) => ({
          fieldId: field.id,
          patch: { status: "rejected" as const },
        })),
      ]);
      onMessage("Konflikt løst med egendefinert verdi.");
      advanceAfterDecision(nextFields);
    });
  }

  function saveEdit(field: ResearchFieldCandidate) {
    if (!item) return;
    const parsed = parseEditedValue(editValue, field.proposed_value);
    const nextStatus =
      field.status === "conflict" || field.status === "applied"
        ? ("pending" as const)
        : field.status;
    startTransition(async () => {
      const result = await updateResearchFieldCandidateAction({
        fieldId: field.id,
        proposedValue: parsed,
        status: nextStatus,
      });
      if (!result.ok) {
        onError(result.error);
        return;
      }
      patchFieldLocal(item.id, field.id, {
        proposed_value: parsed,
        status: nextStatus,
      });
      setEditing(false);
      onMessage(result.message);
    });
  }

  function openTopicReview(categoryId: ResearchReviewCategoryId) {
    setFocusMode(false);
    setOpenTopic(categoryId);
    setQueueIndex(0);
    setEditing(false);
  }

  function continueReview() {
    if (!item) return;
    const focus = buildFocusQueue({
      fields: scopedFields,
      missingFields: item.missing_fields ?? [],
      images,
    });
    if (focus.length) {
      setFocusMode(true);
      setOpenTopic(null);
      setQueueIndex(0);
      return;
    }
    const first = topicRows.find(
      (row) => row.tone !== "green" || row.counts.totalCandidates > 0,
    );
    if (first) openTopicReview(first.category.id);
  }

  function enterFocusMode() {
    setFocusMode(true);
    setOpenTopic(null);
    setQueueIndex(0);
    setEditing(false);
  }

  if (!item || !summary) {
    return <p className="adminEmpty">Ingen modeller funnet i denne jobben.</p>;
  }

  const carEditorHref = item.existing_car_id
    ? `/admin/biler/${item.existing_car_id}/rediger`
    : "/admin/biler?status=needs_review";

  const toneClass = (tone: ReturnType<typeof categoryTone>) =>
    tone === "green"
      ? "is-complete"
      : tone === "red"
        ? "is-blocked"
        : "is-needsReview";

  const statusGlyph = (icon: "complete" | "pending" | "blocked") =>
    icon === "complete" ? "✓" : icon === "blocked" ? "!" : "•";

  return (
    <div className={`adminTopicReview ${focusMode ? "is-focusMode" : ""}`}>
      {!focusMode && (
        <header className="adminTopicSummary">
          <div>
            <h2>{summary.title}</h2>
            <p className="adminHint">
              {scopeLabel(scope)}
              {details.length > 1 ? ` · ${details.length} modeller i jobb` : ""}
            </p>
          </div>
          <div className="adminTopicSummaryStats">
            <div>
              <span>Fullført</span>
              <strong>{summary.completionPercent}%</strong>
            </div>
            <div>
              <span>Godkjent</span>
              <strong>{summary.approved}</strong>
            </div>
            <div>
              <span>Pending</span>
              <strong>{summary.pending}</strong>
            </div>
            <div>
              <span>Konflikter</span>
              <strong>{summary.conflicts}</strong>
            </div>
            <div>
              <span>Mangler</span>
              <strong>{summary.missing}</strong>
            </div>
            <div>
              <span>Bilder pending</span>
              <strong>{summary.imagesPending}</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className={summary.ready ? "is-ready" : "is-blocked"}>
                {summary.ready ? "Klar" : "Ikke klar"}
              </strong>
            </div>
          </div>
          <div className="adminQuickActions">
            <button
              type="button"
              className="button primary"
              disabled={isPending}
              onClick={continueReview}
            >
              Continue review
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await applyResearchJobAction({ jobId: job.id });
                  if (!result.ok) {
                    onError(result.error);
                    return;
                  }
                  onMessage(result.message);
                  onRefresh();
                })
              }
            >
              Import approved as needs_review
            </button>
            <Link href={carEditorHref} className="button secondary">
              Open car editor
            </Link>
            <button
              type="button"
              className="button ghost"
              disabled={isPending || focusQueue.length === 0}
              onClick={enterFocusMode}
            >
              Focus mode
            </button>
          </div>
        </header>
      )}

      {focusMode && (
        <header className="adminTopicFocusBar">
          <strong>
            Focus mode · {progress.remaining} of {progress.total} remaining
          </strong>
          <div className="adminQuickActions">
            <button
              type="button"
              className="button secondary buttonSm"
              onClick={() => {
                setFocusMode(false);
                setOpenTopic(null);
              }}
            >
              Exit focus
            </button>
          </div>
        </header>
      )}

      {!focusMode && details.length > 1 && (
        <div className="adminResearchScopeTabs" role="tablist" aria-label="Modeller">
          {details.map((entry) => (
            <button
              key={entry.item.id}
              type="button"
              className={
                entry.item.id === item.id
                  ? "adminEditorTab is-active"
                  : "adminEditorTab"
              }
              onClick={() => {
                setActiveItemId(entry.item.id);
                setScope({ kind: "base" });
                setOpenTopic(null);
              }}
            >
              {entry.item.brand} {entry.item.model}
            </button>
          ))}
        </div>
      )}

      {!focusMode && (
        <div className="adminResearchScopeTabs" role="tablist" aria-label="Grunnmodell og varianter">
          {scopes.map((entry) => (
            <button
              key={scopeKey(entry)}
              type="button"
              className={
                scopeKey(entry) === scopeKey(scope)
                  ? "adminEditorTab is-active"
                  : "adminEditorTab"
              }
              onClick={() => {
                setScope(entry);
                setOpenTopic(null);
              }}
            >
              {scopeLabel(entry)}
            </button>
          ))}
        </div>
      )}

      {!focusMode && !openTopic && (
        <div className="adminTopicRows" role="list">
          {topicRows.map(({ category, counts, tone, icon }) => (
            <div
              key={category.id}
              className={`adminTopicRow ${toneClass(tone)}`}
              role="listitem"
            >
              <div className="adminTopicRowMain">
                <span className="adminTopicStatusIcon" aria-hidden>
                  {statusGlyph(icon)}
                </span>
                <div>
                  <strong>{category.label}</strong>
                  <span>
                    {counts.approved} ok · {counts.pending} pending ·{" "}
                    {counts.conflict} konflikt · {counts.missing} mangler
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="button secondary buttonSm"
                onClick={() => openTopicReview(category.id)}
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

      {(focusMode || openTopic) && (
        <div className="adminTopicPanel">
          {!focusMode && openTopic && (
            <div className="adminTopicPanelHeader">
              <div>
                <button
                  type="button"
                  className="button ghost buttonSm"
                  onClick={() => setOpenTopic(null)}
                >
                  ← Topics
                </button>
                <h3>
                  {RESEARCH_REVIEW_CATEGORIES.find((row) => row.id === openTopic)
                    ?.label ?? "Topic"}{" "}
                  · {scopeLabel(scope)}
                </h3>
              </div>
              <p className="adminHint">
                {progress.position} / {progress.total}
                {progress.remaining
                  ? ` · ${progress.remaining} uløst`
                  : " · ferdig"}
              </p>
            </div>
          )}

          {openTopic === "variants" && !focusMode ? (
            <div className="adminResearchVariantsOverview">
              {scopes
                .filter(
                  (entry): entry is Extract<ResearchVariantScope, { kind: "variant" }> =>
                    entry.kind === "variant",
                )
                .map((variant) => {
                  const variantFields = fieldsForScope(fields, variant);
                  return (
                    <button
                      key={variant.slug}
                      type="button"
                      className="adminTopicRow is-needsReview"
                      onClick={() => {
                        setScope(variant);
                        setOpenTopic("identity");
                        setQueueIndex(0);
                      }}
                    >
                      <div className="adminTopicRowMain">
                        <strong>{variant.name}</strong>
                        <span>
                          {variantFields.length} felter ·{" "}
                          {
                            variantFields.filter(
                              (field) => field.status === "conflict",
                            ).length
                          }{" "}
                          konflikter
                        </span>
                      </div>
                      <span className="button secondary buttonSm">Review</span>
                    </button>
                  );
                })}
              {scopes.length <= 1 && (
                <p className="adminEmpty">Ingen varianter foreslått.</p>
              )}
            </div>
          ) : (
            <div className="adminTopicStage">
              {!focusMode && (
                <aside className="adminTopicSideList" aria-label="Feltliste">
                  <ul>
                    {activeQueue.map((entry, index) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className={
                            index === queueIndex
                              ? "adminTopicSideItem is-active"
                              : "adminTopicSideItem"
                          }
                          onClick={() => {
                            setQueueIndex(index);
                            setEditing(false);
                          }}
                        >
                          <span>{queueItemLabel(entry)}</span>
                          <small>
                            {entry.kind === "conflict"
                              ? "konflikt"
                              : entry.kind === "missing"
                                ? "mangler"
                                : entry.kind === "image"
                                  ? entry.image.status
                                  : entry.field.status}
                          </small>
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>
              )}

              <div className="adminTopicCard">
                {!currentItem ? (
                  <p className="adminSuccess">Ingen flere uløste elementer her.</p>
                ) : currentItem.kind === "conflict" ? (
                  <section className="adminTopicConflict">
                    <h4>{researchFieldLabel(currentItem.fieldKey)}</h4>
                    {showRawKey && (
                      <p className="adminHint">
                        <code>{currentItem.fieldKey}</code>
                      </p>
                    )}
                    <div className="adminResearchConflictOptions">
                      {currentItem.options.map((option, index) => (
                        <article
                          key={option.id}
                          className="adminResearchConflictOption"
                        >
                          <strong>
                            {String.fromCharCode(65 + index)}:{" "}
                            {formatValue(option.proposed_value)}
                          </strong>
                          <p className="adminHint">
                            {option.source_name || "—"} ·{" "}
                            {formatConfidence(option.confidence)}
                          </p>
                          <button
                            type="button"
                            className="button secondary buttonSm"
                            disabled={isPending}
                            onClick={() => resolveConflictChoose(option)}
                          >
                            Choose {String.fromCharCode(65 + index)}
                          </button>
                        </article>
                      ))}
                    </div>
                    <div className="adminResearchConflictCustom">
                      <label>
                        Enter custom value
                        <input
                          value={customConflictValue}
                          onChange={(event) =>
                            setCustomConflictValue(event.target.value)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="button secondary buttonSm"
                        disabled={isPending || !customConflictValue.trim()}
                        onClick={() =>
                          resolveConflictCustom(
                            currentItem.options,
                            customConflictValue,
                          )
                        }
                      >
                        Save custom
                      </button>
                      <button
                        type="button"
                        className="button ghost buttonSm"
                        disabled={isPending}
                        onClick={() => {
                          onMessage("Konflikt uløst — gå videre manuelt.");
                          setQueueIndex((index) =>
                            Math.min(index + 1, Math.max(activeQueue.length - 1, 0)),
                          );
                        }}
                      >
                        Leave unresolved
                      </button>
                    </div>
                  </section>
                ) : currentItem.kind === "missing" ? (
                  <section className="adminTopicMissing">
                    <h4>{researchFieldLabel(currentItem.fieldKey)}</h4>
                    <p className="adminHint">
                      Mangler data — ikke en kandidatverdi.
                    </p>
                    <div className="adminQuickActions">
                      <Link
                        href="/admin/import/research"
                        className="button secondary buttonSm"
                      >
                        Start additional research
                      </Link>
                      <button
                        type="button"
                        className="button secondary buttonSm"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await markResearchMissingFieldAction({
                              itemId: item.id,
                              fieldKey: currentItem.fieldKey,
                              action: "not_available",
                            });
                            if (!result.ok) {
                              onError(result.error);
                              return;
                            }
                            setDetails((current) =>
                              current.map((entry) =>
                                entry.item.id !== item.id
                                  ? entry
                                  : {
                                      ...entry,
                                      item: {
                                        ...entry.item,
                                        missing_fields: (
                                          entry.item.missing_fields ?? []
                                        ).filter(
                                          (key) => key !== currentItem.fieldKey,
                                        ),
                                      },
                                    },
                              ),
                            );
                            onMessage(result.message);
                            setQueueIndex((index) =>
                              Math.min(
                                index + 1,
                                Math.max(activeQueue.length - 2, 0),
                              ),
                            );
                          })
                        }
                      >
                        Mark as not available
                      </button>
                      <button
                        type="button"
                        className="button ghost buttonSm"
                        onClick={() =>
                          setQueueIndex((index) =>
                            Math.min(index + 1, Math.max(activeQueue.length - 1, 0)),
                          )
                        }
                      >
                        Leave for later
                      </button>
                    </div>
                  </section>
                ) : currentItem.kind === "image" ? (
                  <section className="adminTopicImage">
                    {labelImageCandidate(currentItem.image).kind === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentItem.image.original_url}
                        alt={currentItem.image.alt_text || "Bildkandidat"}
                        className="adminResearchImagePreview"
                      />
                    ) : (
                      <div className="adminResearchImagePlaceholder">
                        <strong>
                          {labelImageCandidate(currentItem.image).label}
                        </strong>
                      </div>
                    )}
                    <dl className="adminTopicMeta">
                      <div>
                        <dt>Kilde</dt>
                        <dd>{currentItem.image.source_name || "—"}</dd>
                      </div>
                      <div>
                        <dt>Rettigheter</dt>
                        <dd>
                          {currentItem.image.license_note ||
                            currentItem.image.usage_terms ||
                            "Ukjent"}
                        </dd>
                      </div>
                      <div>
                        <dt>Foreslått type</dt>
                        <dd>{currentItem.image.image_type || "other"}</dd>
                      </div>
                    </dl>
                    <div className="adminQuickActions">
                      <button
                        type="button"
                        className="button secondary buttonSm"
                        disabled={
                          isPending ||
                          !isPreviewableImageUrl(currentItem.image.original_url)
                        }
                        title={
                          isPreviewableImageUrl(currentItem.image.original_url)
                            ? undefined
                            : "Kan ikke godkjenne side-URL som bilde"
                        }
                        onClick={() =>
                          startTransition(async () => {
                            if (
                              !isPreviewableImageUrl(
                                currentItem.image.original_url,
                              )
                            ) {
                              onError(
                                "Kan ikke godkjenne kilde-side som bilde. Last opp manuelt.",
                              );
                              return;
                            }
                            const result = await setResearchImageStatusAction({
                              imageId: currentItem.image.id,
                              status: "approved",
                            });
                            if (!result.ok) {
                              onError(result.error);
                              return;
                            }
                            const nextImages = images.map((image) =>
                              image.id === currentItem.image.id
                                ? { ...image, status: "approved" as const }
                                : image,
                            );
                            setDetails((current) =>
                              current.map((entry) =>
                                entry.item.id !== item.id
                                  ? entry
                                  : { ...entry, images: nextImages },
                              ),
                            );
                            onMessage(result.message);
                            setQueueIndex((index) =>
                              Math.min(
                                index + 1,
                                Math.max(activeQueue.length - 1, 0),
                              ),
                            );
                          })
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button ghost buttonSm"
                        disabled={isPending}
                        onClick={() =>
                          startTransition(async () => {
                            const result = await setResearchImageStatusAction({
                              imageId: currentItem.image.id,
                              status: "rejected",
                            });
                            if (!result.ok) {
                              onError(result.error);
                              return;
                            }
                            setDetails((current) =>
                              current.map((entry) =>
                                entry.item.id !== item.id
                                  ? entry
                                  : {
                                      ...entry,
                                      images: entry.images.map((image) =>
                                        image.id === currentItem.image.id
                                          ? { ...image, status: "rejected" }
                                          : image,
                                      ),
                                    },
                              ),
                            );
                            onMessage(result.message);
                            setQueueIndex((index) =>
                              Math.min(
                                index + 1,
                                Math.max(activeQueue.length - 1, 0),
                              ),
                            );
                          })
                        }
                      >
                        Reject
                      </button>
                      <a
                        href={currentItem.image.original_url}
                        target="_blank"
                        rel="noreferrer"
                        className="button ghost buttonSm"
                      >
                        Open source
                      </a>
                      <Link href={carEditorHref} className="button ghost buttonSm">
                        Upload manually
                      </Link>
                    </div>
                  </section>
                ) : (
                  <section className="adminTopicField">
                    <h4>{researchFieldLabel(currentItem.field.field_key)}</h4>
                    {showRawKey && (
                      <p className="adminHint">
                        <code>{currentItem.field.field_key}</code>
                      </p>
                    )}
                    {editing ? (
                      <div className="adminResearchInlineEdit">
                        <input
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                        />
                        <button
                          type="button"
                          className="button secondary buttonSm"
                          onClick={() => saveEdit(currentItem.field)}
                        >
                          Lagre
                        </button>
                      </div>
                    ) : (
                      <p className="adminTopicValue">
                        {formatValue(currentItem.field.proposed_value)}
                      </p>
                    )}
                    <dl className="adminTopicMeta">
                      <div>
                        <dt>Kilde</dt>
                        <dd>
                          {currentItem.field.source_url ? (
                            <a
                              href={currentItem.field.source_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {currentItem.field.source_name ||
                                currentItem.field.source_url}
                            </a>
                          ) : (
                            currentItem.field.source_name || "—"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt>Confidence</dt>
                        <dd>{formatConfidence(currentItem.field.confidence)}</dd>
                      </div>
                      <div>
                        <dt>Sist sjekket</dt>
                        <dd>{formatChecked(currentItem.field.retrieved_at)}</dd>
                      </div>
                    </dl>
                    <div className="adminQuickActions">
                      <button
                        type="button"
                        className="button primary buttonSm"
                        disabled={
                          isPending || currentItem.field.status === "conflict"
                        }
                        onClick={() =>
                          setFieldStatus(currentItem.field.id, "approved")
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="button secondary buttonSm"
                        disabled={isPending}
                        onClick={() =>
                          setFieldStatus(currentItem.field.id, "rejected")
                        }
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        className="button ghost buttonSm"
                        disabled={isPending}
                        onClick={() => {
                          setEditing(true);
                          setEditValue(
                            formatValue(currentItem.field.proposed_value),
                          );
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button ghost buttonSm"
                        onClick={() =>
                          setQueueIndex((index) =>
                            Math.min(index + 1, Math.max(activeQueue.length - 1, 0)),
                          )
                        }
                      >
                        Skip for now
                      </button>
                    </div>
                  </section>
                )}

                <div className="adminTopicNav">
                  <button
                    type="button"
                    className="button ghost buttonSm"
                    disabled={queueIndex <= 0}
                    onClick={() => {
                      setQueueIndex((index) => Math.max(index - 1, 0));
                      setEditing(false);
                    }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="button ghost buttonSm"
                    disabled={queueIndex >= activeQueue.length - 1}
                    onClick={() => {
                      setQueueIndex((index) =>
                        Math.min(index + 1, activeQueue.length - 1),
                      );
                      setEditing(false);
                    }}
                  >
                    Next
                  </button>
                  <button
                    type="button"
                    className="button ghost buttonSm"
                    onClick={() => setShowRawKey((value) => !value)}
                  >
                    {showRawKey ? "Hide field key" : "Show field key"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
