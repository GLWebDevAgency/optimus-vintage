// TODO(lead): sourcer depuis `PLAN_PRICES_EUR` / `PLAN_LIMITS` de @chine/domain (valeurs identiques).
export type PlanId = "FREE" | "PREMIUM" | "PRO" | "BUSINESS";

export interface PlanCard {
  id: PlanId;
  name: string;
  monthly: number;
  /** Annuel = 10 mois (−2 mois offerts). */
  yearly: number;
  tagline: string;
  hot?: boolean;
  cta: string;
  features: { label: string; on: boolean }[];
}

export const PLANS: readonly PlanCard[] = [
  {
    id: "FREE",
    name: "Free",
    monthly: 0,
    yearly: 0,
    tagline: "Pour commencer à chiner.",
    cta: "Commencer gratuitement",
    features: [
      { label: "60 pièces en stock", on: true },
      { label: "5 sources par mois", on: true },
      { label: "8 estimations IA par mois", on: true },
      { label: "6 mois d'historique", on: true },
      { label: "Export CSV", on: true },
      { label: "Analytique avancée", on: false },
      { label: "Étiquettes QR", on: false },
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    monthly: 5.99,
    yearly: 59,
    tagline: "Stock illimité, IA au quotidien.",
    hot: true,
    cta: "Passer Premium",
    features: [
      { label: "Pièces et sources illimitées", on: true },
      { label: "150 estimations IA par mois", on: true },
      { label: "Historique illimité", on: true },
      { label: "Textes d'annonce par IA", on: true },
      { label: "Analytique avancée + PDF", on: true },
      { label: "Export comptable", on: false },
      { label: "Étiquettes QR", on: false },
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    monthly: 14.99,
    yearly: 149,
    tagline: "Pour vivre de la revente.",
    cta: "Passer Pro",
    features: [
      { label: "Tout Premium", on: true },
      { label: "Estimations IA illimitées", on: true },
      { label: "Export comptable", on: true },
      { label: "Étiquettes QR et colis", on: true },
      { label: "Accès API", on: true },
      { label: "Jusqu'à 5 membres", on: false },
      { label: "Marque personnalisée", on: false },
    ],
  },
  {
    id: "BUSINESS",
    name: "Business",
    monthly: 34.99,
    yearly: 349,
    tagline: "Friperie, dépôt-vente, équipe.",
    cta: "Passer Business",
    features: [
      { label: "Tout Pro", on: true },
      { label: "Jusqu'à 5 membres", on: true },
      { label: "Marque personnalisée", on: true },
      { label: "Espaces de travail multiples", on: true },
      { label: "Support prioritaire", on: true },
      { label: "Accès API", on: true },
      { label: "Étiquettes QR et colis", on: true },
    ],
  },
];

export const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Ça marche vraiment sans réseau, dans une cave de vide-grenier ?",
    a: "Oui. Chiné est une application installable (PWA). Photo, prix d'achat, lieu : tout est enregistré sur ton téléphone et synchronisé dès que le réseau revient. La pastille « Sync plus tard » te dit ce qui attend.",
  },
  {
    q: "C'est quoi, une « source » ?",
    a: "Un lot, une palette, un ballot ou une chine à l'unité : l'endroit d'où viennent tes pièces et ce qu'il t'a coûté. Chaque source se rembourse au fil rouge, vente après vente, et se tamponne « amortie » une fois rentabilisée.",
  },
  {
    q: "Comment est calculé le prix plancher ?",
    a: "À partir du coût réel de la pièce (achat, part de la source, port, emballage, frais de plateforme) et de la marge que tu vises. En dessous du plancher, tu perds de l'argent : Chiné te le dit avant que tu baisses le prix.",
  },
  {
    q: "L'expert IA, il fait quoi exactement ?",
    a: "Il reconnaît la marque, la coupe et l'époque sur ta photo, propose une fourchette de prix et rédige un texte d'annonce. Tu confirmes, tu corriges : c'est toi qui décides.",
  },
  {
    q: "Mes données m'appartiennent ?",
    a: "Oui. Export CSV à tout moment, même en Free. Aucune revente de données, hébergement en Europe, suppression du compte en un geste.",
  },
  {
    q: "Puis-je changer de formule ou annuler ?",
    a: "À tout moment, depuis les réglages. La formule annuelle offre deux mois. En cas d'annulation, tu gardes l'accès jusqu'à la fin de la période payée.",
  },
];
