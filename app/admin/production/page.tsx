import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import AdminNav from "@/components/admin/admin-nav";
import AdminProductionDashboard from "@/components/admin/admin-production-dashboard";
import { requireAdminUser } from "@/lib/auth/require-admin";
import { parseProductionDashboardFilters } from "@/lib/admin/production-dashboard";
import { loadProductionDashboard } from "@/lib/admin/production-dashboard-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Production | Adminpanel",
};

export default async function AdminProductionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser("/admin/production");
  const params = await searchParams;
  const initialFilters = parseProductionDashboardFilters(params);
  const payload = await loadProductionDashboard();

  return (
    <section className="section">
      <Container className="adminEditorContainer">
        <div className="pageHeader adminPageHeader">
          <div>
            <Eyebrow>Adminpanel</Eyebrow>
            <h1>Production</h1>
            <p className="lead narrow">
              See what is ready, what is missing, and what to work on next. This dashboard does not
              change review, research, import, or publish workflows.
            </p>
          </div>
          <div className="adminQuickActions">
            <Link href="/admin/import/research" className="button secondary">
              Research
            </Link>
            <Link href="/admin/biler?status=needs_review" className="button primary">
              Needs review
            </Link>
          </div>
        </div>

        <AdminNav current="production" />

        <div className="adminNotice" role="note">
          <strong>Merk:</strong> <code>READY_FOR_HUMAN_APPROVAL</code> is a dashboard label only —
          not a database status. Approval and publication remain separate manual actions.
        </div>

        <AdminProductionDashboard
          stats={payload.stats}
          brands={payload.brands}
          models={payload.models}
          brandNames={payload.brandNames}
          initialFilters={initialFilters}
        />
      </Container>
    </section>
  );
}
