import { redirect } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import LogoutButton from "@/components/auth/logout-button";
import { getAuthUser } from "@/lib/auth/get-user";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login?next=/min-side");
  }

  return (
    <section className="section">
      <Container>
        <div className="pageHeader accountHeader">
          <Eyebrow>Min side</Eyebrow>
          <h1>Velkommen tilbake</h1>
          <p className="lead narrow">
            Du er innlogget som <strong>{user.email}</strong>.
          </p>
          <div className="accountActions">
            <LogoutButton />
          </div>
        </div>

        <div className="accountGrid">
          <section className="accountCard">
            <h2>Favorittbiler</h2>
            <p>
              Her kan du snart lagre elbiler du følger med på. Funksjonen kommer i en senere
              versjon.
            </p>
          </section>

          <section className="accountCard">
            <h2>Lagrede sammenligninger</h2>
            <p>
              Lagrede modellsammenligninger dukker opp her når funksjonen er klar.
            </p>
          </section>

          <section className="accountCard">
            <h2>Kalkulatorhistorikk</h2>
            <p>
              Tidligere ladekostnadsberegninger blir listet her når kalkulatoren er koblet til
              kontoen din.
            </p>
          </section>
        </div>
      </Container>
    </section>
  );
}
