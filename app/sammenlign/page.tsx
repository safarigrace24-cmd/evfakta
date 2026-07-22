import Container from "@/components/layout/container";
import EmptyState from "@/components/ui/empty-state";

export default function Page() {
  return (
    <section className="section">
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
