"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import {
  buildCompareHref,
  buildComparisonRows,
} from "@/lib/compare/comparison";
import Eyebrow from "@/components/ui/eyebrow";

type CompareClientProps = {
  cars: Car[];
  initialSlugs: string[];
};

function carLabel(car: Car) {
  return `${car.brand} ${car.model}`;
}

export default function CompareClient({ cars, initialSlugs }: CompareClientProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initialSlugs.slice(0, 3));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCars = useMemo(
    () =>
      selected
        .map((slug) => cars.find((car) => car.slug === slug))
        .filter((car): car is Car => Boolean(car)),
    [cars, selected],
  );

  const rows = useMemo(() => buildComparisonRows(selectedCars), [selectedCars]);

  function syncUrl(next: string[]) {
    startTransition(() => {
      router.replace(buildCompareHref(next), { scroll: false });
    });
  }

  function toggleSlug(slug: string) {
    setError(null);
    setSelected((current) => {
      if (current.includes(slug)) {
        const next = current.filter((item) => item !== slug);
        syncUrl(next);
        return next;
      }
      if (current.length >= 3) {
        setError("Du kan sammenligne maksimalt tre biler.");
        return current;
      }
      const next = [...current, slug];
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
            const active = selected.includes(car.slug);
            return (
              <li key={car.slug}>
                <button
                  type="button"
                  className={active ? "compareChip active" : "compareChip"}
                  aria-pressed={active}
                  onClick={() => toggleSlug(car.slug)}
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
                {selectedCars.map((car) => (
                  <th key={car.slug} scope="col">
                    <Link href={`/modeller/${car.slug}`} className="compareCarHead">
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
                      </span>
                    </Link>
                  </th>
                ))}
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
            rekkevidde, lavest pris).
          </p>
        </div>
      )}
    </div>
  );
}
