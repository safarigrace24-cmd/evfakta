import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminBrandsTable from "@/components/admin/admin-brands-table";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAdminBrands } from "@/lib/admin/brands";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Merker | Adminpanel",
};

export default async function AdminBrandsPage() {
  await requireAdminUser("/admin/merker");
  const brands = await listAdminBrands();

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Merker</h1>
            <p className="lead narrow">
              Administrer bilmerker, logoer og synlighet på /merker.
            </p>
          </div>
          <Link href="/admin/merker/ny" className="button primary">
            Legg til merke
          </Link>
        </div>

        <AdminNav current="brands" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Bare aktive merker vises på den offentlige merkesiden.
          Eksisterende biler beholder merketeksten selv om du sletter et merke.
        </div>

        <AdminBrandsTable brands={brands} />
      </Container>
    </section>
  );
}
