"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import { formatBoolNb, formatTextList } from "@/lib/admin/field-parsers";
import {
  applyVariantToCar,
  resolveVariantSlug,
} from "@/lib/cars/variants";
import {
  formatKm,
  formatKwh,
  formatKw,
  formatNok,
} from "@/lib/format";
import { buildCompareHref } from "@/lib/compare/comparison";
import {
  PUBLIC_SHOW_PRICES,
  PUBLIC_SHOW_SCORES,
} from "@/lib/public/display-policy";
import {
  sanitizePublicText,
  sanitizePublicTextList,
} from "@/lib/public/sanitize-public-copy";
import FavoriteButton from "@/components/favorites/favorite-button";
import CarGallery from "@/components/cars/car-gallery";
import FactGrid from "@/components/cars/fact-grid";
import EvfaktaScore from "@/components/cars/evfakta-score";
import Button from "@/components/ui/button";
import Eyebrow from "@/components/ui/eyebrow";

type CarVariantDetailProps = {
  car: Car;
  initialVariantSlug?: string | null;
  isFavorite: boolean;
  isLoggedIn: boolean;
};

function formatOptional(value: string | number | null | undefined, suffix = "") {
  if (value == null || value === "" || value === 0) return null;
  return `${value}${suffix}`;
}

function buildTechRows(car: Car): Array<{ label: string; value: string | null }> {
  return [
    { label: "Variant", value: car.variant ?? null },
    { label: "Trim", value: car.trimLevel ?? null },
    { label: "Generasjon", value: car.modelGeneration ?? null },
    { label: "Årsmodell", value: formatOptional(car.year) },
    {
      label: "Batteri totalt",
      value: car.batteryTotalKwh != null ? `${car.batteryTotalKwh} kWh` : null,
    },
    {
      label: "Batteri brukbart",
      value: car.batteryUsableKwh != null ? `${car.batteryUsableKwh} kWh` : null,
    },
    { label: "Batterikjemi", value: car.batteryChemistry ?? null },
    {
      label: "Vinterrekkevidde",
      value: car.winterRangeKm != null ? `${car.winterRangeKm} km` : null,
    },
    {
      label: "Real-world rekkevidde",
      value: car.realWorldRangeKm != null ? `${car.realWorldRangeKm} km` : null,
    },
    {
      label: "Forbruk",
      value:
        car.consumptionKwh100km != null
          ? `${car.consumptionKwh100km} kWh/100 km`
          : null,
    },
    {
      label: "Ladetid 10–80 %",
      value:
        car.chargeTime1080Minutes != null
          ? `${car.chargeTime1080Minutes} min`
          : null,
    },
    { label: "AC-kontakt", value: car.chargingConnectorAc ?? null },
    { label: "DC-kontakt", value: car.chargingConnectorDc ?? null },
    { label: "Effekt", value: car.powerHp != null ? `${car.powerHp} hk` : null },
    { label: "Moment", value: car.torqueNm != null ? `${car.torqueNm} Nm` : null },
    {
      label: "0–100 km/t",
      value: car.acceleration0100 != null ? `${car.acceleration0100} s` : null,
    },
    {
      label: "Toppfart",
      value: car.topSpeedKmh != null ? `${car.topSpeedKmh} km/t` : null,
    },
    { label: "Seter", value: formatOptional(car.seats) },
    { label: "Bagasjerom", value: car.cargoL != null ? `${car.cargoL} l` : null },
    { label: "Frunk", value: car.frunkL != null ? `${car.frunkL} l` : null },
    {
      label: "Tilhengervekt",
      value: car.towingKg != null ? `${car.towingKg} kg` : null,
    },
    { label: "Lengde", value: car.lengthMm != null ? `${car.lengthMm} mm` : null },
    { label: "Bredde", value: car.widthMm != null ? `${car.widthMm} mm` : null },
    { label: "Høyde", value: car.heightMm != null ? `${car.heightMm} mm` : null },
    {
      label: "Akselavstand",
      value: car.wheelbaseMm != null ? `${car.wheelbaseMm} mm` : null,
    },
    {
      label: "Egenvekt",
      value: car.curbWeightKg != null ? `${car.curbWeightKg} kg` : null,
    },
    {
      label: "Totalvekt",
      value: car.grossWeightKg != null ? `${car.grossWeightKg} kg` : null,
    },
    { label: "Varmepumpe", value: formatBoolNb(car.heatPump) },
    { label: "V2L", value: formatBoolNb(car.v2l) },
    { label: "V2G", value: formatBoolNb(car.v2g) },
    { label: "Apple CarPlay", value: formatBoolNb(car.appleCarplay) },
    { label: "Android Auto", value: formatBoolNb(car.androidAuto) },
    { label: "Head-up display", value: formatBoolNb(car.headUpDisplay) },
    { label: "Panoramatak", value: formatBoolNb(car.panoramicRoof) },
    { label: "OTA-oppdateringer", value: formatBoolNb(car.otaUpdates) },
    { label: "Garanti", value: car.warranty ?? null },
    { label: "Kjøretøytype", value: car.vehicleType ?? null },
    { label: "Karosseri", value: car.bodyStyle ?? null },
    {
      label: "Fordeler",
      value: formatTextList(sanitizePublicTextList(car.pros)),
    },
    {
      label: "Ulemper",
      value: formatTextList(sanitizePublicTextList(car.cons)),
    },
    {
      label: "Passer for",
      value: formatTextList(sanitizePublicTextList(car.suitableFor)),
    },
  ].filter((row) => row.value);
}

