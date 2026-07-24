import ModelsClient from "./models-client";
import { cars } from "@/data/cars";
import { getAuthUser } from "@/lib/auth/get-user";
import { getFavoriteSlugs } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Alle elbilmodeller i Norge",
  description: "Søk og filtrer elbiler etter pris, rekkevidde, merke og drivhjul.",
};

export default async function ModelsPage() {
  const [user, favoriteSlugs] = await Promise.all([getAuthUser(), getFavoriteSlugs()]);

  return (
    <ModelsClient
      initialCars={cars}
      isLoggedIn={Boolean(user)}
      favoriteSlugs={favoriteSlugs}
    />
  );
}
