import type { Car } from "@/data/cars";
import CarCard from "./car-card";

type CarGridProps = {
  cars: Car[];
  variant?: "compact" | "full";
};

export default function CarGrid({ cars, variant = "full" }: CarGridProps) {
  return (
    <div className="cardGrid">
      {cars.map((car) => (
        <CarCard key={car.slug} car={car} variant={variant} />
      ))}
    </div>
  );
}
