"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  bulkAssignBrandAction,
  bulkAssignSourceAction,
  bulkDeleteCarsAction,
  bulkPublishCarsAction,
  bulkSetImportStatusAction,
} from "@/app/admin/catalog-actions";
import DeleteCarButton from "@/components/admin/delete-car-button";
import PublishToggleButton from "@/components/admin/publish-toggle-button";
import type { AdminBrand } from "@/lib/admin/brand-types";
import {
  catalogFiltersToParams,
  filterAdminCars,
  uniqueCatalogValues,
  type AdminCatalogFilters,
} from "@/lib/admin/catalog-query";
import {
  IMPORT_STATUS_LABELS,
  type AdminCar,
  type ImportStatus,
} from "@/lib/admin/types";

type Props = {
  cars: AdminCar[];
  brands: AdminBrand[];
  initialFilters: AdminCatalogFilters;
};

function reviewStatusClass(status: ImportStatus | null | undefined): string {
  if (status === "approved") return "isApproved";
  if (status === "needs_review") return "isNeedsReview";
  return "isDraft";
}

export default function AdminCatalogClient({ cars, brands, initialFilters }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>([]);
  const [brandId, setBrandId] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(
    () => filterAdminCars(cars, initialFilters),
    [cars, initialFilters],
  );
  const facets = useMemo(() => uniqueCatalogValues(cars), [cars]);

  function updateFilters(patch: Partial<AdminCatalogFilters>) {
    const next = { ...initialFilters, ...patch };
    const params = catalogFiltersToParams(next);
    const href = params.toString() ? `/admin/biler?${params.toString()}` : "/admin/biler";
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? filtered.map((car) => car.id) : []);
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((current) =>
      checked ? [...new Set([...current, id])] : current.filter((item) => item !== id),
    );
  }

  function runBulk(action: () => Promise<{ ok: boolean; message?: string; error?: string }>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error || "Noe gikk galt.");
        return;
      }
      setMessage(result.message || "OK");
      setSelected([]);
      router.refresh();
    });
  }

  return (
    <div className="adminCatalog">
      <form
        className="catalogFilters"
        onSubmit={(event) => event.preventDefault()}
        aria-busy={isPending}
      >
        <label className="catalogFilterField catalogFilterGrow">
          <span>Søk</span>
          <input
            value={initialFilters.q}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Merke, modell eller slug…"
          />
        </label>
        <label className="catalogFilterField">
          <span>Merke</span>
          <select
            value={initialFilters.brand}
            onChange={(e) => updateFilters({ brand: e.target.value })}
          >
            <option value="">Alle</option>
            {facets.brands.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        </label>
        <label className="catalogFilterField">
          <span>Status</span>
          <select
            value={initialFilters.status}
            onChange={(e) =>
              updateFilters({ status: e.target.value as AdminCatalogFilters["status"] })
            }
          >
            <option value="">Alle</option>
            <option value="draft">Utkast</option>
            <option value="needs_review">Trenger gjennomgang</option>
            <option value="approved">Godkjent</option>
            <option value="published">Publisert</option>
            <option value="unpublished">Ikke publisert</option>
          </select>
        </label>
        <label className="catalogFilterField">
          <span>Land</span>
          <select
            value={initialFilters.country}
            onChange={(e) => updateFilters({ country: e.target.value })}
          >
            <option value="">Alle</option>
            {facets.countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="catalogFilterField">
          <span>År</span>
          <select
            value={initialFilters.year}
            onChange={(e) => updateFilters({ year: e.target.value })}
          >
            <option value="">Alle</option>
            {facets.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label className="catalogFilterField">
          <span>Karosseri</span>
          <select
            value={initialFilters.body}
            onChange={(e) => updateFilters({ body: e.target.value })}
          >
            <option value="">Alle</option>
            {facets.bodies.map((body) => (
              <option key={body} value={body}>
                {body}
              </option>
            ))}
          </select>
        </label>
        <label className="catalogFilterField">
          <span>Drivlinje</span>
          <select
            value={initialFilters.drive}
            onChange={(e) => updateFilters({ drive: e.target.value })}
          >
            <option value="">Alle</option>
            {facets.drives.map((drive) => (
              <option key={drive} value={drive}>
                {drive}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="resultCount">
        {filtered.length} bil(er){selected.length ? ` · ${selected.length} valgt` : ""}
        {isPending ? " …" : ""}
      </p>

      <div className="adminBulkBar">
        <div className="adminBulkActions">
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() =>
              runBulk(() => bulkSetImportStatusAction(selected, "needs_review"))
            }
          >
            Til gjennomgang
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() => runBulk(() => bulkSetImportStatusAction(selected, "approved"))}
          >
            Godkjenn
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() => runBulk(() => bulkSetImportStatusAction(selected, "draft"))}
          >
            Sett som utkast
          </button>
          <button
            type="button"
            className="button primary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() => runBulk(() => bulkPublishCarsAction(selected, true))}
          >
            Bulk-publiser
          </button>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() => runBulk(() => bulkPublishCarsAction(selected, false))}
          >
            Avpubliser
          </button>
          <button
            type="button"
            className="adminDangerButton buttonSm"
            disabled={!selected.length || isPending}
            onClick={() => {
              if (!window.confirm(`Slette ${selected.length} bil(er)?`)) return;
              runBulk(() => bulkDeleteCarsAction(selected));
            }}
          >
            Slett
          </button>
        </div>

        <div className="adminBulkAssign">
          <select value={brandId} onChange={(e) => setBrandId(e.target.value)}>
            <option value="">Tildel merke…</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || !brandId || isPending}
            onClick={() => runBulk(() => bulkAssignBrandAction(selected, brandId))}
          >
            Tildel merke
          </button>
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Kildenavn"
          />
          <input
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="Kilde-URL"
          />
          <button
            type="button"
            className="button secondary buttonSm"
            disabled={!selected.length || isPending}
            onClick={() =>
              runBulk(() => bulkAssignSourceAction(selected, sourceName, sourceUrl))
            }
          >
            Tildel kilde
          </button>
        </div>
      </div>

      {error ? (
        <p className="adminInlineError" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="adminSuccess" role="status">
          {message}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="adminEmpty">Ingen biler matcher filtrene.</p>
      ) : (
        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    aria-label="Velg alle"
                    checked={
                      filtered.length > 0 && selected.length === filtered.length
                    }
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th>Merke</th>
                <th>Modell</th>
                <th>År</th>
                <th>Land</th>
                <th>Slug</th>
                <th>Gjennomgang</th>
                <th>Publisering</th>
                <th>Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((car) => {
                const importStatus = (car.import_status ?? "draft") as ImportStatus;
                const country =
                  (car as AdminCar & { country?: string | null }).country ?? "NO";
                return (
                  <tr key={car.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Velg ${car.brand} ${car.model}`}
                        checked={selected.includes(car.id)}
                        onChange={(e) => toggleOne(car.id, e.target.checked)}
                      />
                    </td>
                    <td>{car.brand}</td>
                    <td>{car.model}</td>
                    <td>{car.year ?? "—"}</td>
                    <td>{country}</td>
                    <td>
                      <code className="adminSlug">{car.slug}</code>
                    </td>
                    <td>
                      <span className={`adminStatusBadge ${reviewStatusClass(importStatus)}`}>
                        {IMPORT_STATUS_LABELS[importStatus]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`adminStatusBadge ${car.is_published ? "isPublished" : "isDraft"}`}
                      >
                        {car.is_published ? "Publisert" : "Ikke publisert"}
                      </span>
                    </td>
                    <td>
                      <div className="adminRowActions">
                        <Link
                          href={`/admin/biler/${car.id}/rediger`}
                          className="button secondary buttonSm"
                        >
                          Rediger
                        </Link>
                        <PublishToggleButton id={car.id} isPublished={car.is_published} />
                        <DeleteCarButton id={car.id} label={`${car.brand} ${car.model}`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
