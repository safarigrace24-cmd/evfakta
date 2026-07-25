import Link from "next/link";
import { notFound } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminBrandForm from "@/components/admin/admin-brand-form";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminBrandById } from "@/lib/admin/brands";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rediger merke | Adminpanel",
};

export default async function AdminEditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminUser("/admin/merker");
  const { id } = await params;
  const brand = await getAdminBrandById(id);

  if (!brand) {
    notFound();
  }

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Rediger merke</h1>
            <p className="lead narrow">{brand.name}</p>
          </div>
          <Link href="/admin/merker" className="button secondary">
            Tilbake til merker
          </Link>
        </div>

        <AdminNav current="brands" />
        <AdminBrandForm mode="edit" brand={brand} />
      </Container>
    </section>
  );
}
