import Link from "next/link";
import type { Car } from "@/data/cars";
import CarImage from "@/components/cars/car-image";

type FavoriteCarsListProps = {
  cars: Car[];
};

export default function FavoriteCarsList({ cars }: FavoriteCarsListProps) {
  if (cars.length === 0) {
    return <p className="favoritesEmpty">Du har ingen favorittbiler ennå.</p>;
  }

  return (
    <ul className="favoritesList">
      {cars.map((car) => (
        <li key={car.slug}>
          <Link className="favoriteCarItem" href={`/modeller/${car.slug}`}>
            <div className="favoriteCarImage">
              <CarImage car={car} variant="card" />
            </div>
            <div className="favoriteCarMeta">
              <span className="carBrand">{car.brand}</span>
              <strong>{car.model}</strong>
              <span className="favoriteCarLink">Se detaljer →</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
