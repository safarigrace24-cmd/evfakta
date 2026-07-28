"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import {
  buildCompareHref,
  buildComparisonRows,
  groupComparisonRows,
  resolveCompareCars,
  selectionKey,
  type CompareRow,
  type CompareSelection,
} from "@/lib/compare/comparison";
import { getDefaultVariant } from "@/lib/cars/variants";
import Button from "@/components/ui/button";
import Eyebrow from "@/components/ui/eyebrow";

type CompareClientProps = {
  cars: Car[];
  initialSelections: CompareSelection[];
};

function carLabel(car: Car) {
  return `${car.brand} ${car.model}`;
}

function defaultSelectionForCar(car: Car): CompareSelection {
  return {
    slug: car.slug,
    variantSlug: getDefaultVariant(car)?.slug ?? null,
  };
}

export default function CompareClient({
  cars,
  initialSelections,
}: CompareClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<CompareSelection[]>(
    initialSelections.slice(0, 3),
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCars = useMemo(
    () => resolveCompareCars(cars, selected),
    [cars, selected],
  );

  const rows = useMemo(() => buildComparisonRows(selectedCars), [selectedCars]);
  const sections = useMemo(() => groupComparisonRows(rows), [rows]);

  const popularCars = useMemo(() => cars.slice(0, 6), [cars]);

  const filteredCars = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((car) => {
      const haystack = `${car.brand} ${car.model} ${car.slug}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [cars, query]);

  function syncUrl(next: CompareSelection[]) {
    startTransition(() => {
      router.replace(buildCompareHref(next), { scroll: false });
    });
  }

  function carHasAnySelection(slug: string) {
    return selected.some((item) => item.slug === slug);
  }

  function toggleCar(car: Car) {
    setError(null);
    const selection = defaultSelectionForCar(car);
    setSelected((current) => {
      if (carHasAnySelection(car.slug)) {
        const next = current.filter((item) => item.slug !== car.slug);
        syncUrl(next);
        return next;
      }
      if (current.length >= 3) {
        setError("Du kan sammenligne maksimalt tre biler.");
        return current;
      }
      const next = [...current, selection];
      syncUrl(next);
      return next;
    });
  }

  function removeAt(index: number) {
    setError(null);
    setSelected((current) => {
      const next = current.filter((_, i) => i !== index);
      syncUrl(next);
      return next;
    });
  }

  function setVariantForSlot(index: number, variantSlug: string) {
    setSelected((current) => {
      const next = current.map((item, i) =>
        i === index ? { ...item, variantSlug: variantSlug || null } : item,
      );
      syncUrl(next);
      return next;
    });
  }

  function clearAll() {
    setError(null);
    setSelected([]);
    syncUrl([]);
  }

  if (cars.length === 0) {
    return (
      <div className="compareEmpty" role="status">
        <Eyebrow>Sammenlign</Eyebrow>
        <h1 id="compare-heading">Ingen publiserte biler</h1>
        <p>Når biler publiseres, kan du sammenligne dem her.</p>
        <Link href="/modeller" className="button primary">
          Se modeller
        </Link>
      </div>
    );
  }

  return (
    <div className="compareLayout comparePage">
      <header className="pageHeader comparePageHeader">
        <Eyebrow>Sammenlign</Eyebrow>
        <h1 id="compare-heading">Sammenlign elbiler</h1>
        <p className="lead narrow">
          Velg 2–3 publiserte modeller. Lenken oppdateres automatisk og kan deles.
          Har en bil flere varianter, velger du trim i tabellhodet.
        </p>
      </header>

      <section
        className="comparePicker"
        aria-labelledby="compare-picker-heading"
      >
        <div className="comparePickerHeader">
          <strong id="compare-picker-heading">
            Valgte biler ({selectedCars.length}/3)
            {isPending ? (
              <span className="comparePending"> Oppdaterer…</span>
            ) : null}
          </strong>
          {selected.length > 0 && (
            <button
              type="button"
              className="button ghost buttonSm"
              onClick={clearAll}
            >
              Nullstill
            </button>
          )}
        </div>

        {selectedCars.length > 0 && (
          <ul className="compareSelectedList" aria-label="Valgte modeller">
            {selectedCars.map((car, index) => {
              const selection = selected[index];
              return (
                <li key={selectionKey(selection)} className="compareSelectedCard">
                  <span className="compareSelectedThumb" aria-hidden="true">
                    {car.imageUrl ? (
                      <Image
                        src={car.imageUrl}
                        alt=""
                        width={64}
                        height={40}
                        unoptimized
                      />
                    ) : (
                      <span>{car.brand.slice(0, 1)}</span>
                    )}
                  </span>
                  <span className="compareSelectedMeta">
                    <span className="compareSelectedBrand">{car.brand}</span>
                    <strong>{car.model}</strong>
                  </span>
                  <button
                    type="button"
                    className="compareRemoveBtn"
                    onClick={() => removeAt(index)}
                    aria-label={`Fjern ${car.brand} ${car.model} fra sammenligning`}
                  >
                    Fjern
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <label className="compareSearchField">
          <span className="visuallyHidden">Søk etter modell å legge til</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk merke eller modell…"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-controls="compare-model-list"
          />
        </label>

        <ul
          id="compare-model-list"
          className="compareChipList"
          aria-label="Tilgjengelige modeller"
        >
          {filteredCars.map((car) => {
            const active = carHasAnySelection(car.slug);
            const disabled = !active && selected.length >= 3;
            return (
              <li key={car.slug}>
                <button
                  type="button"
                  className={active ? "compareChip active" : "compareChip"}
                  aria-pressed={active}
                  disabled={disabled}
                  onClick={() => toggleCar(car)}
                >
                  {carLabel(car)}
                  {active ? (
                    <span className="compareChipMark" aria-hidden="true">
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {filteredCars.length === 0 && (
          <p className="compareSearchEmpty" role="status">
            Ingen modeller matcher «{query.trim()}».
          </p>
        )}

        {error && (
          <p className="authAlert authAlertError" role="alert">
            {error}
          </p>
        )}
      </section>

      {selectedCars.length === 0 && (
        <div className="compareEmptyPanel" role="status">
          <h2>Kom i gang</h2>
          <p>
            Velg minst to biler for å starte sammenligningen. Bruk søket over,
            eller start med en populær modell.
          </p>
          <ul className="comparePopularList" aria-label="Populære modeller">
            {popularCars.map((car) => (
              <li key={car.slug}>
                <button
                  type="button"
                  className="comparePopularCard"
                  onClick={() => toggleCar(car)}
                >
                  <span className="comparePopularThumb" aria-hidden="true">
                    {car.imageUrl ? (
                      <Image
                        src={car.imageUrl}
                        alt=""
                        width={96}
                        height={60}
                        unoptimized
                      />
                    ) : (
                      <span>{car.brand.slice(0, 1)}</span>
                    )}
                  </span>
                  <span>
                    <span className="compareSelectedBrand">{car.brand}</span>
                    <strong>{car.model}</strong>
                  </span>
                  <span className="comparePopularCta">Legg til</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="compareEmptyActions">
            <Button href="/modeller" variant="secondary">
              Bla i katalog
            </Button>
          </p>
        </div>
      )}

      {selectedCars.length === 1 && (
        <div className="compareEmptyPanel" role="status">
          <h2>Velg én bil til</h2>
          <p>
            Du har valgt {selectedCars[0].brand} {selectedCars[0].model}. Legg
            til minst én modell til for å se sammenligningen.
          </p>
        </div>
      )}

      {selectedCars.length >= 2 && (
        <div
          className={`compareTableWrap${isPending ? " isPending" : ""}`}
          aria-busy={isPending}
        >
          <table className="compareTable">
            <caption className="visuallyHidden">
              Sammenligning av {selectedCars.length} elbiler
            </caption>
            <thead>
              <tr>
                <th scope="col">Spesifikasjon</th>
                {selectedCars.map((car, index) => {
                  const selection = selected[index];
                  const base = cars.find((item) => item.slug === car.slug);
                  const variants = base?.variants ?? [];
                  return (
                    <th key={selectionKey(selection)} scope="col">
                      <div className="compareCarHeadBlock">
                        <Link
                          href={
                            selection.variantSlug
                              ? `/modeller/${car.slug}?variant=${encodeURIComponent(selection.variantSlug)}`
                              : `/modeller/${car.slug}`
                          }
                          className="compareCarHead"
                        >
                          <span className="compareCarThumb">
                            {car.imageUrl ? (
                              <Image
                                src={car.imageUrl}
                                alt=""
                                width={88}
                                height={56}
                                unoptimized
                              />
                            ) : (
                              <span aria-hidden="true">{car.brand.slice(0, 1)}</span>
                            )}
                          </span>
                          <span>
                            {car.brand}
                            <br />
                            <strong>{car.model}</strong>
                            {car.variant ? (
                              <>
                                <br />
                                <span className="compareVariantLabel">{car.variant}</span>
                              </>
                            ) : null}
                          </span>
                        </Link>
                        {variants.length > 0 && (
                          <label className="compareVariantPick">
                            <span className="visuallyHidden">
                              Variant for {car.brand} {car.model}
                            </span>
                            <select
                              value={selection.variantSlug ?? ""}
                              onChange={(event) =>
                                setVariantForSlot(index, event.target.value)
                              }
                              aria-label={`Variant for ${car.brand} ${car.model}`}
                            >
                              {variants.map((variant) => (
                                <option key={variant.id} value={variant.slug}>
                                  {variant.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <button
                          type="button"
                          className="compareRemoveBtn compareRemoveBtnInline"
                          onClick={() => removeAt(index)}
                          aria-label={`Fjern ${car.brand} ${car.model}`}
                        >
                          Fjern
                        </button>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => (
                <FragmentSection
                  key={section.group}
                  label={section.label}
                  colSpan={selectedCars.length + 1}
                  rows={section.rows}
                />
              ))}
            </tbody>
          </table>
          <p className="compareHint">
            Beste tallverdi markeres med «✓ Best» når sammenligningen er
            meningsfull (f.eks. lengst rekkevidde). Manglende verdier vises som —.
          </p>
        </div>
      )}
    </div>
  );
}

function FragmentSection({
  label,
  colSpan,
  rows,
}: {
  label: string;
  colSpan: number;
  rows: CompareRow[];
}) {
  return (
    <Fragment>
      <tr className="compareGroupRow">
        <th scope="colgroup" colSpan={colSpan}>
          {label}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={row.key}>
          <th scope="row">{row.label}</th>
          {row.values.map((value, index) => {
            const isBest = row.bestIndexes.includes(index);
            return (
              <td
                key={`${row.key}-${index}`}
                className={isBest ? "compareBest" : undefined}
              >
                <span className="compareCellValue">{value}</span>
                {isBest ? (
                  <span className="compareBestLabel">
                    <span aria-hidden="true">✓ </span>
                    Best
                    <span className="visuallyHidden"> verdi i raden</span>
                  </span>
                ) : null}
              </td>
            );
          })}
        </tr>
      ))}
    </Fragment>
  );
}
