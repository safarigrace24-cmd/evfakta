import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminResearchJobClient from "@/components/admin/admin-research-job-client";
import { requireAdminUser } from "@/lib/auth/require-admin";
import {
  getResearchJob,
  listResearchFieldCandidates,
  listResearchImageCandidates,
  listResearchItems,
} from "@/lib/admin/research/jobs";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Research-jobb | Adminpanel",
};

export default async function AdminResearchJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("/admin/import/research");
  const { id } = await params;
  const job = await getResearchJob(id);
  if (!job) notFound();

  const items = await listResearchItems(job.id);
  const details = await Promise.all(
    items.map(async (item) => ({
      item,
      fields: await listResearchFieldCandidates(item.id),
      images: await listResearchImageCandidates(item.id),
    })),
  );

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Forhåndsvis research</h1>
            <p className="lead narrow">
              {job.brand_name || "Merke"}
              {job.model_query ? ` · ${job.model_query}` : ""} — godkjenn felter,
              deretter importer som needs_review.
            </p>
          </div>
          <Link href="/admin/import/research" className="button secondary">
            Tilbake
          </Link>
        </div>

        <AdminNav current="import" />
        <AdminResearchJobClient job={job} details={details} />
      </Container>
    </section>
  );
}
