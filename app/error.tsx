"use client";

import { useEffect } from "react";
import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Keep digest for support correlation; never expose stack traces in the UI.
    if (error.digest) {
      console.error("[EVFAKTA] Public route error digest:", error.digest);
    } else {
      console.error("[EVFAKTA] Public route error");
    }
  }, [error]);

  return (
    <section className="section">
      <Container>
        <div className="emptyState">
          <Eyebrow>Feil</Eyebrow>
          <h1>Noe gikk galt</h1>
          <p>
            Vi klarte ikke å vise denne siden akkurat nå. Prøv på nytt, eller gå
            tilbake til forsiden.
          </p>
          <div className="detailActions emptyStateActions">
            <button type="button" className="button primary" onClick={reset}>
              Prøv igjen
            </button>
            <Link href="/" className="button secondary">
              Til forsiden
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
