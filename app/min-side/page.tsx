import Link from "next/link";
import { redirect } from "next/navigation";
import Container from "@/components/layout/container";
import Eyebrow from "@/components/ui/eyebrow";
import LogoutButton from "@/components/auth/logout-button";
import FavoriteCarsList from "@/components/favorites/favorite-cars-list";
import { getAuthUser } from "@/lib/auth/get-user";
import { isAdminEmail } from "@/lib/auth/is-admin";
import { getFavoriteCars } from "@/lib/favorites/get-favorites";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login?next=/min-side");
  }

  const favoriteCars = await getFavoriteCars();
  const isAdmin = isAdminEmail(user.email);

  return (
    <section className="section">
      <Container className="authNarrow">
        <div className="pageHeader accountHeader">
          <Eyebrow>Min side</Eyebrow>
          <h1>Velkommen tilbake</h1>
          <p className="lead narrow">
            Du er innlogget som <strong>{user.email}</strong>.
          </p>
          <div className="accountActions">
            {isAdmin && (
              <Link href="/admin" className="button primary buttonSm">
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <section className="accountCard accountCardWide">
          <h2>Favorittbiler</h2>
          <FavoriteCarsList cars={favoriteCars} />
        </section>

        <p className="accountHint">
          Tips: Bruk <Link href="/sammenlign">Sammenlign</Link> for å legge
          favoritter side om side.
        </p>
      </Container>
    </section>
  );
}
