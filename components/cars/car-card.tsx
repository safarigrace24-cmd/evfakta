import Link from "next/link";
import type { Car } from "@/data/cars";
import { withDefaultVariantSpecs } from "@/lib/cars/variants";
import { formatKm, formatKwh, formatKw, formatNok } from "@/lib/format";
import { PUBLIC_SHOW_PRICES } from "@/lib/public/display-policy";
import Badge from "@/components/ui/badge";
import FavoriteButton from "@/components/favorites/favorite-button";
import CarImage from "./car-image";
import SpecRow from "./spec-row";

type CarCardProps = {
  car: Car;
  variant?: "compact" | "full";
  isLoggedIn?: boolean;
  isFavorite?: boolean;
};

export default function CarCard({
  car,
  variant = "full",
  isLoggedIn = false,
  isFavorite = false,
}: CarCardProps) {
  const display = withDefaultVariantSpecs(car);
  const specs =
    variant === "compact"
      ? [
          { value: formatKm(display.rangeKm), label: "WLTP" },
          { value: formatKw(display.dcKw), label: "DC-lading" },
          ...(PUBLIC_SHOW_PRICES
            ? [{ value: formatNok(display.priceNok), label: "Fra pris" }]
            : [{ value: display.drive, label: "Drivhjul" }]),
        ]
      : [
          { value: formatKm(display.rangeKm), label: "WLTP" },
          { value: formatKwh(display.batteryKwh), label: "Batteri" },
          { value: formatKw(display.dcKw), label: "DC-lading" },
        ];

  const Heading = variant === "compact" ? "h3" : "h2";

  return (
    <article className="carCard">
      <FavoriteButton
        carSlug={car.slug}
        initialIsFavorite={isFavorite}
        isLoggedIn={isLoggedIn}
        variant="icon"
      />
      <Link className="carCardLink" href={`/modeller/${car.slug}`}>
        <div className="carCardTop">
          <div className="carVisual">
            <CarImage car={car} variant="card" />
          </div>
          <Badge>{display.drive}</Badge>
        </div>
        <div className="carCardBody">
          <span className="carBrand">{car.brand}</span>
          <Heading>{car.model}</Heading>
          <SpecRow items={specs} />
          {variant === "full" && PUBLIC_SHOW_PRICES && (
            <strong className="carPrice">Fra {formatNok(display.priceNok)}</strong>
          )}
        </div>
        <span className="carCardArrow" aria-hidden="true">
          →
        </span>
      </Link>
    </article>
  );
}
