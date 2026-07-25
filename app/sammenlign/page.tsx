import Container from "@/components/layout/container";
import CompareClient from "@/components/compare/compare-client";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { parseCompareSlugs } from "@/lib/compare/comparison";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sammenlign elbiler",
  description:
    "Sammenlign 2–3 publiserte elbiler etter spesifikasjoner og EVFAKTA Score.",
  alternates: { canonical: "/sammenlign" },
  openGraph: {
    title: "Sammenlign elbiler | EVFAKTA.no",
    description:
      "Sammenlign 2–3 publiserte elbiler etter spesifikasjoner og EVFAKTA Score.",
    url: "/sammenlign",
  },
};

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ biler?: string }>;
}) {
  const params = await searchParams;
  const [cars, initialSlugs] = await Promise.all([
    getPublishedCars(),
    Promise.resolve(parseCompareSlugs(params.biler)),
  ]);

  const validInitial = initialSlugs.filter((slug) =>
    cars.some((car) => car.slug === slug),
  );

  return (
    <section className="section">
      <Container>
        <CompareClient cars={cars} initialSlugs={validInitial} />
      </Container>
    </section>
  );
}
