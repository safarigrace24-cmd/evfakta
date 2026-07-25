import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminCatalogClient from "@/components/admin/admin-catalog-client";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { listAdminBrands } from "@/lib/admin/brands";
import { listAdminCars } from "@/lib/admin/cars";
import { parseAdminCatalogFilters } from "@/lib/admin/catalog-query";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Biler | Adminpanel",
};

export default async function AdminCarsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser("/admin/biler");
  const params = await searchParams;
  const [cars, brands] = await Promise.all([listAdminCars(), listAdminBrands()]);
  const filters = parseAdminCatalogFilters(params);

  return (
    <section className="section">
      <Container>
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Katalog</h1>
            <p className="lead narrow">
              Søk, filtrer og bulk-håndter opptil 1000+ elbiler. Publisering krever fortsatt
              godkjenning og klar-sjekk.
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href="/admin/import/ny" className="button secondary">
              Importer
            </Link>
            <Link href="/admin/biler/ny" className="button primary">
              Legg til bil
            </Link>
          </div>
        </div>

        <AdminNav current="cars" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Bare publiserte biler vises offentlig. Bulk-publisering hopper over
          biler som mangler bilde, kilde, sjekkdato eller godkjenning.
        </div>

        <AdminCatalogClient cars={cars} brands={brands} initialFilters={filters} />
      </Container>
    </section>
  );
}
