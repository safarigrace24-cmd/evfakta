import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { getAdminCarStats } from "@/lib/admin/cars";
import { getServiceRoleKey } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Adminpanel",
};

export default async function AdminDashboardPage() {
  await requireAdminUser("/admin");
  const stats = await getAdminCarStats();
  const dbConfigured = Boolean(getServiceRoleKey());

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Adminpanel</Eyebrow>
          <h1>Oversikt</h1>
          <p className="lead narrow">
            Administrer elbiler i databasen. Publiserte biler vises på /modeller og
            modellsidene.
          </p>
        </div>

        <AdminNav current="dashboard" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Bare biler merket som publisert vises på de offentlige sidene.
          Utkast forblir kun synlige her i adminpanelet.
        </div>

        {!dbConfigured && (
          <p className="authAlert authAlertError" role="alert">
            SUPABASE_SERVICE_ROLE_KEY mangler. Admin-skriving er midlertidig utilgjengelig.
          </p>
        )}

        <div className="adminStatsGrid">
          <article className="adminStatCard">
            <span>Totalt i databasen</span>
            <strong>{stats.total}</strong>
          </article>
          <article className="adminStatCard">
            <span>Publisert</span>
            <strong>{stats.published}</strong>
          </article>
          <article className="adminStatCard">
            <span>Utkast</span>
            <strong>{stats.drafts}</strong>
          </article>
        </div>

        <div className="adminQuickActions">
          <Link href="/admin/biler/ny" className="button primary">
            Legg til bil
          </Link>
          <Link href="/admin/biler" className="button secondary">
            Se alle biler
          </Link>
        </div>
      </Container>
    </section>
  );
}
