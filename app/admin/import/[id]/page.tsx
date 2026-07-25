import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getImportJob, listImportJobItems } from "@/lib/admin/import/jobs";
import type { ImportReportSummary } from "@/lib/admin/import/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  return { title: `Import ${id.slice(0, 8)} | Adminpanel` };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("nb-NO");
}

export default async function AdminImportJobPage({ params }: PageProps) {
  await requireAdminUser("/admin/import");
  const { id } = await params;
  const [job, items] = await Promise.all([getImportJob(id), listImportJobItems(id)]);

  if (!job) notFound();

  const summary = job.summary as ImportReportSummary;

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Importrapport</Eyebrow>
            <h1>{job.filename || `Jobb ${job.id.slice(0, 8)}`}</h1>
            <p className="lead narrow">
              {job.method.toUpperCase()} · {job.status} · {formatDate(job.created_at)}
              {job.completed_at ? ` → ${formatDate(job.completed_at)}` : ""}
            </p>
          </div>
          <Link href="/admin/import/ny" className="button primary">
            Ny import
          </Link>
        </div>

        <AdminNav current="import" />

        {job.error_message ? (
          <div className="adminNotice" role="alert">
            <strong>Feilmelding:</strong> {job.error_message}
          </div>
        ) : null}

        <div className="adminStatsGrid adminStatsGridWide">
          <article className="adminStatCard">
            <span>Importert</span>
            <strong>{summary.imported ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Oppdatert</span>
            <strong>{summary.updated ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Hoppet over</span>
            <strong>{summary.skipped ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Feil</span>
            <strong>{summary.errors ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Advarsler</span>
            <strong>{summary.warnings ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Bilder inn</span>
            <strong>{summary.imagesImported ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Bilder hoppet</span>
            <strong>{summary.imagesSkipped ?? 0}</strong>
          </article>
          <article className="adminStatCard">
            <span>Bilder erstattet</span>
            <strong>{summary.imagesReplaced ?? 0}</strong>
          </article>
        </div>

        <div className="adminQuickActions">
          <Link href="/admin/import" className="button secondary">
            Tilbake til import
          </Link>
          <Link href="/admin/biler?status=needs_review" className="button secondary">
            Gå til gjennomgang
          </Link>
        </div>

        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Rad</th>
                <th>Slug</th>
                <th>Handling</th>
                <th>Melding</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4}>Ingen detaljrader lagret for denne jobben.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.row_number ?? "—"}</td>
                    <td>
                      {item.slug ? (
                        <code className="adminSlug">{item.slug}</code>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`adminStatusBadge decision-${item.action}`}>
                        {item.action}
                      </span>
                    </td>
                    <td>{item.message || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}
