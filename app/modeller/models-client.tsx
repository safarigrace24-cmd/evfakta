"use client";

import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import CarGrid from "@/components/cars/car-grid";
import {
  catalogFiltersToParams,
  filterAndSortCars,
  type CatalogFilters,
  type CatalogSort,
  uniqueBodyStyles,
  uniqueBrands,
} from "@/lib/cars/catalog-filters";
import {
  PUBLIC_SHOW_PRICES,
  PUBLIC_SHOW_SCORES,
} from "@/lib/public/display-policy";

type ModelsClientProps = {
  initialCars: Car[];
  initialFilters: CatalogFilters;
  isLoggedIn?: boolean;
  favoriteSlugs?: string[];
};

export default function ModelsClient({
  initialCars,
  initialFilters,
  isLoggedIn = false,
  favoriteSlugs = [],
}: ModelsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const brands = useMemo(() => uniqueBrands(initialCars), [initialCars]);
  const bodies = useMemo(() => uniqueBodyStyles(initialCars), [initialCars]);

  const filtered = useMemo(
    () => filterAndSortCars(initialCars, initialFilters),
    [initialCars, initialFilters],
  );

  function updateFilters(patch: Partial<CatalogFilters>) {
    const next = { ...initialFilters, ...patch };
    const params = catalogFiltersToParams(next);
    const href = params.toString() ? `/modeller?${params.toString()}` : "/modeller";
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  }

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Elbil-databasen</Eyebrow>
          <h1>Alle modeller</h1>
          <p className="lead narrow">
            Filtrer på merke, rekkevidde og mer. Filtre lagres i URL-en.
          </p>
        </div>

        <form
          className="catalogFilters"
          onSubmit={(event) => event.preventDefault()}
          aria-busy={isPending}
        >
          <label className="catalogFilterField catalogFilterGrow">
            <span>Søk</span>
            <input
              aria-label="Søk etter bil"
              placeholder="Søk etter merke eller modell…"
              value={initialFilters.q}
              onChange={(e) => updateFilters({ q: e.target.value })}
            />
          </label>

          <label className="catalogFilterField">
            <span>Merke</span>
            <select
              value={initialFilters.brand}
              onChange={(e) => updateFilters({ brand: e.target.value })}
            >
              <option value="">Alle merker</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>

          <label className="catalogFilterField">
            <span>Drivlinje</span>
            <select
              value={initialFilters.drive}
              onChange={(e) => updateFilters({ drive: e.target.value })}
            >
              <option>Alle</option>
              <option>Forhjulsdrift</option>
              <option>Bakhjulsdrift</option>
              <option>Firehjulsdrift</option>
            </select>
          </label>

          <label className="catalogFilterField">
            <span>Karosseri</span>
            <select
              value={initialFilters.body}
              onChange={(e) => updateFilters({ body: e.target.value })}
            >
              <option value="">Alle</option>
              {bodies.map((body) => (
                <option key={body} value={body}>
                  {body}
                </option>
              ))}
            </select>
          </label>

          {PUBLIC_SHOW_PRICES && (
            <>
              <label className="catalogFilterField">
                <span>Pris fra</span>
                <input
                  inputMode="numeric"
                  value={initialFilters.priceMin}
                  onChange={(e) => updateFilters({ priceMin: e.target.value })}
                  placeholder="NOK"
                />
              </label>

              <label className="catalogFilterField">
                <span>Pris til</span>
                <input
                  inputMode="numeric"
                  value={initialFilters.priceMax}
                  onChange={(e) => updateFilters({ priceMax: e.target.value })}
                  placeholder="NOK"
                />
              </label>
            </>
          )}

          <label className="catalogFilterField">
            <span>Min. rekkevidde</span>
            <input
              inputMode="numeric"
              value={initialFilters.rangeMin}
              onChange={(e) => updateFilters({ rangeMin: e.target.value })}
              placeholder="km"
            />
          </label>

          <label className="catalogFilterField">
            <span>Sortering</span>
            <select
              value={initialFilters.sort}
              onChange={(e) => updateFilters({ sort: e.target.value as CatalogSort })}
            >
              <option value="newest">Navn A–Å</option>
              {PUBLIC_SHOW_PRICES && (
                <>
                  <option value="price-asc">Pris lav–høy</option>
                  <option value="price-desc">Pris høy–lav</option>
                </>
              )}
              <option value="range-desc">Rekkevidde</option>
              {PUBLIC_SHOW_SCORES && (
                <option value="score-desc">EVFAKTA Score</option>
              )}
            </select>
          </label>
        </form>

        <p className="resultCount">
          {filtered.length} modeller funnet{isPending ? " …" : ""}
        </p>

        {filtered.length > 0 ? (
          <CarGrid
            cars={filtered}
            variant="full"
            isLoggedIn={isLoggedIn}
            favoriteSlugs={favoriteSlugs}
          />
        ) : (
          <div className="noResults">
            <p>Ingen modeller matcher filtrene. Prøv å justere søk eller filtre.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
