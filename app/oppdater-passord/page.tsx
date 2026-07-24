import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import UpdatePasswordForm from "@/components/auth/update-password-form";

export default function UpdatePasswordPage() {
  return (
    <section className="section">
      <Container>
        <div className="authPanel">
          <div className="authPanelHeader">
            <Eyebrow>Konto</Eyebrow>
            <h1>Oppdater passord</h1>
            <p className="lead narrow">
              Velg et nytt passord for kontoen din. Bruk lenken fra e-posten før du fortsetter.
            </p>
          </div>
          <UpdatePasswordForm />
        </div>
      </Container>
    </section>
  );
}
