"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import {
  buildCompareHref,
  buildComparisonRows,
  resolveCompareCars,
  selectionKey,
  type CompareSelection,
} from "@/lib/compare/comparison";
import { getDefaultVariant } from "@/lib/cars/variants";
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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCars = useMemo(
    () => resolveCompareCars(cars, selected),
    [cars, selected],
  );

  const rows = useMemo(() => buildComparisonRows(selectedCars), [selectedCars]);

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
        <h1>Ingen publiserte biler</h1>
        <p>Når biler publiseres, kan du sammenligne dem her.</p>
        <Link href="/modeller" className="button primary">
          Se modeller
        </Link>
      </div>
    );
  }

  return (
    <div className="compareLayout">
      <div className="pageHeader">
        <Eyebrow>Sammenlign</Eyebrow>
        <h1>Sammenlign elbiler</h1>
        <p className="lead narrow">
          Velg 2–3 publiserte modeller. Lenken oppdateres automatisk og kan deles.
          Har en bil flere varianter, velger du trim under tabellen.
        </p>
      </div>

      <div className="comparePicker">
        <div className="comparePickerHeader">
          <strong>
            Valgte biler ({selectedCars.length}/3)
            {isPending ? " …" : ""}
          </strong>
          {selected.length > 0 && (
            <button type="button" className="button ghost buttonSm" onClick={clearAll}>
              Nullstill
            </button>
          )}
        </div>

        <ul className="compareChipList">
          {cars.map((car) => {
            const active = carHasAnySelection(car.slug);
            return (
              <li key={car.slug}>
                <button
                  type="button"
                  className={active ? "compareChip active" : "compareChip"}
                  aria-pressed={active}
                  onClick={() => toggleCar(car)}
                >
                  {carLabel(car)}
                </button>
              </li>
            );
          })}
        </ul>

        {error && (
          <p className="authAlert authAlertError" role="alert">
            {error}
          </p>
        )}
      </div>

      {selectedCars.length === 0 && (
        <div className="compareEmptyPanel" role="status">
          <p>Velg minst to biler for å starte sammenligningen.</p>
        </div>
      )}

      {selectedCars.length === 1 && (
        <div className="compareEmptyPanel" role="status">
          <p>Velg én bil til for å sammenligne.</p>
        </div>
      )}

      {selectedCars.length >= 2 && (
        <div className="compareTableWrap">
          <table className="compareTable">
            <thead>
              <tr>
                <th scope="col">Spesifikasjon</th>
                {selectedCars.map((car, index) => {
                  const selection = selected[index];
                  const base = cars.find((item) => item.slug === car.slug);
                  const variants = base?.variants ?? [];
                  return (
                    <th key={selectionKey(selection)} scope="col">
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
                              width={72}
                              height={48}
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
                          <span className="srOnly">Variant for {car.model}</span>
                          <select
                            value={selection.variantSlug ?? ""}
                            onChange={(event) =>
                              setVariantForSlot(index, event.target.value)
                            }
                          >
                            {variants.map((variant) => (
                              <option key={variant.id} value={variant.slug}>
                                {variant.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((value, index) => (
                    <td
                      key={`${row.key}-${index}`}
                      className={
                        row.bestIndexes.includes(index) ? "compareBest" : undefined
                      }
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="compareHint">
            Beste tallverdi markeres når sammenligningen er meningsfull (f.eks. lengst
            rekkevidde eller høyest ladeeffekt).
          </p>
        </div>
      )}
    </div>
  );
}
