import Container from "@/components/layout/container";
import EmptyState from "@/components/ui/empty-state";

export default function Page() {
  return (
    <section className="section">
      <Container>
        <EmptyState
          eyebrow="Kommer senere"
          title="Ladekostnad-kalkulator"
          description="Denne funksjonen er ikke klar ennå. Bla i modeller eller sammenlign elbiler i mellomtiden."
        />
      </Container>
    </section>
  );
}
