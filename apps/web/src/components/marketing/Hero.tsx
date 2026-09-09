import { PLAN_LIMITS } from "@chine/domain";
import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";
import { HeroPhone } from "./HeroPhone";

const HERO_UNDERLINE = "M2 10 C 120 2, 300 16, 518 8";

/**
 * Héros : trois chiffres en couverture (payé, vendu, gagné), la promesse en une phrase, un seul
 * appel principal, et l'app réelle à droite. Aucun chiffre ici n'est inventé : c'est la vente
 * d'exemple que l'on retrouve dans les écrans plus bas.
 */
export function Hero() {
  return (
    <section className="hero !mt-0" aria-labelledby="hero-h">
      <div>
        <p className="eyebrow">L'app des chineurs · seconde main</p>
        <h1 id="hero-h" className="hero-h mt-4">
          <span className="hero-cover">
            Payé <em>20 €</em>. Vendu <em>75 €</em>. Gagné <em className="brass">55 €</em>.
          </span>
          <span className="hero-sub">
            Chiné suit le stock, les sources et la marge réelle des revendeurs de vêtements de
            seconde main.
          </span>
        </h1>
        <svg className="stitch-under" viewBox="0 0 520 18" aria-hidden="true">
          <defs>
            <mask id="m-hero">
              <path
                d={HERO_UNDERLINE}
                stroke="#fff"
                strokeWidth="10"
                fill="none"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset="1"
                style={{ animation: "draw 1.6s var(--ease-out) .4s forwards" }}
              />
            </mask>
          </defs>
          <path
            d={HERO_UNDERLINE}
            stroke="var(--thread)"
            strokeWidth="2.6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray="9 6"
            mask="url(#m-hero)"
          />
        </svg>
        <p className="lead mt-6">
          Une photo en brocante, un prix, un lieu : la pièce est dans ton stock avant que tu aies
          rangé ton téléphone. Frais de plateforme réels, prix plancher, source remboursée au fil
          rouge. La chine avant le tableur.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link href="/auth/inscription" className="btn lg" data-cta="hero">
            Créer un compte gratuit
          </Link>
          <Link href="#demo" className="btn ghost lg">
            Voir l'app en 2 minutes
          </Link>
        </div>
        <p className="hero-micro mt-4">
          Gratuit jusqu'à {PLAN_LIMITS.FREE.maxItems} pièces en stock · Sans carte bancaire · Sans
          app store, s'installe depuis le navigateur
        </p>
        <ul className="hero-facts mt-8" aria-label="Ce que fait Chiné">
          <li>
            <b>Hors ligne</b>
            <span>Cave de vide-grenier, entrepôt sans réseau : tout se synchronise après.</span>
          </li>
          <li>
            <b>Expert IA</b>
            <span>Marque, état, fourchette de prix, conseil d'achat, dès la formule gratuite.</span>
          </li>
          <li>
            <b>Frais réels</b>
            <span>Vinted, Vestiaire, eBay, Leboncoin, Depop, Etsy, Whatnot : grilles à jour.</span>
          </li>
        </ul>
      </div>
      <Reveal delay={0.1} className="hero-phone">
        <HeroPhone />
        <p className="shot-caption">C'est l'app, pas une maquette · données d'exemple</p>
      </Reveal>
    </section>
  );
}
