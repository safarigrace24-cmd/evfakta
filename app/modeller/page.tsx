import type { Metadata } from "next";
import ModelsClient from "./models-client";
import { getAuthUser } from "@/lib/auth/get-user";
import { parseCatalogFilters } from "@/lib/cars/catalog-filters";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Alle elbilmodeller i Norge",
  description:
    "Søk og filtrer elbiler etter pris, rekkevidde, merke, drivlinje og EVFAKTA Score.",
  alternates: { canonical: "/modeller" },
  openGraph: {
    title: "Alle elbilmodeller i Norge | EVFAKTA.no",
    description:
      "Søk og filtrer elbiler etter pris, rekkevidde, merke, drivlinje og EVFAKTA Score.",
    url: "/modeller",
  },
};

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [user, favoriteSlugs, cars] = await Promise.all([
    getAuthUser(),
    getFavoriteSlugs(),
    getPublishedCars(),
  ]);

  const filters = parseCatalogFilters(params);

  return (
    <ModelsClient
      initialCars={cars}
      initialFilters={filters}
      isLoggedIn={Boolean(user)}
      favoriteSlugs={favoriteSlugs}
    />
  );
}
