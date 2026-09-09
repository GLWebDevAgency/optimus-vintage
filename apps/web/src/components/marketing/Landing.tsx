import { Calculator } from "./Calculator";
import { Compare } from "./Compare";
import { Faq } from "./Faq";
import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { JsonLd } from "./JsonLd";
import { Personas } from "./Personas";
import { Pricing } from "./Pricing";
import { ProofReceipt } from "./ProofReceipt";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { StickyCta } from "./StickyCta";
import { Trust } from "./Trust";

/**
 * Page d'accueil : héros → preuve → démo → fonctions → calculateur → pour qui → tarifs →
 * comparaison → confiance → questions → appel final. Un seul objectif : créer un compte.
 */
export function Landing() {
  return (
    <>
      <JsonLd />
      <SiteHeader />
      <main className="wrap landing">
        <Hero />
        <ProofReceipt />
        <HowItWorks />
        <Features />
        <Calculator />
        <Personas />
        <Pricing />
        <Compare />
        <Trust />
        <Faq />
        <FinalCta />
        <SiteFooter />
      </main>
      <StickyCta />
    </>
  );
}
