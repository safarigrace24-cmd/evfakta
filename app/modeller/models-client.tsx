"use client";

import { useMemo, useState } from "react";
import type { Car } from "@/data/cars";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import CarGrid from "@/components/cars/car-grid";

type ModelsClientProps = {
  initialCars: Car[];
  isLoggedIn?: boolean;
  favoriteSlugs?: string[];
};

export default function ModelsClient({
  initialCars,
  isLoggedIn = false,
  favoriteSlugs = [],
}: ModelsClientProps) {
  const [query, setQuery] = useState("");
  const [drive, setDrive] = useState("Alle");

  const filtered = useMemo(
    () =>
      initialCars.filter((car) => {
        const text = `${car.brand} ${car.model}`.toLowerCase();
        return text.includes(query.toLowerCase()) && (drive === "Alle" || car.drive === drive);
      }),
    [initialCars, query, drive],
  );

  return (
    <section className="section">
      <Container>
        <div className="pageHeader">
          <Eyebrow>Elbil-databasen</Eyebrow>
          <h1>Alle modeller</h1>
          <p className="lead narrow">Søk i elbiler og finn nøkkeltallene som betyr mest.</p>
        </div>

        <div className="filters">
          <input
            aria-label="Søk etter bil"
            placeholder="Søk etter merke eller modell…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select aria-label="Velg drivhjul" value={drive} onChange={(e) => setDrive(e.target.value)}>
            <option>Alle</option>
            <option>Forhjulsdrift</option>
            <option>Bakhjulsdrift</option>
            <option>Firehjulsdrift</option>
          </select>
        </div>

        <p className="resultCount">{filtered.length} modeller funnet</p>

        {filtered.length > 0 ? (
          <CarGrid
            cars={filtered}
            variant="full"
            isLoggedIn={isLoggedIn}
            favoriteSlugs={favoriteSlugs}
          />
        ) : (
          <div className="noResults">
            <p>Ingen modeller matcher søket ditt. Prøv et annet søkeord eller filter.</p>
          </div>
        )}
      </Container>
    </section>
  );
}
