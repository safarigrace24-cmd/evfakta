import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminImportUploader from "@/components/admin/admin-import-uploader";
import { requireAdminUser } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ny import | Adminpanel",
};

export default async function AdminNewImportPage() {
  await requireAdminUser("/admin/import/ny");

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Adminpanel</Eyebrow>
          <h1>Ny katalogimport</h1>
          <p className="lead narrow">
            Last opp CSV eller JSON, forhåndsvis beslutninger, og bekreft. Duplikater oppdages på
            slug. Uendrede rader kan hoppes over.
          </p>
        </div>

        <AdminNav current="import" />
        <AdminImportUploader />
      </Container>
    </section>
  );
}
