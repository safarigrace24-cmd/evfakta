import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminImageReviewWorkspace from "@/components/admin/admin-image-review-workspace";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { loadImageReviewWorkspace } from "@/lib/admin/image-review-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Image Review | Adminpanel",
};

export default async function AdminImageReviewCarPage({
  params,
}: {
  params: Promise<{ carId: string }>;
}) {
  await requireAdminUser("/admin/images");
  const { carId } = await params;
  const workspace = await loadImageReviewWorkspace(carId);
  if (!workspace) notFound();

  const { car, cards, gallery, readiness, emptyCandidatesMessage } = workspace;

  return (
    <section className="section">
      <Container className="adminEditorContainer">
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Image Review</Eyebrow>
            <h1>
              {car.brand} {car.model}
            </h1>
            <p className="lead narrow">
              Review research candidates before they appear on public surfaces.
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href="/admin/images" className="button secondary">
              All models
            </Link>
            <Link href={`/admin/biler/${car.id}/rediger`} className="button secondary">
              Car editor
            </Link>
          </div>
        </div>

        <AdminNav current="images" />

        <AdminImageReviewWorkspace
          car={car}
          cards={cards}
          gallery={gallery}
          readiness={readiness}
          emptyCandidatesMessage={emptyCandidatesMessage}
        />
      </Container>
    </section>
  );
}
