"use client";

import Link from "next/link";
import { useState } from "react";
import AdminCarEditorHeader from "@/components/admin/admin-car-editor-header";
import AdminCarForm, {
  type CarEditorFormTab,
} from "@/components/admin/admin-car-form";
import AdminCarGallery from "@/components/admin/admin-car-gallery";
import AdminCarHistoryPanel from "@/components/admin/admin-car-history-panel";
import AdminCarVariantsPanel from "@/components/admin/admin-car-variants-panel";
import AdminEditorialAssistant from "@/components/admin/admin-editorial-assistant";
import AdminFieldReviewCards from "@/components/admin/admin-field-review-cards";
import type { AdminBrand } from "@/lib/admin/brand-types";
import type { CarImageRow } from "@/lib/admin/car-image-types";
import type { AdminCar } from "@/lib/admin/types";
import type { AdminCarVariant } from "@/lib/admin/variant-types";

export type CarEditorTab =
  | "overview"
  | "specifications"
  | "images"
  | "variants"
  | "editorial"
  | "sources"
  | "history";

const TABS: Array<{ id: CarEditorTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "specifications", label: "Specifications" },
  { id: "images", label: "Images" },
  { id: "variants", label: "Variants" },
  { id: "editorial", label: "Editorial" },
  { id: "sources", label: "Sources" },
  { id: "history", label: "History" },
];

function toFormTab(tab: CarEditorTab): CarEditorFormTab | null {
  if (
    tab === "overview" ||
    tab === "specifications" ||
    tab === "editorial" ||
    tab === "sources"
  ) {
    return tab;
  }
  return null;
}

type AdminCarEditorWorkspaceProps = {
  car: AdminCar;
  brands: AdminBrand[];
  images: CarImageRow[];
  variants: AdminCarVariant[];
};

export default function AdminCarEditorWorkspace({
  car,
  brands,
  images,
  variants,
}: AdminCarEditorWorkspaceProps) {
  const [tab, setTab] = useState<CarEditorTab>("overview");
  const formTab = toFormTab(tab);

  return (
    <div className="adminEditorWorkspace">
      <AdminCarEditorHeader car={car} images={images} variants={variants} />

      <div className="adminEditorLayout">
        <div className="adminEditorMain">
          <nav className="adminEditorTabs" aria-label="Car editor sections">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={
                  tab === item.id
                    ? "adminEditorTab is-active"
                    : "adminEditorTab"
                }
                aria-current={tab === item.id ? "page" : undefined}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="adminEditorTabPanels">
            {tab === "overview" ? (
              <AdminFieldReviewCards car={car} />
            ) : null}

            {/* Keep one form instance mounted so unsaved edits survive tab changes. */}
            <div hidden={!formTab}>
              <AdminCarForm
                mode="edit"
                car={car}
                brands={brands}
                layout="workspace"
                activeTab={formTab ?? "overview"}
              />
            </div>

            {tab === "images" ? (
              <section className="adminEditorPanel" aria-labelledby="images-heading">
                <div className="adminEditorPanelHeader">
                  <h2 id="images-heading">Images</h2>
                  <p className="adminHint">
                    Gallery manager for hero and supporting images. Nothing is
                    auto-published.
                  </p>
                </div>
                <AdminCarGallery
                  carId={car.id}
                  carSlug={car.slug}
                  initialImages={images}
                />
              </section>
            ) : null}

            {tab === "variants" ? (
              <section className="adminEditorPanel" aria-labelledby="variants-heading">
                <div className="adminEditorPanelHeader">
                  <div>
                    <h2 id="variants-heading">Variants</h2>
                    <p className="adminHint">
                      Manage trim-level specifications for this model.
                    </p>
                  </div>
                  <Link
                    href={`/admin/biler/${car.id}/varianter`}
                    className="button secondary buttonSm"
                  >
                    Open variants page
                  </Link>
                </div>
                <AdminCarVariantsPanel
                  carId={car.id}
                  initialVariants={variants}
                />
              </section>
            ) : null}

            {tab === "history" ? <AdminCarHistoryPanel car={car} /> : null}
          </div>
        </div>

        <aside className="adminEditorSidebar" aria-label="Editorial assistant">
          <div className="adminEditorSidebarSticky">
            <AdminEditorialAssistant
              car={car}
              images={images}
              variants={variants}
              variant="sidebar"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
