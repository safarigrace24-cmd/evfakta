import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarForm from "@/components/admin/admin-car-form";
import { requireAdminUser } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Legg til bil | Adminpanel",
};

export default async function AdminNewCarPage() {
  await requireAdminUser("/admin/biler/ny");

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Adminpanel</Eyebrow>
          <h1>Legg til bil</h1>
          <p className="lead narrow">
            Lagre en ny elbil i databasen. Publisering til /modeller kommer i neste fase.
          </p>
        </div>

        <AdminNav current="new" />
        <AdminCarForm mode="create" />
      </Container>
    </section>
  );
}
