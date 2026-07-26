import Container from "@/components/layout/container";
import CompareClient from "@/components/compare/compare-client";
import { getPublishedCars } from "@/lib/cars/get-published-cars";
import { parseCompareSelections } from "@/lib/compare/comparison";
import { resolveVariantSlug } from "@/lib/cars/variants";

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
  const [cars, initialSelections] = await Promise.all([
    getPublishedCars(),
    Promise.resolve(parseCompareSelections(params.biler)),
  ]);

  const validInitial = initialSelections
    .map((selection) => {
      const car = cars.find((item) => item.slug === selection.slug);
      if (!car) return null;
      return {
        slug: selection.slug,
        variantSlug: resolveVariantSlug(car, selection.variantSlug),
      };
    })
    .filter((item): item is { slug: string; variantSlug: string | null } =>
      Boolean(item),
    );

  return (
    <section className="section">
      <Container>
        <CompareClient cars={cars} initialSelections={validInitial} />
      </Container>
    </section>
  );
}
