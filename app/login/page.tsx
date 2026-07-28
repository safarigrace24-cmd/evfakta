import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import LoginForm from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

function loginErrorMessage(code?: string) {
  if (code === "callback") {
    return "Innloggingen kunne ikke fullføres. Prøv igjen eller be om en ny lenke.";
  }
  if (code === "config") {
    return "Autentisering er ikke konfigurert ennå. Legg til Supabase-miljøvariabler.";
  }
  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/min-side";

  return (
    <section className="section">
      <Container>
        <div className="authPanel">
          <div className="authPanelHeader">
            <Eyebrow>Konto</Eyebrow>
            <h1>Logg inn</h1>
            <p className="lead narrow">
              Logg inn for å lagre favoritter og få tilgang til Min side.
            </p>
          </div>
          <LoginForm nextPath={nextPath} initialError={loginErrorMessage(params.error)} />
        </div>
      </Container>
    </section>
  );
}
