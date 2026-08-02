import type { Metadata } from "next";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import ForgotPasswordForm from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Glemt passord",
  description: "Be om lenke for å lage nytt passord på EVFAKTA.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/glemt-passord" },
};

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
