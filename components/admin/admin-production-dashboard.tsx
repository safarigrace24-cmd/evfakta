"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EMPTY_PRODUCTION_FILTERS,
  filterProductionModels,
  PRODUCTION_STATUS_LABELS,
  type ProductionBrandRow,
  type ProductionDashboardFilters,
  type ProductionDashboardStats,
  type ProductionModelRow,
  type ProductionStatus,
} from "@/lib/admin/production-dashboard";

type Props = {
  stats: ProductionDashboardStats;
  brands: ProductionBrandRow[];
  models: ProductionModelRow[];
  brandNames: string[];
  initialFilters?: ProductionDashboardFilters;
};

function statusClass(status: ProductionStatus): string {
  switch (status) {
    case "PUBLISHED":
      return "adminStatusBadge isPublished";
    case "APPROVED":
      return "adminStatusBadge isApproved";
    case "READY_FOR_HUMAN_APPROVAL":
      return "adminStatusBadge status-completed";
    case "NEEDS_REVIEW":
      return "adminStatusBadge isNeedsReview";
    default:
      return "adminStatusBadge isDraft";
  }
}

function healthClass(health: ProductionBrandRow["health"]): string {
  if (health === "green") return "adminProductionHealth is-green";
  if (health === "amber") return "adminProductionHealth is-amber";
  return "adminProductionHealth is-red";
}

