import Link from "next/link";
import type { Car } from "@/data/cars";
import { formatKm, formatKwh, formatKw, formatNok } from "@/lib/format";
import Badge from "@/components/ui/badge";
import SpecRow from "./spec-row";

type CarCardProps = {
  car: Car;
  variant?: "compact" | "full";
};

export default function CarCard({ car, variant = "full" }: CarCardProps) {
  const specs =
    variant === "compact"
      ? [
          { value: formatKm(car.rangeKm), label: "WLTP" },
          { value: formatKw(car.dcKw), label: "DC-lading" },
          { value: formatNok(car.priceNok), label: "Fra pris" },
        ]
      : [
          { value: formatKm(car.rangeKm), label: "WLTP" },
          { value: formatKwh(car.batteryKwh), label: "Batteri" },
          { value: formatKw(car.dcKw), label: "DC-lading" },
        ];

  const Heading = variant === "compact" ? "h3" : "h2";

  return (
    <Link className="carCard" href={`/modeller/${car.slug}`}>
      <div className="carCardTop">
        <div className="carVisual" aria-hidden="true">
          <span>{car.brand.slice(0, 1)}</span>
        </div>
        <Badge>{car.drive}</Badge>
      </div>
      <div className="carCardBody">
        <span className="carBrand">{car.brand}</span>
        <Heading>{car.model}</Heading>
        <SpecRow items={specs} />
        {variant === "full" && (
          <strong className="carPrice">Fra {formatNok(car.priceNok)}</strong>
        )}
      </div>
      <span className="carCardArrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
