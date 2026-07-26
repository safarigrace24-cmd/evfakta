import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarEditorWorkspace from "@/components/admin/admin-car-editor-workspace";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminCarById } from "@/lib/admin/cars";
import { listAdminCarImages } from "@/lib/admin/car-images";
import { listAdminBrands } from "@/lib/admin/brands";
import { listAdminCarVariants } from "@/lib/admin/variants";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rediger bil | Adminpanel",
};

export default async function AdminEditCarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("/admin/biler");
  const { id } = await params;
  const [car, brands] = await Promise.all([getAdminCarById(id), listAdminBrands()]);

  if (!car) {
    notFound();
  }

  const [images, variants] = await Promise.all([
    listAdminCarImages(car.id),
    listAdminCarVariants(car.id),
  ]);

  return (
    <section className="section adminEditorPage">
      <Container className="adminEditorContainer">
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Car Editor</h1>
            <p className="lead narrow">
              {car.brand} {car.model}
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href={`/admin/biler/${car.id}/varianter`} className="button secondary">
              Variants
            </Link>
            <Link href="/admin/biler" className="button secondary">
              Tilbake til biler
            </Link>
          </div>
        </div>

        <AdminNav current="cars" />
        <AdminCarEditorWorkspace
          car={car}
          brands={brands}
          images={images}
          variants={variants}
        />
      </Container>
    </section>
  );
}
