import Image from "next/image";
import Link from "next/link";
import type { AdminBrand } from "@/lib/admin/brand-types";
import BrandActiveToggleButton from "@/components/admin/brand-active-toggle-button";
import DeleteBrandButton from "@/components/admin/delete-brand-button";

type AdminBrandsTableProps = {
  brands: AdminBrand[];
};

export default function AdminBrandsTable({ brands }: AdminBrandsTableProps) {
  if (brands.length === 0) {
    return (
      <div className="adminEmpty">
        <p>Ingen merker ennå.</p>
        <Link href="/admin/merker/ny" className="button primary">
          Legg til merke
        </Link>
      </div>
    );
  }

  return (
    <div className="adminTableWrap">
      <table className="adminTable">
        <thead>
          <tr>
            <th>Logo</th>
            <th>Merke</th>
            <th>Slug</th>
            <th>Land</th>
            <th>Status</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {brands.map((brand) => (
            <tr key={brand.id}>
              <td>
                <div className="adminBrandLogoCell">
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt=""
                      width={40}
                      height={40}
                      unoptimized
                      className="adminBrandLogoThumb"
                    />
                  ) : (
                    <span className="adminBrandLogoFallback" aria-hidden="true">
                      {brand.name.slice(0, 1)}
                    </span>
                  )}
                </div>
              </td>
              <td>
                <strong>{brand.name}</strong>
              </td>
              <td>
                <code className="adminSlug">{brand.slug}</code>
              </td>
              <td>{brand.country?.trim() || "—"}</td>
              <td>
                <span
                  className={
                    brand.is_active
                      ? "adminStatusBadge isPublished"
                      : "adminStatusBadge isDraft"
                  }
                >
                  {brand.is_active ? "Aktiv" : "Inaktiv"}
                </span>
              </td>
              <td>
                <div className="adminRowActions">
                  <Link
                    href={`/admin/merker/${brand.id}/rediger`}
                    className="button secondary buttonSm"
                  >
                    Rediger
                  </Link>
                  <BrandActiveToggleButton id={brand.id} isActive={brand.is_active} />
                  <DeleteBrandButton id={brand.id} label={brand.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
