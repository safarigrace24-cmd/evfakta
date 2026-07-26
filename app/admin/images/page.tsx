import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminImageReviewOverview from "@/components/admin/admin-image-review-overview";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { loadImageReviewSummaries } from "@/lib/admin/image-review-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Image Review | Adminpanel",
};

export default async function AdminImageReviewPage() {
  await requireAdminUser("/admin/images");
  const models = await loadImageReviewSummaries();

  return (
    <section className="section">
      <Container className="adminEditorContainer">
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Image Review</h1>
            <p className="lead narrow">
              Editorial review of research image candidates. Images are never approved or
              published automatically.
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href="/admin/production" className="button secondary">
              Production
            </Link>
            <Link href="/admin/import/research" className="button secondary">
              Research
            </Link>
          </div>
        </div>

        <AdminNav current="images" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Approve / Reject / Hero selection only updates image candidates
          and gallery attachment. They never change <code>import_status</code> or{" "}
          <code>is_published</code>.
        </div>

        <AdminImageReviewOverview models={models} />
      </Container>
    </section>
  );
}
