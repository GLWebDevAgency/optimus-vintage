import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/LegalPage";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description: "Les règles d'usage du service Chiné.",
};

export default function CguPage() {
  return (
    <LegalPage
      eyebrow="Légal · CGU"
      title="Conditions générales d'utilisation"
      updated="septembre 2026"
    >
      <p>
        En créant un compte Chiné, tu acceptes les présentes conditions. Elles encadrent
        l'utilisation de l'application web, installable et hors ligne, et des services associés.
      </p>
      <h2>1. Le service</h2>
      <p>
        Chiné permet d'enregistrer des pièces, des sources d'approvisionnement et des ventes, de
        calculer des marges et des prix planchers, et d'obtenir des estimations assistées par IA.
        Ces estimations sont indicatives : la décision d'achat ou de vente t'appartient.
      </p>
      <h2>2. Compte</h2>
      <p>
        Une adresse e-mail valide et un mot de passe sont requis. Tu es responsable de la
        confidentialité de tes identifiants et de l'activité de ton compte.
      </p>
      <h2>3. Formules et paiement</h2>
      <p>
        La formule Free est gratuite. Les formules Premium, Pro et Business sont facturées
        mensuellement ou annuellement, sans engagement, renouvelées automatiquement jusqu'à
        résiliation. Les prix sont indiqués en euros, taxes comprises.
      </p>
      <h2>4. Contenu</h2>
      <p>
        Tu restes propriétaire des données et photos que tu enregistres. Tu nous accordes une
        licence limitée à leur hébergement et leur traitement pour fournir le service. Tu t'engages
        à ne pas enregistrer de contenu illicite.
      </p>
      <h2>5. Disponibilité</h2>
      <p>
        Nous faisons de notre mieux pour assurer la disponibilité du service, sans garantie de
        continuité. Les données saisies hors ligne sont synchronisées dès que le réseau le permet.
      </p>
      <h2>6. Résiliation</h2>
      <p>
        Tu peux supprimer ton compte à tout moment. Nous pouvons suspendre un compte en cas de
        violation manifeste des présentes conditions, après notification.
      </p>
      <h2>7. Droit applicable</h2>
      <p>Les présentes conditions sont soumises au droit français.</p>
    </LegalPage>
  );
}
