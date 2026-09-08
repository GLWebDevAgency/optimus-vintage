import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Wordmark />
        <nav className="flex items-center gap-2" aria-label="Compte">
          <Link href="/auth/connexion" className="btn ghost">
            Se connecter
          </Link>
          <Link href="/auth/inscription" className="btn hidden sm:inline-flex">
            Créer un compte
          </Link>
        </nav>
      </div>
    </header>
  );
}
