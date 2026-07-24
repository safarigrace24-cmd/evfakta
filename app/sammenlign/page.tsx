import Container from "@/components/layout/container";
import EmptyState from "@/components/ui/empty-state";
import { getPublishedCars } from "@/lib/cars/get-published-cars";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sammenlign elbiler",
  description: "Sammenlign elbiler etter pris, rekkevidde, batteri og ladehastighet.",
};

export default async function Page() {
  // Comparison UI is still a placeholder; data already comes from published Supabase cars.
  const cars = await getPublishedCars();

  return (
    <section className="section" data-published-cars={cars.length}>
      <Container>
        <EmptyState
          eyebrow="Neste funksjon"
          title="Sammenlign elbiler"
          description="Her bygger vi valg og sammenligning av to eller tre modeller."
        />
      </Container>
    </section>
  );
}
