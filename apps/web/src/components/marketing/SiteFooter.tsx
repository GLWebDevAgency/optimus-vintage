import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <nav aria-label="Liens légaux">
        <Link href="/legal/cgu">Conditions d'utilisation</Link>
        <Link href="/legal/confidentialite">Confidentialité</Link>
        <Link href="/auth/connexion">Connexion</Link>
        <Link href="/auth/inscription">Inscription</Link>
      </nav>
      <div className="flex flex-wrap justify-between gap-2">
        <span>Chiné · Selvedge · {new Date().getFullYear()}</span>
        <span>Calico · Indigo · Fil de lisière · Laiton · Craie</span>
      </div>
    </footer>
  );
}
