import Link from "next/link";
import type { Car } from "@/data/cars";
import { withDefaultVariantSpecs } from "@/lib/cars/variants";
import { formatKm, formatKwh, formatKw, formatNok } from "@/lib/format";
import { PUBLIC_SHOW_PRICES } from "@/lib/public/display-policy";
import Badge from "@/components/ui/badge";
import FavoriteButton from "@/components/favorites/favorite-button";
import CarImage from "./car-image";

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
  const Heading = variant === "compact" ? "h3" : "h2";
  const defaultVariant =
    car.variants?.find((item) => item.isDefault) ?? car.variants?.[0] ?? null;
  const modelLabel = defaultVariant?.name || car.variant || car.model;

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
          <Heading>{modelLabel}</Heading>
          <div className="specRow">
            <span>
              <small>Rekkevidde</small>
              <b className="specAccentTeal">{formatKm(display.rangeKm)}</b>
            </span>
            <span className="specDivider" aria-hidden="true" />
            <span>
              <small>Hurtiglading</small>
              <b className="specAccentSky">{formatKw(display.dcKw)}</b>
            </span>
            <span className="specDivider" aria-hidden="true" />
            <span>
              <small>Forbruk</small>
              <b>{formatKwh(display.consumptionKwh100km ?? 0)}</b>
            </span>
          </div>
          {variant === "full" && PUBLIC_SHOW_PRICES && (
            <strong className="carPrice">Fra {formatNok(display.priceNok)}</strong>
          )}
          <span className="carCardCta">Se fakta →</span>
        </div>
      </Link>
    </article>
  );
}
