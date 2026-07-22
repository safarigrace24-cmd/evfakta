import Container from "@/components/layout/container";
import EmptyState from "@/components/ui/empty-state";

export default function Page() {
  return (
    <section className="section">
      <Container>
        <EmptyState
          eyebrow="Neste funksjon"
          title="Ladekostnad-kalkulator"
          description="Her kan vi regne ut kostnad hjemme og på hurtiglader."
        />
      </Container>
    </section>
  );
}
