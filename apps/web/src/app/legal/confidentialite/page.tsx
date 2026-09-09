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
          Technique : journaux serveur (identifiant de requête, code de réponse, durée) et compteurs
          de limitation de débit par adresse IP, purgés automatiquement sous 24 heures. Aucune
          adresse IP n'est conservée dans les journaux applicatifs.
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
        Tes données sont conservées tant que ton compte existe. Tu peux les exporter (CSV pour le
        tableur, JSON complet) et supprimer ton compte à tout moment depuis les réglages : la
        suppression des données, des photos, des sessions et de l'abonnement est immédiate. Les
        photos peuvent subsister quelques jours dans les caches des réseaux de diffusion.
      </p>
      <h2>5. Hébergement et sécurité</h2>
      <p>
        La base de données est hébergée par Railway et les photos par Cloudflare (R2), sur des
        régions situées dans l'Union européenne ; ces prestataires sont établis aux États-Unis et
        interviennent comme sous-traitants, avec les clauses contractuelles types de la Commission
        européenne. Les e-mails transactionnels sont envoyés par Resend, les paiements traités par
        Stripe (aucun numéro de carte ne transite par nos serveurs), et les erreurs techniques
        remontées à Sentry sans donnée personnelle. Tout est chiffré en transit ; l'accès est limité
        aux personnes qui opèrent le service.
      </p>
      <h2>6. Responsable du traitement et tes droits</h2>
      <p>
        Le responsable du traitement est l'éditeur indiqué dans les{" "}
        <a href="/legal/mentions-legales">mentions légales</a>. Accès, rectification, effacement,
        portabilité, limitation, opposition : écris à bonjour@chine.app. Réponse sous un mois. Tu
        peux aussi saisir la CNIL (cnil.fr).
      </p>
      <h2>7. Cookies</h2>
      <p>
        Chiné utilise uniquement des cookies strictement nécessaires (session). Aucun cookie
        publicitaire, aucun traceur tiers.
      </p>
    </LegalPage>
  );
}
