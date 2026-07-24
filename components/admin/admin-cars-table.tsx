import Link from "next/link";
import type { AdminCar } from "@/lib/admin/types";
import DeleteCarButton from "@/components/admin/delete-car-button";
import PublishToggleButton from "@/components/admin/publish-toggle-button";

type AdminCarsTableProps = {
  cars: AdminCar[];
};

export default function AdminCarsTable({ cars }: AdminCarsTableProps) {
  if (cars.length === 0) {
    return <p className="adminEmpty">Ingen biler i databasen ennå.</p>;
  }

  return (
    <div className="adminTableWrap">
      <table className="adminTable">
        <thead>
          <tr>
            <th>Merke</th>
            <th>Modell</th>
            <th>År</th>
            <th>Slug</th>
            <th>Status</th>
            <th>Handlinger</th>
          </tr>
        </thead>
        <tbody>
          {cars.map((car) => (
            <tr key={car.id}>
              <td>{car.brand}</td>
              <td>{car.model}</td>
              <td>{car.year ?? "—"}</td>
              <td>
                <code className="adminSlug">{car.slug}</code>
              </td>
              <td>
                <span
                  className={`adminStatusBadge ${car.is_published ? "isPublished" : "isDraft"}`}
                >
                  {car.is_published ? "Publisert" : "Utkast"}
                </span>
              </td>
              <td>
                <div className="adminRowActions">
                  <Link
                    href={`/admin/biler/${car.id}/rediger`}
                    className="button secondary buttonSm"
                  >
                    Rediger
                  </Link>
                  <PublishToggleButton id={car.id} isPublished={car.is_published} />
                  <DeleteCarButton id={car.id} label={`${car.brand} ${car.model}`} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
