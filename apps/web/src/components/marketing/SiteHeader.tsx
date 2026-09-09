import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

const NAV = [
  { href: "/#fonctions", label: "Fonctions" },
  { href: "/#calcul", label: "Calculer" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/#faq", label: "Questions" },
] as const;

/** Barre fine et collante : un seul objectif de conversion, la navigation reste discrète. */
export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Wordmark />
        <nav className="site-nav" aria-label="Sections">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}>
              {n.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-2" aria-label="Compte">
          <Link href="/auth/connexion" className="btn ghost">
            Se connecter
          </Link>
          <Link href="/auth/inscription" className="btn hidden sm:inline-flex" data-cta="header">
            Commencer gratuitement
          </Link>
        </nav>
      </div>
    </header>
  );
}
