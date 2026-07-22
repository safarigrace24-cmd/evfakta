import Container from "@/components/layout/container";
import EmptyState from "@/components/ui/empty-state";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = slug.charAt(0).toUpperCase() + slug.slice(1).replaceAll("-", " ");

  return (
    <section className="section">
      <Container>
        <EmptyState
          eyebrow="Kommer snart"
          title={title}
          description="Denne siden er klar som plassholder og kan bygges videre."
        />
      </Container>
    </section>
  );
}
