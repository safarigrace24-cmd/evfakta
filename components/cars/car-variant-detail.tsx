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

type TechRow = { label: string; value: string };

type TechGroup = {
  id: string;
  title: string;
  labels: string[];
};

const TECH_GROUPS: TechGroup[] = [
  {
    id: "identity",
    title: "Identitet",
    labels: ["Variant", "Trim", "Generasjon", "Årsmodell", "Kjøretøytype", "Karosseri"],
  },
  {
    id: "battery",
    title: "Batteri og forbruk",
    labels: ["Batteri totalt", "Batteri brukbart", "Batterikjemi", "Forbruk"],
  },
  {
    id: "charging",
    title: "Lading",
    labels: ["Ladetid 10–80 %", "AC-kontakt", "DC-kontakt"],
  },
  {
    id: "performance",
    title: "Ytelse",
    labels: ["Effekt", "Moment", "0–100 km/t", "Toppfart"],
  },
  {
    id: "practical",
    title: "Praktisk",
    labels: [
      "Seter",
      "Bagasjerom",
      "Frunk",
      "Tilhengervekt",
      "Lengde",
      "Bredde",
      "Høyde",
      "Akselavstand",
      "Egenvekt",
      "Totalvekt",
    ],
  },
  {
    id: "equipment",
    title: "Utstyr og garanti",
    labels: [
      "Varmepumpe",
      "V2L",
      "V2G",
      "Apple CarPlay",
      "Android Auto",
      "Head-up display",
      "Panoramatak",
      "OTA-oppdateringer",
      "Garanti",
    ],
  },
];

function formatOptional(value: string | number | null | undefined, suffix = "") {
  if (value == null || value === "" || value === 0) return null;
  return `${value}${suffix}`;
}

