import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

export default function NotFound() {
  return (
    <section className="section">
      <Container>
        <div className="emptyState">
          <Eyebrow>404</Eyebrow>
          <h1>Siden ble ikke funnet</h1>
          <p>Sjekk adressen, eller gå tilbake til modellkatalogen.</p>
          <div className="detailActions">
            <Link href="/modeller" className="button primary">
              Se modeller
            </Link>
            <Link href="/" className="button secondary">
              Til forsiden
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
