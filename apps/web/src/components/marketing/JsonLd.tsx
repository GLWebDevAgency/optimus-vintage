import { PLAN_NAMES, PLAN_PRICES_EUR, PURCHASABLE_PLANS } from "@chine/domain";
import { FAQ } from "./pricing";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Données structurées : application, offres (prix du domaine) et FAQ. */
export function JsonLd({ faq = true }: { faq?: boolean }) {
  const app = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Chiné",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android (PWA)",
    url: APP_URL,
    description:
      "Application de gestion de stock, de sources et de marge pour les revendeurs de vêtements de seconde main : hors ligne, expert IA, frais de plateforme réels.",
    inLanguage: "fr",
    offers: [
      { "@type": "Offer", name: PLAN_NAMES.FREE, price: "0", priceCurrency: "EUR" },
      ...PURCHASABLE_PLANS.map((p) => ({
        "@type": "Offer",
        name: PLAN_NAMES[p],
        price: (PLAN_PRICES_EUR[p].monthlyMinor / 100).toFixed(2),
        priceCurrency: "EUR",
        billingIncrement: "P1M",
      })),
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD généré depuis des constantes
        dangerouslySetInnerHTML={{ __html: JSON.stringify(app) }}
      />
      {faq ? (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD généré depuis des constantes
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      ) : null}
    </>
  );
}
