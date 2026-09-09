import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Éditeur, hébergeur et contact du service Chiné.",
  alternates: { canonical: "/legal/mentions-legales" },
};

/**
 * Mentions obligatoires (LCEN art. 6-III). Les champs entre crochets sont à renseigner par
 * l'éditeur avant la mise en ligne publique : ils dépendent de la structure juridique choisie.
 */
export default function MentionsLegalesPage() {
  return (
    <LegalPage eyebrow="Légal · Mentions" title="Mentions légales" updated="septembre 2026">
      <h2>Éditeur</h2>
      <p>
        Chiné est édité par [Dénomination de l'éditeur], [forme juridique, capital], immatriculée au
        RCS de [ville] sous le numéro [SIREN], dont le siège est situé [adresse]. Numéro de TVA
        intracommunautaire : [FR…]. Directeur de la publication : [Prénom Nom].
      </p>
      <h2>Contact</h2>
      <p>
        Par e-mail : <a href="mailto:bonjour@chine.app">bonjour@chine.app</a>. Nous répondons en
        français et en anglais, sous deux jours ouvrés.
      </p>
      <h2>Hébergement</h2>
      <p>
        Application et base de données : Railway Corp., 548 Market St, San Francisco, CA 94104,
        États-Unis, sur une région de centre de données située dans l'Union européenne. Photos :
        Cloudflare, Inc. (stockage R2, région Union européenne), 101 Townsend St, San Francisco, CA
        94107, États-Unis.
      </p>
      <h2>Propriété intellectuelle</h2>
      <p>
        Le nom Chiné, l'identité visuelle « Selvedge », les textes et le code de l'application sont
        protégés. Les données, photos et textes que tu enregistres restent ta propriété.
      </p>
      <h2>Médiation de la consommation</h2>
      <p>
        Conformément aux articles L.611-1 et suivants du Code de la consommation, tu peux recourir
        gratuitement au médiateur de la consommation dont relève l'éditeur : [nom et site du
        médiateur]. La plateforme européenne de règlement en ligne des litiges est accessible sur{" "}
        <a href="https://ec.europa.eu/consumers/odr">ec.europa.eu/consumers/odr</a>.
      </p>
    </LegalPage>
  );
}
