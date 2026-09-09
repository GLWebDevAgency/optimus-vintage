import Link from "next/link";
import { TagMark } from "@/components/brand/TagMark";

const COLS = [
  {
    title: "Produit",
    links: [
      { href: "/#fonctions", label: "Fonctions" },
      { href: "/#calcul", label: "Calculateur de marge" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/#faq", label: "Questions fréquentes" },
      { href: "/auth/inscription", label: "Créer un compte" },
      { href: "/auth/connexion", label: "Connexion" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/legal/cgu", label: "Conditions générales" },
      { href: "/legal/confidentialite", label: "Confidentialité" },
      { href: "/legal/mentions-legales", label: "Mentions légales" },
    ],
  },
  {
    title: "Contact",
    links: [
      { href: "mailto:bonjour@chine.app", label: "bonjour@chine.app" },
      { href: "mailto:bonjour@chine.app?subject=Atelier", label: "Équipes et dépôts-ventes" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="foot-cols">
        <div className="foot-brand">
          <TagMark size={40} title={null} />
          <p>
            Chiné suit le stock, les sources et la marge réelle des revendeurs de vêtements de
            seconde main. Hors ligne, dans la poche, avec un expert IA.
          </p>
        </div>
        {COLS.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <span className="foot-title">{c.title}</span>
            {c.links.map((l) => (
              <Link key={l.href} href={l.href}>
                {l.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className="foot-bottom">
        <span>Chiné · Selvedge · {new Date().getFullYear()}</span>
        <span>Calico · Indigo · Fil de lisière · Laiton · Craie</span>
      </div>
    </footer>
  );
}
