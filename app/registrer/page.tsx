import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <section className="section">
      <Container>
        <div className="authPanel">
          <div className="authPanelHeader">
            <Eyebrow>Konto</Eyebrow>
            <h1>Registrer deg</h1>
            <p className="lead narrow">
              Opprett en gratis konto for å bruke personlige funksjoner på EVFAKTA.no.
            </p>
          </div>
          <RegisterForm />
        </div>
      </Container>
    </section>
  );
}
