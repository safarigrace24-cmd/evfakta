import ModelsClient from "./models-client";
import { getAuthUser } from "@/lib/auth/get-user";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alle elbilmodeller i Norge",
  description: "Søk og filtrer elbiler etter pris, rekkevidde, merke og drivhjul.",
};

export default async function ModelsPage() {
  const [user, favoriteSlugs, cars] = await Promise.all([
    getAuthUser(),
    getFavoriteSlugs(),
    getPublishedCars(),
  ]);

  return (
    <ModelsClient
      initialCars={cars}
      isLoggedIn={Boolean(user)}
      favoriteSlugs={favoriteSlugs}
    />
  );
}
