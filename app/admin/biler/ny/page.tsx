import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarForm from "@/components/admin/admin-car-form";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAdminBrands } from "@/lib/admin/brands";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Legg til bil | Adminpanel",
};

export default async function AdminNewCarPage() {
  await requireAdminUser("/admin/biler/ny");
  const brands = await listAdminBrands();

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Adminpanel</Eyebrow>
          <h1>Legg til bil</h1>
          <p className="lead narrow">
            Lagre en ny elbil som utkast. Godkjenn og publiser først når data er kvalitetssikret.
          </p>
        </div>

        <AdminNav current="new" />
        <AdminCarForm mode="create" brands={brands} />
      </Container>
    </section>
  );
}
