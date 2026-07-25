import Container from "@/components/layout/container";

export default function ModelsLoading() {
  return (
    <section className="section">
      <Container>
        <div className="loadingBlock" role="status" aria-live="polite">
          Laster modeller…
        </div>
      </Container>
    </section>
  );
}
