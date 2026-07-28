import Link from "next/link";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import Button from "@/components/ui/button";

type ComingSoonPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  reasons?: string[];
};

/**
 * Honest placeholder for routes that exist but are not ready for public use.
 */
export default function ComingSoonPage({
  eyebrow,
  title,
  description,
  reasons = [],
}: ComingSoonPageProps) {
  return (
    <section className="section">
      <Container className="comingSoon">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p className="lead narrow">{description}</p>
        {reasons.length > 0 && (
          <ul className="comingSoonList">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        <div className="actions comingSoonActions">
          <Button href="/modeller" variant="primary">
            Se modeller
          </Button>
          <Link href="/sammenlign" className="textLink">
            Sammenlign biler →
          </Link>
        </div>
      </Container>
    </section>
  );
}
