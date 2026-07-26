import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarVariantsPanel from "@/components/admin/admin-car-variants-panel";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminCarById } from "@/lib/admin/cars";
import { listAdminCarVariants } from "@/lib/admin/variants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Varianter | Adminpanel",
};

export default async function AdminCarVariantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("/admin/biler");
  const { id } = await params;
  const car = await getAdminCarById(id);

  if (!car) {
    notFound();
  }

  const variants = await listAdminCarVariants(car.id);

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Variants</h1>
            <p className="lead narrow">
              {car.brand} {car.model}
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href={`/admin/biler/${car.id}/rediger`} className="button secondary">
              Back to editor
            </Link>
            <Link href="/admin/biler" className="button secondary">
              Tilbake til biler
            </Link>
          </div>
        </div>

        <AdminNav current="cars" />

        <section className="adminEditorPanel" aria-labelledby="variants-page-heading">
          <h2 id="variants-page-heading">Variant management</h2>
          <p className="adminHint">
            Dedicated workspace for trim-level specifications. Approval and publish
            remain separate steps in the car editor.
          </p>
          <AdminCarVariantsPanel carId={car.id} initialVariants={variants} />
        </section>
      </Container>
    </section>
  );
}
