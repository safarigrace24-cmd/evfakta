import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminResearchForm from "@/components/admin/admin-research-form";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAdminBrands } from "@/lib/admin/brands";
import { listResearchJobs } from "@/lib/admin/research/jobs";
import { RESEARCH_PROVIDERS } from "@/lib/admin/research/providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Research | Adminpanel",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("nb-NO");
}

export default async function AdminResearchPage() {
  await requireAdminUser("/admin/import/research");
  const [brands, jobs] = await Promise.all([listAdminBrands(), listResearchJobs(40)]);

  const providers = RESEARCH_PROVIDERS.map((provider) => ({
    key: provider.key,
    label: provider.label,
    description: provider.description,
    supportsLive: provider.supportsLive,
  }));

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Research</h1>
            <p className="lead narrow">
              Velg merke og kilde — systemet søker, du forhåndsviser, godkjenner og
              importerer. Publisering skjer aldri automatisk.
            </p>
          </div>
          <Link href="/admin/import" className="button secondary">
            Til import-dashboard
          </Link>
        </div>

        <AdminNav current="import" />

        <section className="adminImportSection">
          <h2>Ny research</h2>
          <AdminResearchForm brands={brands} providers={providers} />
        </section>

        <section className="adminImportSection">
          <h2>Jobbhistorikk</h2>
          {jobs.length === 0 ? (
            <p className="adminEmpty">Ingen research-jobber ennå.</p>
          ) : (
            <div className="adminTableWrap">
              <table className="adminTable">
                <thead>
                  <tr>
                    <th>Tidspunkt</th>
                    <th>Merke / modell</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Fremdrift</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td>{formatDate(job.created_at)}</td>
                      <td>
                        {job.brand_name || "—"}
                        {job.model_query ? ` / ${job.model_query}` : ""}
                      </td>
                      <td>{job.provider_key}</td>
                      <td>
                        <span className={`adminStatusBadge status-${job.status}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>
                        {job.progress_pct}% {job.progress_message ? `· ${job.progress_message}` : ""}
                      </td>
                      <td>
                        <Link
                          href={`/admin/import/research/${job.id}`}
                          className="button secondary buttonSm"
                        >
                          Åpne
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </Container>
    </section>
  );
}