function buildTechRows(car: Car): TechRow[] {
  return [
    { label: "Variant", value: car.variant ?? null },
    { label: "Trim", value: car.trimLevel ?? null },
    { label: "Generasjon", value: car.modelGeneration ?? null },
    { label: "Årsmodell", value: formatOptional(car.year) },
    {
      label: "Batteri totalt",
      value:
        car.batteryTotalKwh != null && car.batteryTotalKwh > 0
          ? `${car.batteryTotalKwh} kWh`
          : null,
    },
    {
      label: "Batteri brukbart",
      value:
        car.batteryUsableKwh != null && car.batteryUsableKwh > 0
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
  ].filter((row): row is TechRow => Boolean(row.value));
}

function groupTechRows(rows: TechRow[]) {
  const byLabel = new Map(rows.map((row) => [row.label, row]));
  const grouped = TECH_GROUPS.map((group) => ({
    ...group,
    rows: group.labels
      .map((label) => byLabel.get(label))
      .filter((row): row is TechRow => Boolean(row)),
  })).filter((group) => group.rows.length > 0);

  const groupedLabels = new Set(TECH_GROUPS.flatMap((group) => group.labels));
  const leftovers = rows.filter((row) => !groupedLabels.has(row.label));
  if (leftovers.length > 0) {
    grouped.push({
      id: "other",
      title: "Øvrig",
      labels: leftovers.map((row) => row.label),
      rows: leftovers,
    });
  }
  return grouped;
}

function ListBlock({
  title,
  items,
  id,
  className = "",
}: {
  title: string;
  items: string[];
  id: string;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <section
      className={`detailListSection modelContentCard ${className}`.trim()}
      aria-labelledby={id}
    >
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

  const consumptionValue =
    display.consumptionKwh100km != null && display.consumptionKwh100km > 0
      ? `${display.consumptionKwh100km} kWh/100 km`
      : null;

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
          : null,
    },
    {
      label: "AC-kontakt",
      value: display.chargingConnectorAc || null,
    },
    {
      label: "DC-kontakt",
      value: display.chargingConnectorDc || null,
    },
  ].filter((fact): fact is { label: string; value: string } =>
    Boolean(fact.value && fact.value !== "—"),
  );

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
    ...(consumptionValue
      ? [{ label: "Forbruk", value: consumptionValue }]
      : []),
    { label: "AC-lading", value: formatKw(display.acKw) },
    { label: "Drivlinje", value: display.drive },
  ].filter((fact) => fact.value && fact.value !== "—");

  const techGroups = useMemo(
    () => groupTechRows(buildTechRows(display)),
    [display],
  );

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

  const selectedVariantName =
    variants.find((variant) => variant.slug === selectedSlug)?.name ?? null;

  return (
    <div className="modelDetail">
      <div className="modelHero">
        <div className="modelHeroMedia">
          <CarGallery car={car} />
        </div>

        <aside className="modelHeroAside" aria-labelledby="model-heading">
          <div className="modelHeroIdentity">
            <Eyebrow>{car.brand}</Eyebrow>
            <h1 id="model-heading">
              {car.model}
              {car.year ? <span className="carYear"> ({car.year})</span> : null}
            </h1>
            {selectedVariantName ? (
              <p className="modelVariantMeta">{selectedVariantName}</p>
            ) : display.drive ? (
              <p className="modelVariantMeta">{display.drive}</p>
            ) : null}
            {hasRenderablePublicCopy(description) && (
              <p className="lead narrow modelHeroLead">{description}</p>
            )}
          </div>

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

          {keyFacts.length > 0 && (
            <div className="modelKeyFacts">
              <h2 id="key-facts-heading" className="visuallyHidden">
                Nøkkeltall
              </h2>
              <FactGrid facts={keyFacts} labelledBy="key-facts-heading" />
            </div>
          )}

          <div className="detailHeaderActions modelHeroActions">
            <Button href={compareHref} variant="primary">
              Sammenlign
            </Button>
            <FavoriteButton
              carSlug={car.slug}
              initialIsFavorite={isFavorite}
              isLoggedIn={isLoggedIn}
              variant="labeled"
            />
          </div>
        </aside>
      </div>

      {(pros.length > 0 || cons.length > 0) && (
        <div className="modelProsCons">
          <ListBlock title="Fordeler" items={pros} id="pros-heading" className="isPros" />
          <ListBlock title="Ulemper" items={cons} id="cons-heading" className="isCons" />
        </div>
      )}

      <ListBlock title="Passer for" items={suitableFor} id="suitable-heading" />

      {chargeFacts.length > 0 && (
        <section
          className="detailListSection modelContentCard"
          aria-labelledby="charging-heading"
        >
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
        <section
          className="detailListSection modelContentCard"
          aria-labelledby="winter-heading"
        >
          <h2 id="winter-heading">Vinter</h2>
          <p className="modelWinterLine">
            <span>Vinterrekkevidde</span>
            <strong>{winterRange}</strong>
          </p>
        </section>
      )}

      {techGroups.length > 0 && (
        <section className="techSection modelTechSection" aria-labelledby="tech-heading">
          <h2 id="tech-heading">Tekniske data</h2>
          <div className="modelTechGroups">
            {techGroups.map((group) => (
              <section
                key={group.id}
                className="modelTechGroup"
                aria-labelledby={`tech-group-${group.id}`}
              >
                <h3 id={`tech-group-${group.id}`}>{group.title}</h3>
                <dl className="techList">
                  {group.rows.map((row) => (
                    <div key={row.label} className="techRow">
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
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

      <aside className="sourceBox modelSourceBox" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Kilder og oppdatering</h2>
        <dl className="modelSourceMeta">
          <div>
            <dt>Sist oppdatert</dt>
            <dd>{car.updated}</dd>
          </div>
          {display.dataLastCheckedAt ? (
            <div>
              <dt>Sist sjekket</dt>
              <dd>{display.dataLastCheckedAt}</dd>
            </div>
          ) : null}
          {(display.sourceName || display.sourceUrl) && (
            <div>
              <dt>Kilde</dt>
              <dd>
                {display.sourceUrl ? (
                  <a href={display.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {display.sourceName || display.sourceUrl}
                  </a>
                ) : (
                  display.sourceName
                )}
              </dd>
            </div>
          )}
        </dl>
        {!display.sourceName && !display.sourceUrl && (
          <p>
            Kontroller tall mot norske produsentkilder før du stoler på dem.
          </p>
        )}
      </aside>
    </div>
  );
}
