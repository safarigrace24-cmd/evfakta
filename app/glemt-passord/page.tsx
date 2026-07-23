import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <section className="section">
      <Container>
        <div className="authPanel">
          <div className="authPanelHeader">
            <Eyebrow>Konto</Eyebrow>
            <h1>Glemt passord</h1>
            <p className="lead narrow">
              Skriv inn e-postadressen din, så sender vi en lenke for å lage et nytt passord.
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </Container>
    </section>
  );
}
