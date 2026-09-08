import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Quelles données Chiné collecte, pourquoi, et comment les supprimer.",
};

export default function ConfidentialitePage() {
  return (
    <LegalPage
      eyebrow="Légal · Confidentialité"
      title="Politique de confidentialité"
      updated="septembre 2026"
    >
      <p>
        Chiné (« nous ») édite une application de gestion de stock pour revendeurs de vêtements de
        seconde main. Cette politique décrit les données traitées lorsque tu utilises le service, et
        tes droits.
      </p>
      <h2>1. Données traitées</h2>
      <ul>
        <li>Compte : adresse e-mail, nom, mot de passe (haché), date de création.</li>
        <li>Contenu : pièces, sources, ventes, photos et notes que tu enregistres.</li>
        <li>
          Technique : journaux serveur (adresse IP tronquée, navigateur), nécessaires à la sécurité.
        </li>
        <li>
          Facturation : gérée par notre prestataire de paiement ; nous ne stockons aucun numéro de
          carte.
        </li>
      </ul>
      <h2>2. Finalités</h2>
      <p>
        Fournir le service (stock, sources, marge), l'améliorer, assurer sa sécurité et respecter
        nos obligations légales. Aucune donnée n'est vendue ni cédée à des fins publicitaires.
      </p>
      <h2>3. Expert IA</h2>
      <p>
        Lorsque tu demandes une estimation, la photo et les informations de la pièce sont transmises
        à un fournisseur de modèle d'IA pour produire une réponse. Elles ne servent pas à entraîner
        ses modèles.
      </p>
      <h2>4. Conservation</h2>
      <p>
        Tes données sont conservées tant que ton compte existe. Tu peux les exporter (CSV) et
        supprimer ton compte à tout moment depuis les réglages ; la suppression est effective sous
        30 jours.
      </p>
      <h2>5. Hébergement et sécurité</h2>
      <p>
        Les données sont hébergées dans l'Union européenne, chiffrées en transit et au repos.
        L'accès est limité aux personnes qui en ont besoin pour opérer le service.
      </p>
      <h2>6. Tes droits</h2>
      <p>
        Accès, rectification, effacement, portabilité, opposition : écris-nous à privacy@chine.app.
        Tu peux aussi saisir la CNIL.
      </p>
      <h2>7. Cookies</h2>
      <p>
        Chiné utilise uniquement des cookies strictement nécessaires (session). Aucun cookie
        publicitaire, aucun traceur tiers.
      </p>
    </LegalPage>
  );
}
