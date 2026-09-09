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
      <h2>3. Formules, essai et paiement</h2>
      <p>
        La formule Gratuit est limitée en nombre de pièces en stock. Les formules Chineur et Pro
        sont facturées mensuellement ou annuellement, en euros toutes taxes comprises, par notre
        prestataire de paiement Stripe. Elles commencent par un essai gratuit de 14 jours sans moyen
        de paiement ; sans carte enregistrée à la fin de l'essai, l'abonnement s'arrête et la
        formule Gratuit s'applique, sans perte de données.
      </p>
      <p>
        L'abonnement est reconduit tacitement à chaque échéance jusqu'à résiliation. Tu peux
        résilier à tout moment depuis les réglages ou le portail de facturation : la formule reste
        active jusqu'à la fin de la période déjà payée, aucun remboursement au prorata n'est dû pour
        cette période. Les prix peuvent évoluer ; tout changement est annoncé au moins trente jours
        avant de s'appliquer à ton prochain renouvellement.
      </p>
      <h2>4. Droit de rétractation</h2>
      <p>
        Si tu es consommateur, tu disposes d'un délai de quatorze jours après la souscription pour
        te rétracter sans motif, par e-mail à bonjour@chine.app. En souscrivant, tu demandes
        expressément que le service commence pendant ce délai ; en cas de rétractation, le montant
        correspondant à la période déjà consommée reste dû, le reste est remboursé.
      </p>
      <h2>5. Contenu</h2>
      <p>
        Tu restes propriétaire des données et photos que tu enregistres. Tu nous accordes une
        licence limitée à leur hébergement et leur traitement pour fournir le service. Tu t'engages
        à ne pas enregistrer de contenu illicite.
      </p>
      <h2>6. Disponibilité et responsabilité</h2>
      <p>
        Nous faisons de notre mieux pour assurer la disponibilité du service, sans garantie de
        continuité. Les données saisies hors ligne sont synchronisées dès que le réseau le permet.
        Les estimations de l'expert IA et les grilles de frais sont fournies à titre indicatif : les
        conditions des plateformes de vente et tes obligations fiscales relèvent de ta
        responsabilité. Notre responsabilité est limitée aux sommes que tu nous as versées au cours
        des douze derniers mois.
      </p>
      <h2>7. Résiliation</h2>
      <p>
        Tu peux supprimer ton compte à tout moment. Nous pouvons suspendre un compte en cas de
        violation manifeste des présentes conditions, après notification.
      </p>
      <h2>8. Médiation et droit applicable</h2>
      <p>
        En cas de litige, écris-nous d'abord à bonjour@chine.app. Tu peux ensuite recourir
        gratuitement au médiateur de la consommation indiqué dans les mentions légales, ou à la
        plateforme européenne de règlement en ligne des litiges. Les présentes conditions sont
        soumises au droit français.
      </p>
    </LegalPage>
  );
}
