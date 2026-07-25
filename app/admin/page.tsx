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
            Kvalitetsoversikt for katalog, gjennomgang og publisering. Godkjenning og
            publisering er separate handlinger.
          </p>
        </div>

        <AdminNav current="dashboard" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> Bare biler merket som publisert vises offentlig. Publisering
          krever godkjent status, bilde, kilde og sist sjekket-dato.
        </div>

        {!dbConfigured && (
          <p className="authAlert authAlertError" role="alert">
            SUPABASE_SERVICE_ROLE_KEY mangler. Admin-skriving er midlertidig utilgjengelig.
          </p>
        )}

        <div className="adminStatsGrid adminStatsGridWide">
          <article className="adminStatCard">
            <span>Totalt</span>
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
          <article className="adminStatCard">
            <span>Trenger gjennomgang</span>
            <strong>{stats.needsReview}</strong>
          </article>
          <article className="adminStatCard">
            <span>Godkjent</span>
            <strong>{stats.approved}</strong>
          </article>
          <article className="adminStatCard">
            <span>Mangler bilde</span>
            <strong>{stats.missingImages}</strong>
          </article>
          <article className="adminStatCard">
            <span>Mangler kilde</span>
            <strong>{stats.missingSource}</strong>
          </article>
        </div>

        <div className="adminQuickActions">
          <Link href="/admin/import/ny" className="button primary">
            Ny import
          </Link>
          <Link href="/admin/biler/ny" className="button secondary">
            Legg til bil
          </Link>
          <Link href="/admin/biler" className="button secondary">
            Se katalog
          </Link>
          <Link href="/admin/import" className="button secondary">
            Import-dashboard
          </Link>
          <Link href="/admin/merker" className="button secondary">
            Administrer merker
          </Link>
        </div>
      </Container>
    </section>
  );
}
