import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminCarStats } from "@/lib/admin/cars";
import { FUTURE_IMPORT_CONNECTORS } from "@/lib/admin/import/types";
import {
  getImportDashboardStats,
  listImportJobs,
} from "@/lib/admin/import/jobs";

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
  const carStats = await getAdminCarStats();
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
          <Link href="/admin/import/ny" className="button primary">
            Ny import
          </Link>
        </div>

        <AdminNav current="import" />

        <div className="adminStatsGrid adminStatsGridWide">
          <article className="adminStatCard">
            <span>Utkast</span>
            <strong>{stats.drafts}</strong>
          </article>
          <article className="adminStatCard">
            <span>Trenger gjennomgang</span>
            <strong>{stats.needsReview}</strong>
          </article>
          <article className="adminStatCard">
            <span>Godkjent</span>
            <strong>{stats.approved}</strong>
          </article>
          <article className="adminStatCard">
            <span>Publisert</span>
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
          <Link href="/admin/import/ny" className="button primary">
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
