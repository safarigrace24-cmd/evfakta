import type { Car } from "@/data/cars";
import CarImage from "./car-image";

type CarHeroProps = {
  car: Car;
};

export default function CarHero({ car }: CarHeroProps) {
  return (
    <div className="detailHero">
      <div className="detailHeroGlow" aria-hidden="true" />
      <CarImage car={car} variant="hero" priority />
      <div className="detailHeroMeta">
        <span>{car.drive}</span>
        <span>Oppdatert {car.updated}</span>
      </div>
    </div>
  );
}
