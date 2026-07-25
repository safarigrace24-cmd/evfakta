import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminBrandForm from "@/components/admin/admin-brand-form";
import { requireAdminUser } from "@/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nytt merke | Adminpanel",
};

export default async function AdminNewBrandPage() {
  await requireAdminUser("/admin/merker");

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Nytt merke</h1>
            <p className="lead narrow">Opprett et bilmerke med logo og metadata.</p>
          </div>
          <Link href="/admin/merker" className="button secondary">
            Tilbake til merker
          </Link>
        </div>

        <AdminNav current="brands" />
        <AdminBrandForm mode="create" />
      </Container>
    </section>
  );
}