export default function CarVariantDetail({
  car,
  initialVariantSlug = null,
  isFavorite,
  isLoggedIn,
}: CarVariantDetailProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const variants = car.variants ?? [];
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() =>
    resolveVariantSlug(car, initialVariantSlug),
  );

  const display = useMemo(
    () => applyVariantToCar(car, selectedSlug),
    [car, selectedSlug],
  );
  const publicDescription = useMemo(
    () => sanitizePublicText(car.description),
    [car.description],
  );

  const keyFacts = [
    ...(PUBLIC_SHOW_PRICES
      ? [{ label: "Pris fra", value: formatNok(display.priceNok), highlight: true }]
      : []),
    { label: "WLTP-rekkevidde", value: formatKm(display.rangeKm), highlight: !PUBLIC_SHOW_PRICES },
    { label: "Batteri", value: formatKwh(display.batteryKwh) },
    { label: "DC-lading", value: formatKw(display.dcKw) },
    { label: "AC-lading", value: formatKw(display.acKw) },
    { label: "Drivhjul", value: display.drive },
  ];

  const techRows = useMemo(() => buildTechRows(display), [display]);

  const compareHref = buildCompareHref([
    {
      slug: car.slug,
      variantSlug: selectedSlug,
    },
  ]);

  function selectVariant(nextSlug: string) {
    setSelectedSlug(nextSlug);
    const params = new URLSearchParams();
    const defaultSlug = resolveVariantSlug(car, null);
    if (nextSlug && nextSlug !== defaultSlug) {
      params.set("variant", nextSlug);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(
        query ? `/modeller/${car.slug}?${query}` : `/modeller/${car.slug}`,
        { scroll: false },
      );
    });
  }

  return (
    <>
      <div className="detailHeader">
        <Eyebrow>{car.brand}</Eyebrow>
        <h1>{car.model}</h1>
        {publicDescription ? (
          <p className="lead narrow">{publicDescription}</p>
        ) : null}

        {variants.length > 0 && (
          <div className="variantSelector" role="group" aria-label="Velg variant">
            <label className="variantSelectorLabel" htmlFor="variant-select">
              Variant
            </label>
            <select
              id="variant-select"
              className="variantSelect"
              value={selectedSlug ?? ""}
              onChange={(event) => selectVariant(event.target.value)}
            >
              {variants.map((variant) => (
                <option key={variant.id} value={variant.slug}>
                  {variant.name}
                  {variant.isDefault ? " (standard)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="detailHeaderActions">
          <FavoriteButton
            carSlug={car.slug}
            initialIsFavorite={isFavorite}
            isLoggedIn={isLoggedIn}
            variant="labeled"
          />
          <Button href={compareHref} variant="secondary">
            Sammenlign
          </Button>
        </div>
      </div>

      <div className="detailGrid">
        <CarGallery car={car} />
        <FactGrid facts={keyFacts} />
      </div>

      {techRows.length > 0 && (
        <section className="techSection" aria-labelledby="tech-heading">
          <h2 id="tech-heading">Tekniske data</h2>
          <dl className="techList">
            {techRows.map((row) => (
              <div key={row.label} className="techRow">
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {PUBLIC_SHOW_SCORES && <EvfaktaScore car={display} />}

      <div className="detailActions">
        <Button href={compareHref} variant="primary">
          Sammenlign med andre
        </Button>
        <Button href="/modeller" variant="secondary">
          Alle modeller
        </Button>
      </div>

      <div className="sourceBox">
        <strong>Kilder og oppdatering</strong>
        <p>
          Sist oppdatert i databasen: {car.updated}.
          {display.dataLastCheckedAt
            ? ` Sist sjekket: ${display.dataLastCheckedAt}.`
            : ""}
        </p>
        {(display.sourceName || display.sourceUrl) && (
          <p>
            Kilde:{" "}
            {display.sourceUrl ? (
              <a href={display.sourceUrl} target="_blank" rel="noreferrer">
                {display.sourceName || display.sourceUrl}
              </a>
            ) : (
              display.sourceName
            )}
          </p>
        )}
        {!display.sourceName && !display.sourceUrl && (
          <p>Kontroller tall mot norske produsentkilder før du stoler på dem.</p>
        )}
      </div>
    </>
  );
}
