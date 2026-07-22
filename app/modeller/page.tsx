import ModelsClient from "./models-client";
import { cars } from "@/data/cars";

export const metadata = {
  title: "Alle elbilmodeller i Norge",
  description: "Søk og filtrer elbiler etter pris, rekkevidde, merke og drivhjul.",
};

export default function ModelsPage() {
  return <ModelsClient initialCars={cars} />;
}
