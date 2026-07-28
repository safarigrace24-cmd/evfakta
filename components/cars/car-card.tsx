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

function omitDash(
  items: Array<{ value: string; label: string }>,
): Array<{ value: string; label: string }> {
  return items.filter((item) => item.value && item.value !== "—");
}

export default function CarCard({
  car,
  variant = "full",
  isLoggedIn = false,
  isFavorite = false,
}: CarCardProps) {
  const display = withDefaultVariantSpecs(car);
  const consumption =
    display.consumptionKwh100km != null && display.consumptionKwh100km > 0
      ? `${display.consumptionKwh100km} kWh/100 km`
      : null;

  const specs =
    variant === "compact"
      ? omitDash([
          { value: formatKm(display.rangeKm), label: "WLTP" },
          { value: formatKw(display.dcKw), label: "DC-lading" },
          ...(PUBLIC_SHOW_PRICES
            ? [{ value: formatNok(display.priceNok), label: "Fra pris" }]
            : consumption
              ? [{ value: consumption, label: "Forbruk" }]
              : [{ value: formatKwh(display.batteryKwh), label: "Batteri" }]),
        ])
      : omitDash([
          { value: formatKm(display.rangeKm), label: "WLTP" },
          { value: formatKw(display.dcKw), label: "DC-lading" },
          ...(consumption
            ? [{ value: consumption, label: "Forbruk" }]
            : [{ value: formatKwh(display.batteryKwh), label: "Batteri" }]),
        ]);

  // Catalog / list contexts sit under a page h1 — keep card titles as h3.
  const Heading = "h3";
  const altBrand = car.brand;
  const altModel = car.model;
  const driveLabel = display.drive?.trim() || "";

  return (
    <article className={`carCard carCard--${variant}`}>
      <FavoriteButton
        carSlug={car.slug}
        initialIsFavorite={isFavorite}
        isLoggedIn={isLoggedIn}
        variant="icon"
      />
      <Link
        className="carCardLink"
        href={`/modeller/${car.slug}`}
        aria-label={`${altBrand} ${altModel} – se fakta`}
      >
        <div className="carCardTop">
          <div className="carVisual">
            <CarImage car={car} variant="card" />
          </div>
          {driveLabel ? <Badge>{driveLabel}</Badge> : null}
        </div>
        <div className="carCardBody">
          <span className="carBrand">{car.brand}</span>
          <Heading>
            {car.model}
            {car.year ? <span className="carYear"> ({car.year})</span> : null}
          </Heading>
          {driveLabel && variant === "full" ? (
            <p className="carDriveMeta">{driveLabel}</p>
          ) : null}
          {specs.length > 0 ? <SpecRow items={specs} /> : null}
          {variant === "full" && PUBLIC_SHOW_PRICES && display.priceNok > 0 && (
            <strong className="carPrice">Fra {formatNok(display.priceNok)}</strong>
          )}
          <span className="carCardCta" aria-hidden="true">
            Se fakta →
          </span>
        </div>
      </Link>
    </article>
  );
}
