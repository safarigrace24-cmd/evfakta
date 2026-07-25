import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarForm from "@/components/admin/admin-car-form";
import AdminCarGallery from "@/components/admin/admin-car-gallery";
import AdminCarReviewPanel from "@/components/admin/admin-car-review-panel";
import AdminCarVariantsPanel from "@/components/admin/admin-car-variants-panel";
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
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Rediger bil</h1>
            <p className="lead narrow">
              {car.brand} {car.model}
            </p>
          </div>
          <Link href="/admin/biler" className="button secondary">
            Tilbake til biler
          </Link>
        </div>

        <AdminNav current="cars" />
        <AdminCarReviewPanel car={car} />
        <AdminCarGallery carId={car.id} carSlug={car.slug} initialImages={images} />
        <AdminCarVariantsPanel carId={car.id} initialVariants={variants} />
        <AdminCarForm mode="edit" car={car} brands={brands} />
      </Container>
    </section>
  );
}
