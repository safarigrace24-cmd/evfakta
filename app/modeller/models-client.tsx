"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import EmptyState from "@/components/ui/empty-state";
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

type Chip = {
  key: string;
  label: string;
  clear: Partial<CatalogFilters>;
};

export default function ModelsClient({
  initialCars,
  initialFilters,
  isLoggedIn = false,
  favoriteSlugs = [],
}: ModelsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [query, setQuery] = useState(initialFilters.q);

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

  function clearFilters() {
    setQuery("");
    updateFilters({
      q: "",
      brand: "",
      drive: "Alle",
      body: "",
      priceMin: "",
      priceMax: "",
      rangeMin: "",
      sort: "newest",
    });
    setFiltersOpen(false);
  }

  useEffect(() => {
    setQuery(initialFilters.q);
  }, [initialFilters.q]);

  useEffect(() => {
    if (query === initialFilters.q) return;
    const timer = window.setTimeout(() => {
      const next = { ...initialFilters, q: query };
      const params = catalogFiltersToParams(next);
      const href = params.toString() ? `/modeller?${params.toString()}` : "/modeller";
      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [query, initialFilters, router]);

  useEffect(() => {
    if (!filtersOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFiltersOpen(false);
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [filtersOpen]);

  const chips: Chip[] = [];
  if (initialFilters.q.trim()) {
    chips.push({
      key: "q",
      label: `Søk: ${initialFilters.q.trim()}`,
      clear: { q: "" },
    });
  }
  if (initialFilters.brand) {
    chips.push({
      key: "brand",
      label: initialFilters.brand,
      clear: { brand: "" },
    });
  }
  if (initialFilters.drive && initialFilters.drive !== "Alle") {
    chips.push({
      key: "drive",
      label: initialFilters.drive,
      clear: { drive: "Alle" },
    });
  }
  if (initialFilters.body) {
    chips.push({
      key: "body",
      label: initialFilters.body,
      clear: { body: "" },
    });
  }
  if (initialFilters.rangeMin) {
    chips.push({
      key: "rangeMin",
      label: `Min. ${initialFilters.rangeMin} km`,
      clear: { rangeMin: "" },
    });
  }
  if (PUBLIC_SHOW_PRICES && initialFilters.priceMin) {
    chips.push({
      key: "priceMin",
      label: `Fra ${initialFilters.priceMin} kr`,
      clear: { priceMin: "" },
    });
  }
  if (PUBLIC_SHOW_PRICES && initialFilters.priceMax) {
    chips.push({
      key: "priceMax",
      label: `Til ${initialFilters.priceMax} kr`,
      clear: { priceMax: "" },
    });
  }

  const filterForm = (
    <form
      className="catalogFilters"
      onSubmit={(event) => event.preventDefault()}
      aria-busy={isPending}
    >
      <div className="catalogFilterSearchRow">
        <label className="catalogFilterField catalogFilterGrow">
          <span>Søk</span>
          <input
            type="search"
            aria-label="Søk etter merke eller modell"
            placeholder="Søk etter merke eller modell…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            enterKeyHint="search"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="catalogFilterMetaRow" role="group" aria-label="Filtre og sortering">
        <label className="catalogFilterField">
          <span>Merke</span>
          <select
            value={initialFilters.brand}
            onChange={(e) => updateFilters({ brand: e.target.value })}
            aria-label="Filtrer etter merke"
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
            aria-label="Filtrer etter drivlinje"
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
            aria-label="Filtrer etter karosseri"
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
                aria-label="Minstepris i kroner"
              />
            </label>

            <label className="catalogFilterField">
              <span>Pris til</span>
              <input
                inputMode="numeric"
                value={initialFilters.priceMax}
                onChange={(e) => updateFilters({ priceMax: e.target.value })}
                placeholder="NOK"
                aria-label="Makspris i kroner"
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
            aria-label="Minimum WLTP-rekkevidde i kilometer"
          />
        </label>

        <label className="catalogFilterField">
          <span>Sortering</span>
          <select
            value={initialFilters.sort}
            onChange={(e) => updateFilters({ sort: e.target.value as CatalogSort })}
            aria-label="Sorter resultater"
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
      </div>
    </form>
  );

  const emptyCatalog = initialCars.length === 0;
  const emptyFiltered = !emptyCatalog && filtered.length === 0;

  return (
    <section className="section modelsPage" aria-labelledby="models-page-heading">
      <Container>
        <header className="pageHeader modelsPageHeader">
          <Eyebrow>Elbil-databasen</Eyebrow>
          <h1 id="models-page-heading">Alle modeller</h1>
          <p className="lead narrow">
            {initialCars.length} publiserte{" "}
            {initialCars.length === 1 ? "modell" : "modeller"} i databasen. Søk og
            filtrer etter merke, rekkevidde og drivlinje. Filtre lagres i URL-en.
          </p>
        </header>

        <div className="catalogSticky">
          <div className="catalogToolbar">
            <button
              type="button"
              className="button secondary catalogFilterToggle"
              aria-expanded={filtersOpen}
              aria-controls="catalog-filter-sheet"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              Filtre{chips.length > 0 ? ` (${chips.length})` : ""}
            </button>
            <p className="resultCount" aria-live="polite">
              <span className="resultCountValue">
                {filtered.length}{" "}
                {filtered.length === 1 ? "modell" : "modeller"} funnet
              </span>
              {isPending ? (
                <span className="resultCountPending"> Oppdaterer…</span>
              ) : null}
            </p>
          </div>

          <div className="catalogFiltersDesktop">{filterForm}</div>

          {chips.length > 0 && (
            <ul className="filterChipList" aria-label="Aktive filtre">
              {chips.map((chip) => (
                <li key={chip.key}>
                  <button
                    type="button"
                    className="filterChip"
                    onClick={() => {
                      if (chip.key === "q") setQuery("");
                      updateFilters(chip.clear);
                    }}
                  >
                    {chip.label}
                    <span aria-hidden="true"> ×</span>
                    <span className="visuallyHidden">Fjern filter</span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" className="filterChipClear" onClick={clearFilters}>
                  Nullstill alle
                </button>
              </li>
            </ul>
          )}
        </div>

        {filtersOpen && (
          <div
            id="catalog-filter-sheet"
            className="catalogFilterSheet"
            role="dialog"
            aria-modal="true"
            aria-label="Filtre"
          >
            <div className="catalogFilterSheetHeader">
              <strong>Filtre</strong>
              <button
                type="button"
                className="button ghost buttonSm"
                onClick={() => setFiltersOpen(false)}
              >
                Lukk
              </button>
            </div>
            {filterForm}
            <div className="catalogFilterSheetActions">
              <button type="button" className="button secondary" onClick={clearFilters}>
                Nullstill
              </button>
              <button
                type="button"
                className="button primary"
                onClick={() => setFiltersOpen(false)}
              >
                Vis resultater
              </button>
            </div>
          </div>
        )}
        {filtersOpen && (
          <button
            type="button"
            className="catalogFilterOverlay"
            aria-label="Lukk filtre"
            onClick={() => setFiltersOpen(false)}
          />
        )}

        <div
          className={`catalogResults${isPending ? " isPending" : ""}`}
          aria-busy={isPending}
        >
          {filtered.length > 0 ? (
            <CarGrid
              cars={filtered}
              variant="full"
              isLoggedIn={isLoggedIn}
              favoriteSlugs={favoriteSlugs}
            />
          ) : emptyCatalog ? (
            <EmptyState
              className="modelsEmpty"
              titleAs="h2"
              eyebrow="Katalog"
              title="Ingen publiserte modeller ennå"
              description="Når modeller er godkjent og publisert i CMS, vises de her. Vi viser ikke utkast eller gjettede tall."
            />
          ) : emptyFiltered ? (
            <EmptyState
              className="modelsEmpty"
              titleAs="h2"
              eyebrow="Ingen treff"
              title="Ingen modeller matcher filtrene"
              description="Prøv å fjerne et filter, eller søk på et annet merke eller modellnavn."
            >
              <button type="button" className="button primary" onClick={clearFilters}>
                Nullstill filtre
              </button>
            </EmptyState>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
