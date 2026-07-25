import Link from "next/link";

type AdminNavProps = {
  current?: "dashboard" | "cars" | "new" | "brands" | "import";
};

export default function AdminNav({ current = "dashboard" }: AdminNavProps) {
  return (
    <nav className="adminNav" aria-label="Adminmeny">
      <Link
        href="/admin"
        className={current === "dashboard" ? "adminNavLink active" : "adminNavLink"}
        aria-current={current === "dashboard" ? "page" : undefined}
      >
        Oversikt
      </Link>
      <Link
        href="/admin/import"
        className={current === "import" ? "adminNavLink active" : "adminNavLink"}
        aria-current={current === "import" ? "page" : undefined}
      >
        Import
      </Link>
      <Link
        href="/admin/merker"
        className={current === "brands" ? "adminNavLink active" : "adminNavLink"}
        aria-current={current === "brands" ? "page" : undefined}
      >
        Merker
      </Link>
      <Link
        href="/admin/biler"
        className={current === "cars" ? "adminNavLink active" : "adminNavLink"}
        aria-current={current === "cars" ? "page" : undefined}
      >
        Biler
      </Link>
      <Link
        href="/admin/biler/ny"
        className={current === "new" ? "adminNavLink active" : "adminNavLink"}
        aria-current={current === "new" ? "page" : undefined}
      >
        Legg til bil
      </Link>
    </nav>
  );
}
