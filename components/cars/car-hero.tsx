import type { Car } from "@/data/cars";

type CarHeroProps = {
  car: Car;
};

export default function CarHero({ car }: CarHeroProps) {
  return (
    <div className="detailHero">
      <div className="detailHeroGlow" aria-hidden="true" />
      <span className="detailHeroLetter" aria-hidden="true">
        {car.brand.slice(0, 1)}
      </span>
      <div className="detailHeroMeta">
        <span>{car.drive}</span>
        <span>Oppdatert {car.updated}</span>
      </div>
    </div>
  );
}
