import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCarsTable from "@/components/admin/admin-cars-table";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAdminCars } from "@/lib/admin/cars";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Biler | Adminpanel",
};

export default async function AdminCarsPage() {
  await requireAdminUser("/admin/biler");
  const cars = await listAdminCars();

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Biler</h1>
            <p className="lead narrow">Administrer merker, modeller og publiseringsstatus.</p>
          </div>
          <Link href="/admin/biler/ny" className="button primary">
            Legg til bil
          </Link>
        </div>

        <AdminNav current="cars" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Bare publiserte biler vises på /modeller og modellsidene.
        </div>

        <AdminCarsTable cars={cars} />
      </Container>
    </section>
  );
}
