"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import { formatBoolNb } from "@/lib/admin/field-parsers";
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
  hasRenderablePublicCopy,
  sanitizePublicCopy,
  sanitizePublicList,
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
      value: car.batteryTotalKwh != null && car.batteryTotalKwh > 0
        ? `${car.batteryTotalKwh} kWh`
        : null,
    },
    {
      label: "Batteri brukbart",
      value: car.batteryUsableKwh != null && car.batteryUsableKwh > 0
        ? `${car.batteryUsableKwh} kWh`
        : null,
    },
    { label: "Batterikjemi", value: car.batteryChemistry ?? null },
    {
      label: "Forbruk",
      value:
        car.consumptionKwh100km != null && car.consumptionKwh100km > 0
          ? `${car.consumptionKwh100km} kWh/100 km`
          : null,
    },
    {
      label: "Ladetid 10–80 %",
      value:
        car.chargeTime1080Minutes != null && car.chargeTime1080Minutes > 0
          ? `${car.chargeTime1080Minutes} min`
          : null,
    },
    { label: "AC-kontakt", value: car.chargingConnectorAc ?? null },
    { label: "DC-kontakt", value: car.chargingConnectorDc ?? null },
    {
      label: "Effekt",
      value: car.powerHp != null && car.powerHp > 0 ? `${car.powerHp} hk` : null,
    },
    {
      label: "Moment",
      value: car.torqueNm != null && car.torqueNm > 0 ? `${car.torqueNm} Nm` : null,
    },
    {
      label: "0–100 km/t",
      value:
        car.acceleration0100 != null && car.acceleration0100 > 0
          ? `${car.acceleration0100} s`
          : null,
    },
    {
      label: "Toppfart",
      value:
        car.topSpeedKmh != null && car.topSpeedKmh > 0
          ? `${car.topSpeedKmh} km/t`
          : null,
    },
    { label: "Seter", value: formatOptional(car.seats) },
    {
      label: "Bagasjerom",
      value: car.cargoL != null && car.cargoL > 0 ? `${car.cargoL} l` : null,
    },
    {
      label: "Frunk",
      value: car.frunkL != null && car.frunkL > 0 ? `${car.frunkL} l` : null,
    },
    {
      label: "Tilhengervekt",
      value: car.towingKg != null && car.towingKg > 0 ? `${car.towingKg} kg` : null,
    },
    {
      label: "Lengde",
      value: car.lengthMm != null && car.lengthMm > 0 ? `${car.lengthMm} mm` : null,
    },
    {
      label: "Bredde",
      value: car.widthMm != null && car.widthMm > 0 ? `${car.widthMm} mm` : null,
    },
    {
      label: "Høyde",
      value: car.heightMm != null && car.heightMm > 0 ? `${car.heightMm} mm` : null,
    },
    {
      label: "Akselavstand",
      value:
        car.wheelbaseMm != null && car.wheelbaseMm > 0
          ? `${car.wheelbaseMm} mm`
          : null,
    },
    {
      label: "Egenvekt",
      value:
        car.curbWeightKg != null && car.curbWeightKg > 0
          ? `${car.curbWeightKg} kg`
          : null,
    },
    {
      label: "Totalvekt",
      value:
        car.grossWeightKg != null && car.grossWeightKg > 0
          ? `${car.grossWeightKg} kg`
          : null,
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
  ].filter((row) => row.value);
}

function ListBlock({
  title,
  items,
  id,
}: {
  title: string;
  items: string[];
  id: string;
}) {
  if (items.length === 0) return null;
  return (
    <section className="detailListSection" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
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

  const description = sanitizePublicCopy(display.description);
  const pros = sanitizePublicList(display.pros);
  const cons = sanitizePublicList(display.cons);
  const suitableFor = sanitizePublicList(display.suitableFor);

  const winterRange =
    display.winterRangeKm != null && display.winterRangeKm > 0
      ? `${display.winterRangeKm} km`
      : null;
  const showWinter = Boolean(winterRange);

  const chargeFacts = [
    {
      label: "DC-lading",
      value: formatKw(display.dcKw),
    },
    {
      label: "AC-lading",
      value: formatKw(display.acKw),
    },
    {
      label: "Ladetid 10–80 %",
      value:
        display.chargeTime1080Minutes != null && display.chargeTime1080Minutes > 0
          ? `${display.chargeTime1080Minutes} min`
          : "—",
    },
    {
      label: "AC-kontakt",
      value: display.chargingConnectorAc || "—",
    },
    {
      label: "DC-kontakt",
      value: display.chargingConnectorDc || "—",
    },
  ].filter((fact) => fact.value !== "—");

  const keyFacts = [
    ...(PUBLIC_SHOW_PRICES && display.priceNok > 0
      ? [{ label: "Pris fra", value: formatNok(display.priceNok), highlight: true }]
      : []),
    {
      label: "WLTP-rekkevidde",
      value: formatKm(display.rangeKm),
      highlight: !PUBLIC_SHOW_PRICES,
    },
    { label: "Batteri", value: formatKwh(display.batteryKwh) },
    { label: "DC-lading", value: formatKw(display.dcKw) },
    { label: "AC-lading", value: formatKw(display.acKw) },
    { label: "Drivhjul", value: display.drive },
  ].filter((fact) => fact.value && fact.value !== "—");

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
        {hasRenderablePublicCopy(description) && (
          <p className="lead narrow">{description}</p>
        )}

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
        {keyFacts.length > 0 && <FactGrid facts={keyFacts} />}
      </div>

      <ListBlock title="Fordeler" items={pros} id="pros-heading" />
      <ListBlock title="Ulemper" items={cons} id="cons-heading" />
      <ListBlock title="Passer for" items={suitableFor} id="suitable-heading" />

      {chargeFacts.length > 0 && (
        <section className="detailListSection" aria-labelledby="charging-heading">
          <h2 id="charging-heading">Lading</h2>
          <dl className="techList">
            {chargeFacts.map((fact) => (
              <div key={fact.label} className="techRow">
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {showWinter && winterRange && (
        <section className="detailListSection" aria-labelledby="winter-heading">
          <h2 id="winter-heading">Vinter</h2>
          <p>
            <strong>Vinterrekkevidde:</strong> {winterRange}
          </p>
        </section>
      )}

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
