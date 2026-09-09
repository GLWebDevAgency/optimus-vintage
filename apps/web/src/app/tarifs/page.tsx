import { PLANS as PLAN_CODES, PLAN_LIMITS, PLAN_NAMES } from "@chine/domain";
import type { Metadata } from "next";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { JsonLd } from "@/components/marketing/JsonLd";
import { Pricing } from "@/components/marketing/Pricing";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { SiteHeader } from "@/components/marketing/SiteHeader";

export const metadata: Metadata = {
  title: "Tarifs",
  description: `Chiné est gratuit jusqu'à ${PLAN_LIMITS.FREE.maxItems} pièces en stock. Chineur et Pro pour suivre plus de pièces, les textes d'annonce IA, l'analytique, le journal comptable et les étiquettes QR. Essai sans carte.`,
  alternates: { canonical: "/tarifs" },
  openGraph: { title: "Tarifs · Chiné", url: "/tarifs" },
};

const inf = (n: number) => (Number.isFinite(n) ? String(n) : "Illimité");

/** Page tarifs : cartes, grille détaillée des limites, questions. */
export default function PricingPage() {
  return (
    <>
      <JsonLd />
      <SiteHeader />
      <main className="wrap landing pt-8">
        <Pricing standalone />
        <section aria-labelledby="limits-h">
          <p className="eyebrow">En détail</p>
          <h2 id="limits-h" className="mt-3.5">
            Les limites, noir sur calico
          </h2>
          <div className="compare mt-6">
            <table>
              <thead>
                <tr>
                  <th scope="col">Par mois ou en stock</th>
                  {PLAN_CODES.map((p) => (
                    <th key={p} scope="col">
                      {PLAN_NAMES[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">Pièces en stock</th>
                  {PLAN_CODES.map((p) => (
                    <td key={p}>{inf(PLAN_LIMITS[p].maxItems)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Lots, palettes, pickings par mois</th>
                  {PLAN_CODES.map((p) => (
                    <td key={p}>{inf(PLAN_LIMITS[p].maxSourcesPerMonth)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Crédits IA par mois (1 par expertise)</th>
                  {PLAN_CODES.map((p) => (
                    <td key={p}>{inf(PLAN_LIMITS[p].aiCreditsPerMonth)}</td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">Membres</th>
                  {PLAN_CODES.map((p) => (
                    <td key={p}>{PLAN_LIMITS[p].members}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="label mt-3">
            La chine à l'unité (mode Chiner) n'est jamais limitée en nombre de sources. Une vente
            libère une place en stock.
          </p>
        </section>
        <Faq standalone />
        <FinalCta />
        <SiteFooter />
      </main>
    </>
  );
}