export default function AdminProductionDashboard({
  stats,
  brands,
  models,
  brandNames,
  initialFilters = EMPTY_PRODUCTION_FILTERS,
}: Props) {
  const [filters, setFilters] = useState<ProductionDashboardFilters>(initialFilters);

  const filtered = useMemo(
    () => filterProductionModels(models, filters),
    [models, filters],
  );

  const publishQueue = useMemo(
    () =>
      models
        .filter((row) => row.status === "READY_FOR_HUMAN_APPROVAL")
        .sort((a, b) => b.completionPercent - a.completionPercent),
    [models],
  );

  const firstReady = publishQueue[0];
  const firstNeedsReview = models.find((row) => row.importStatus === "needs_review");

  return (
    <div className="adminProductionDashboard">
      <div className="adminStatsGrid adminStatsGridWide adminProductionStats">
        <article className="adminStatCard">
          <span>Brands</span>
          <strong>{stats.brands}</strong>
        </article>
        <article className="adminStatCard">
          <span>Cars</span>
          <strong>{stats.cars}</strong>
        </article>
        <article className="adminStatCard">
          <span>Published</span>
          <strong>{stats.published}</strong>
        </article>
        <article className="adminStatCard">
          <span>Needs Review</span>
          <strong>{stats.needsReview}</strong>
        </article>
        <article className="adminStatCard">
          <span>Approved</span>
          <strong>{stats.approved}</strong>
        </article>
        <article className="adminStatCard">
          <span>Ready for Human Approval</span>
          <strong>{stats.readyForHumanApproval}</strong>
        </article>
        <article className="adminStatCard">
          <span>Not Ready</span>
          <strong>{stats.notReady}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Images</span>
          <strong>{stats.missingImages}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Sources</span>
          <strong>{stats.missingSources}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Editorial</span>
          <strong>{stats.missingEditorial}</strong>
        </article>
        <article className="adminStatCard">
          <span>Missing Variants</span>
          <strong>{stats.missingVariants}</strong>
        </article>
      </div>

      <section className="adminProductionSection" aria-labelledby="production-progress-heading">
        <h2 id="production-progress-heading">Progress</h2>
        <div className="adminProductionProgressGrid">
          <article className="adminProductionProgressCard">
            <span>Overall</span>
            <strong>{stats.overallProgressPercent}%</strong>
            <div className="adminProductionBar" aria-hidden="true">
              <span style={{ width: `${stats.overallProgressPercent}%` }} />
            </div>
          </article>
          <article className="adminProductionProgressCard">
            <span>Brands in production</span>
            <strong>{brands.length}</strong>
            <p className="adminHint">
              {brands.filter((b) => b.health === "green").length} green ·{" "}
              {brands.filter((b) => b.health === "amber").length} amber ·{" "}
              {brands.filter((b) => b.health === "red").length} red
            </p>
          </article>
          <article className="adminProductionProgressCard">
            <span>Models ready / total</span>
            <strong>
              {stats.readyForHumanApproval + stats.approved + stats.published}/
              {stats.cars}
            </strong>
            <p className="adminHint">Ready for approval, approved, or published</p>
          </article>
        </div>
      </section>

      <section className="adminProductionSection" aria-labelledby="production-actions-heading">
        <h2 id="production-actions-heading">Quick actions</h2>
        <div className="adminQuickActions">
          <Link
            href={
              firstReady
                ? `/admin/biler/${firstReady.id}/rediger`
                : "/admin/biler?status=needs_review"
            }
            className="button primary"
          >
            Start Review
          </Link>
          <Link href="/admin/import/research" className="button secondary">
            Open Research
          </Link>
          <Link
            href={firstNeedsReview ? `/admin/biler/${firstNeedsReview.id}/rediger` : "/admin/biler"}
            className="button secondary"
          >
            Open Car
          </Link>
          <Link
            href={
              firstNeedsReview
                ? `/admin/biler/${firstNeedsReview.id}/varianter`
                : "/admin/biler"
            }
            className="button secondary"
          >
            Open Variants
          </Link>
          <a href="#publish-queue" className="button secondary">
            Publish Queue
          </a>
        </div>
      </section>

      <section
        id="publish-queue"
        className="adminProductionSection adminProductionPublishQueue"
        aria-labelledby="publish-queue-heading"
      >
        <h2 id="publish-queue-heading">Publish queue</h2>
        <p className="adminHint">
          Only models with dashboard status <strong>READY_FOR_HUMAN_APPROVAL</strong>. This does
          not publish or approve anything.
        </p>
        {publishQueue.length === 0 ? (
          <p className="adminEmpty">No models are ready for human approval yet.</p>
        ) : (
          <ul className="adminProductionQueueList">
            {publishQueue.map((row) => (
              <li key={row.id}>
                <div>
                  <strong>
                    {row.brand} {row.model}
                  </strong>
                  <span>
                    {row.completionPercent}% complete · next: {row.nextAction}
                  </span>
                </div>
                <Link
                  href={`/admin/biler/${row.id}/rediger`}
                  className="button primary buttonSm"
                >
                  Open Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="adminProductionSection" aria-labelledby="brand-status-heading">
        <h2 id="brand-status-heading">Brand status</h2>
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Models</th>
                <th>Ready</th>
                <th>Needs Review</th>
                <th>Published</th>
                <th>Missing Images</th>
                <th>Missing Sources</th>
                <th>Progress %</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 ? (
                <tr>
                  <td colSpan={9}>No brands yet.</td>
                </tr>
              ) : (
                brands.map((brand) => (
                  <tr key={brand.brand}>
                    <td>
                      <button
                        type="button"
                        className="adminProductionLinkButton"
                        onClick={() =>
                          setFilters((prev) => ({ ...prev, brand: brand.brand }))
                        }
                      >
                        {brand.brand}
                      </button>
                    </td>
                    <td>{brand.models}</td>
                    <td>
                      {brand.ready} Ready
                      {brand.notReady > 0 ? ` · ${brand.notReady} Not Ready` : ""}
                    </td>
                    <td>{brand.needsReview}</td>
                    <td>{brand.published}</td>
                    <td>{brand.missingImages}</td>
                    <td>{brand.missingSources}</td>
                    <td>{brand.progressPercent}%</td>
                    <td>
                      <span className={healthClass(brand.health)}>{brand.statusLabel}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adminProductionSection" aria-labelledby="model-table-heading">
        <div className="adminProductionSectionHeader">
          <h2 id="model-table-heading">Models</h2>
          <p className="adminHint">{filtered.length} of {models.length} shown</p>
        </div>

        <form
          className="catalogFilters adminProductionFilters"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="catalogFilterField catalogFilterGrow">
            Search
            <input
              value={filters.q}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, q: event.target.value }))
              }
              placeholder="Brand, model, slug"
            />
          </label>
          <label className="catalogFilterField">
            Brand
            <select
              value={filters.brand}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, brand: event.target.value }))
              }
            >
              <option value="">All brands</option>
              {brandNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="catalogFilterField">
            Status
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value as ProductionDashboardFilters["status"],
                }))
              }
            >
              <option value="">All statuses</option>
              {(
                Object.keys(PRODUCTION_STATUS_LABELS) as ProductionStatus[]
              ).map((key) => (
                <option key={key} value={key}>
                  {PRODUCTION_STATUS_LABELS[key]}
                </option>
              ))}
              <option value="missing_images">Missing Images</option>
              <option value="missing_sources">Missing Sources</option>
              <option value="missing_editorial">Missing Editorial</option>
            </select>
          </label>
          <div className="catalogFilterField">
            <span>&nbsp;</span>
            <button
              type="button"
              className="button secondary"
              onClick={() => setFilters(EMPTY_PRODUCTION_FILTERS)}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="adminTableWrap">
          <table className="adminTable adminProductionModelTable">
            <thead>
              <tr>
                <th>Brand</th>
                <th>Model</th>
                <th>Completion %</th>
                <th>Editorial %</th>
                <th>Images %</th>
                <th>Specs %</th>
                <th>Sources %</th>
                <th>Review %</th>
                <th>Status</th>
                <th>Buttons</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10}>No models match these filters.</td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id}>
                    <td>{row.brand}</td>
                    <td>
                      <strong>{row.model}</strong>
                      <div className="adminProductionMeta">{row.slug}</div>
                    </td>
                    <td>{row.completionPercent}%</td>
                    <td>{row.editorialPercent}%</td>
                    <td>{row.imagesPercent}%</td>
                    <td>{row.specsPercent}%</td>
                    <td>{row.sourcesPercent}%</td>
                    <td>{row.reviewPercent}%</td>
                    <td>
                      <span className={statusClass(row.status)}>{row.statusLabel}</span>
                    </td>
                    <td>
                      <div className="adminProductionRowActions">
                        <Link
                          href={`/admin/biler/${row.id}/rediger`}
                          className="button secondary buttonSm"
                        >
                          Review
                        </Link>
                        <Link
                          href={`/admin/biler/${row.id}/rediger`}
                          className="button secondary buttonSm"
                        >
                          Edit
                        </Link>
                        <Link
                          href="/admin/import/research"
                          className="button secondary buttonSm"
                        >
                          Research
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
