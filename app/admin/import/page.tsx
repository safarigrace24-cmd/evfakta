import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { computeAdminCarStats, listAdminCars } from "@/lib/admin/cars";
import { FUTURE_IMPORT_CONNECTORS } from "@/lib/admin/import/types";
import {
  getImportDashboardStats,
  listImportJobs,
} from "@/lib/admin/import/jobs";
import { computeMasterCatalogProgress } from "@/lib/admin/master-catalog";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Import | Adminpanel",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("nb-NO");
}

export default async function AdminImportPage() {
  await requireAdminUser("/admin/import");
  const cars = await listAdminCars();
  const carStats = computeAdminCarStats(cars);
  const catalogProgress = computeMasterCatalogProgress(cars);
  const [stats, jobs] = await Promise.all([
    getImportDashboardStats({
      drafts: carStats.drafts,
      needsReview: carStats.needsReview,
      approved: carStats.approved,
      published: carStats.published,
    }),
    listImportJobs(30),
  ]);

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Katalogimport</h1>
            <p className="lead narrow">
              Importer CSV/JSON, forhåndsvis endringer og følg historikk. Alt lander som utkast
              eller trenger gjennomgang — aldri auto-publisert.
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href="/admin/import/research" className="button primary">
              Ny research
            </Link>
            <Link href="/admin/import/ny" className="button secondary">
              CSV / JSON-import
            </Link>
          </div>
        </div>

        <AdminNav current="import" />

        <section className="adminImportSection adminCatalogProgress" aria-labelledby="catalog-progress-heading">
          <h2 id="catalog-progress-heading">Katalogfremdrift (master 50)</h2>
          <p className="adminHint">
            Målt mot planlagte modeller i masterkatalogplanen. Se{" "}
            <code>docs/EVFAKTA_MASTER_CATALOG.md</code>. Første batch:{" "}
            <code>data/catalog-batch-01-tesla.json</code> (ikke kjørt automatisk).
          </p>
          <div className="adminStatsGrid adminStatsGridWide">
            <article className="adminStatCard">
              <span>Planlagte modeller</span>
              <strong>{catalogProgress.plannedModels}</strong>
            </article>
            <article className="adminStatCard">
              <span>Importerte modeller</span>
              <strong>{catalogProgress.importedModels}</strong>
            </article>
            <article className="adminStatCard">
              <span>Trenger gjennomgang</span>
              <strong>{catalogProgress.needsReview}</strong>
            </article>
            <article className="adminStatCard">
              <span>Godkjent</span>
              <strong>{catalogProgress.approved}</strong>
            </article>
            <article className="adminStatCard">
              <span>Publisert</span>
              <strong>{catalogProgress.published}</strong>
            </article>
            <article className="adminStatCard">
              <span>Mangler bilde</span>
              <strong>{catalogProgress.missingImages}</strong>
            </article>
            <article className="adminStatCard">
              <span>Mangler kilde</span>
              <strong>{catalogProgress.missingSources}</strong>
            </article>
            <article className="adminStatCard">
              <span>Ikke importert ennå</span>
              <strong>{catalogProgress.notYetImported}</strong>
            </article>
          </div>
        </section>

        <div className="adminStatsGrid adminStatsGridWide">
          <article className="adminStatCard">
            <span>Utkast (alle biler)</span>
            <strong>{stats.drafts}</strong>
          </article>
          <article className="adminStatCard">
            <span>Trenger gjennomgang (alle)</span>
            <strong>{stats.needsReview}</strong>
          </article>
          <article className="adminStatCard">
            <span>Godkjent (alle)</span>
            <strong>{stats.approved}</strong>
          </article>
          <article className="adminStatCard">
            <span>Publisert (alle)</span>
            <strong>{stats.published}</strong>
          </article>
          <article className="adminStatCard">
            <span>Importjobber</span>
            <strong>{stats.totalJobs}</strong>
          </article>
          <article className="adminStatCard">
            <span>Fullført</span>
            <strong>{stats.completedJobs}</strong>
          </article>
          <article className="adminStatCard">
            <span>Feilet</span>
            <strong>{stats.failedJobs}</strong>
          </article>
          <article className="adminStatCard">
            <span>Siste importert/oppdatert</span>
            <strong>
              {stats.recentImported}/{stats.recentUpdated}
            </strong>
          </article>
        </div>

        <div className="adminQuickActions">
          <Link href="/admin/import/research" className="button primary">
            Research-pipeline
          </Link>
          <Link href="/admin/import/ny" className="button secondary">
            CSV / JSON-import
          </Link>
          <Link href="/admin/biler?status=needs_review" className="button secondary">
            Se trenger gjennomgang
          </Link>
          <Link href="/admin/biler?status=draft" className="button secondary">
            Se utkast
          </Link>
          <Link href="/admin/biler" className="button secondary">
            Katalog med bulk-handlinger
          </Link>
        </div>

        <section className="adminImportSection">
          <h2>Importmetoder</h2>
          <ul className="adminMethodList">
            <li>
              <strong>CSV</strong> — standard katalogfil med forhåndsvisning og validering
            </li>
            <li>
              <strong>JSON</strong> — `cars`/`items`-array eller rå liste
            </li>
            <li>
              <strong>Bilder</strong> — galleri-URL-er i `gallery_images` (skip/replace)
            </li>
            <li>
              <strong>API (kommende)</strong>
              <ul>
                {FUTURE_IMPORT_CONNECTORS.map((connector) => (
                  <li key={connector.key}>
                    {connector.label} — {connector.description}
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </section>

        <section className="adminImportSection">
          <h2>Nylige importer / historikk</h2>
          {jobs.length === 0 ? (
            <p className="adminEmpty">
              Ingen importjobber ennå. Start med{" "}
              <Link href="/admin/import/ny">Ny import</Link>.
            </p>
          ) : (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Tidspunkt</th>
                    <th>Metode</th>
                    <th>Fil</th>
                    <th>Status</th>
                    <th>Rapport</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const summary = job.summary as {
                      imported?: number;
                      updated?: number;
                      skipped?: number;
                      errors?: number;
                    };
                    return (
                      <tr key={job.id}>
                        <td>{formatDate(job.created_at)}</td>
                        <td>{job.method.toUpperCase()}</td>
                        <td>{job.filename || "—"}</td>
                        <td>
                          <span className={`adminStatusBadge status-${job.status}`}>
                            {job.status}
                          </span>
                        </td>
                        <td>
                          +{summary.imported ?? 0} / Δ{summary.updated ?? 0} / skip{" "}
                          {summary.skipped ?? 0} / err {summary.errors ?? 0}
                        </td>
                        <td>
                          <Link
                            href={`/admin/import/${job.id}`}
                            className="button secondary buttonSm"
                          >
                            Åpne
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>
    </section>
  );
}
