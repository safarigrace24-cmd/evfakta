import type { Car } from "@/data/cars";
import CarCard from "./car-card";

type CarGridProps = {
  cars: Car[];
  variant?: "compact" | "full";
  isLoggedIn?: boolean;
  favoriteSlugs?: string[];
};

export default function CarGrid({
  cars,
  variant = "full",
  isLoggedIn = false,
  favoriteSlugs = [],
}: CarGridProps) {
  const favoriteSet = new Set(favoriteSlugs);

  return (
    <div className="cardGrid">
      {cars.map((car) => (
        <CarCard
          key={car.slug}
          car={car}
          variant={variant}
          isLoggedIn={isLoggedIn}
          isFavorite={favoriteSet.has(car.slug)}
        />
      ))}
    </div>
  );
}
