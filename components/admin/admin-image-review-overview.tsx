"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ImageReviewModelSummary } from "@/lib/admin/image-review-data";

type Props = {
  models: ImageReviewModelSummary[];
};

export default function AdminImageReviewOverview({ models }: Props) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<
    "" | "ready" | "pending" | "missing_hero" | "missing_gallery"
  >("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return models.filter((row) => {
      if (query) {
        const hay = `${row.car.brand} ${row.car.model} ${row.car.slug}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      switch (filter) {
        case "ready":
          return row.readiness.imagesReady;
        case "pending":
          return !row.readiness.imagesReady;
        case "missing_hero":
          return row.readiness.missingHero;
        case "missing_gallery":
          return row.readiness.missingGallery;
        default:
          return true;
      }
    });
  }, [filter, models, q]);

  const stats = useMemo(
    () => ({
      ready: models.filter((m) => m.readiness.imagesReady).length,
      pending: models.filter((m) => !m.readiness.imagesReady).length,
      missingHero: models.filter((m) => m.readiness.missingHero).length,
      missingGallery: models.filter((m) => m.readiness.missingGallery).length,
    }),
    [models],
  );

  return (
    <div className="adminImageReviewOverview">
      <div className="adminStatsGrid adminStatsGridWide">
        <article className="adminStatCard">
          <span>Images Ready</span>
          <strong>{stats.ready}</strong>
        </article>
        <article className="adminStatCard">
          <span>Images Pending</span>
          <strong>{stats.pending}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Hero</span>
          <strong>{stats.missingHero}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Gallery</span>
          <strong>{stats.missingGallery}</strong>
        </article>
      </div>

      <form
        className="catalogFilters adminProductionFilters"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="catalogFilterField catalogFilterGrow">
          Search
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Brand, model, slug"
          />
        </label>
        <label className="catalogFilterField">
          Filter
          <select
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as typeof filter)
            }
          >
            <option value="">All models</option>
            <option value="ready">Images Ready</option>
            <option value="pending">Images Pending</option>
            <option value="missing_hero">Missing Hero</option>
            <option value="missing_gallery">Missing Gallery</option>
          </select>
        </label>
      </form>

      <div className="adminTableWrap">
        <table className="adminTable">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Model</th>
              <th>Status</th>
              <th>Hero</th>
              <th>Front</th>
              <th>Side</th>
              <th>Candidates</th>
              <th>Gallery</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>No models match.</td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.car.id}>
                  <td>{row.car.brand}</td>
                  <td>
                    <strong>{row.car.model}</strong>
                    <div className="adminProductionMeta">{row.car.slug}</div>
                  </td>
                  <td>
                    <span
                      className={
                        row.readiness.imagesReady
                          ? "adminStatusBadge status-completed"
                          : "adminStatusBadge isNeedsReview"
                      }
                    >
                      {row.readiness.label}
                    </span>
                  </td>
                  <td>{row.readiness.hasApprovedHero ? "Yes" : "No"}</td>
                  <td>{row.readiness.hasApprovedFront ? "Yes" : "No"}</td>
                  <td>{row.readiness.hasApprovedSide ? "Yes" : "No"}</td>
                  <td>
                    {row.readiness.pendingCount} pending · {row.readiness.approvedCount}{" "}
                    approved
                  </td>
                  <td>{row.readiness.galleryCount}</td>
                  <td>
                    <Link
                      href={`/admin/images/${row.car.id}`}
                      className="button secondary buttonSm"
                    >
                      Review images
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
