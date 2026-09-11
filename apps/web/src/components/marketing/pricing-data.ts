import {
  INF,
  PLAN_LIMITS,
  PLAN_NAMES,
  PLAN_PRICES_EUR,
  PLAN_TRIAL_DAYS,
  type Plan,
  yearlyPerMonthMinor,
} from "@chine/domain";

/**
 * Cartes tarifaires du site et de l'app. Montants, limites et noms viennent du domaine
 * (`PLAN_PRICES_EUR`, `PLAN_LIMITS`, `PLAN_NAMES`) : une seule source de vérité pour la vitrine,
 * les réglages et l'API de facturation. Règle absolue : une carte ne promet que ce que l'app fait.
 */
export type PlanId = Plan;

export interface PlanFeature {
  label: string;
  /** Inclus dans la formule. */
  on: boolean;
  /** Mis en avant (première ligne). */
  lead?: boolean;
}

export interface PlanCard {
  id: PlanId;
  name: string;
  /** Prix TTC en centimes. */
  monthlyMinor: number;
  yearlyMinor: number;
  /** Prix mensuel équivalent en formule annuelle, en centimes. */
  yearlyPerMonthMinor: number;
  tagline: string;
  /** Qui est concerné, en une ligne. */
  audience: string;
  /** Formule mise en avant. */
  hot?: boolean;
  /** Formule en liste d'attente : pas d'achat, un bouton « Me prévenir ». */
  waitlist?: boolean;
  cta: string;
  features: PlanFeature[];
  /** Phrase d'ancrage : ce que la formule coûte rapporté à une vente. */
  payback?: string;
}

const limit = (plan: Plan) => PLAN_LIMITS[plan];
const price = (plan: Plan) => PLAN_PRICES_EUR[plan];
const fr = new Intl.NumberFormat("fr-FR");
/** « 3 lots », « 300 crédits IA », « lots illimités ». */
const n = (v: number, singular: string, plural: string, unlimited = `${plural} illimitées`) =>
  v === INF ? unlimited : `${fr.format(v)} ${v > 1 ? plural : singular}`;

export const TRIAL_DAYS = PLAN_TRIAL_DAYS;

export const PLANS: readonly PlanCard[] = [
  {
    id: "FREE",
    name: PLAN_NAMES.FREE,
    monthlyMinor: 0,
    yearlyMinor: 0,
    yearlyPerMonthMinor: 0,
    tagline: "Pour vider son dressing et chiner un peu.",
    audience: "Jusqu'à quelques ventes par semaine.",
    cta: "Commencer gratuitement",
    features: [
      {
        label: `${limit("FREE").maxItems} pièces en stock — une vente libère une place`,
        on: true,
        lead: true,
      },
      {
        label: `${n(limit("FREE").maxSourcesPerMonth, "lot ou palette", "lots ou palettes")} par mois, chine à l'unité illimitée`,
        on: true,
      },
      {
        label: `${n(limit("FREE").aiCreditsPerMonth, "crédit IA", "crédits IA")} par mois : expertise photo, texte d'annonce prêt à coller`,
        on: true,
      },
      { label: "Sources, marge réelle et prix plancher", on: true },
      { label: "Hors ligne, dans la poche", on: true },
      { label: "Export CSV à tout moment", on: true },
      { label: "Textes d'annonce et analytique", on: false },
    ],
  },
  {
    id: "PREMIUM",
    name: PLAN_NAMES.PREMIUM,
    monthlyMinor: price("PREMIUM").monthlyMinor,
    yearlyMinor: price("PREMIUM").yearlyMinor,
    yearlyPerMonthMinor: yearlyPerMonthMinor("PREMIUM"),
    tagline: "Pour vendre chaque semaine.",
    audience: "Lots Fleek, palettes, brocantes tous les dimanches.",
    hot: true,
    cta: `Essayer ${PLAN_TRIAL_DAYS} jours gratuits`,
    payback: "Remboursé par une seule pièce vendue 10 € de plus que prévu.",
    features: [
      { label: `${fr.format(limit("PREMIUM").maxItems)} pièces en stock`, on: true, lead: true },
      { label: "Lots et palettes illimités", on: true },
      {
        label: `${n(limit("PREMIUM").aiCreditsPerMonth, "crédit IA", "crédits IA")} par mois : expertise photo, texte d'annonce prêt à coller`,
        on: true,
      },
      { label: "Textes d'annonce par IA (Vinted, Vestiaire, eBay, Leboncoin)", on: true },
      { label: "Analytique : taux d'écoulement, délai de vente, meilleures sources", on: true },
      { label: "Rapport mensuel imprimable (PDF)", on: true },
      { label: "Export comptable et étiquettes QR", on: false },
    ],
  },
  {
    id: "PRO",
    name: PLAN_NAMES.PRO,
    monthlyMinor: price("PRO").monthlyMinor,
    yearlyMinor: price("PRO").yearlyMinor,
    yearlyPerMonthMinor: yearlyPerMonthMinor("PRO"),
    tagline: "Pour en vivre.",
    audience: "Micro-entrepreneur, friperie en ligne, Vinted Pro.",
    cta: `Essayer ${PLAN_TRIAL_DAYS} jours gratuits`,
    payback: "Moins de 0,15 € par vente à partir de cent ventes par mois.",
    features: [
      { label: "Pièces en stock illimitées", on: true, lead: true },
      { label: `Tout ${PLAN_NAMES.PREMIUM}`, on: true },
      {
        label: `${n(limit("PRO").aiCreditsPerMonth, "crédit IA", "crédits IA")} par mois : expertise photo, texte d'annonce prêt à coller`,
        on: true,
      },
      { label: "Export comptable : journal des ventes, chiffre d'affaires à déclarer", on: true },
      { label: "Étiquettes QR imprimables, scan pour ouvrir la pièce", on: true },
      { label: "Support prioritaire", on: true },
    ],
  },
  {
    id: "BUSINESS",
    name: PLAN_NAMES.BUSINESS,
    monthlyMinor: price("BUSINESS").monthlyMinor,
    yearlyMinor: price("BUSINESS").yearlyMinor,
    yearlyPerMonthMinor: yearlyPerMonthMinor("BUSINESS"),
    tagline: "Pour l'équipe.",
    audience: "Friperie physique, dépôt-vente, plusieurs personnes.",
    waitlist: true,
    cta: "Rejoindre la liste d'attente",
    features: [
      { label: `Tout ${PLAN_NAMES.PRO}`, on: true, lead: true },
      { label: `Jusqu'à ${limit("BUSINESS").members} membres`, on: true },
      { label: "Accès API", on: true },
      { label: "Marque personnalisée sur les étiquettes et rapports", on: true },
    ],
  },
];

export const FAQ: readonly { q: string; a: string }[] = [
  {
    q: `Que se passe-t-il à ${limit("FREE").maxItems} pièces ?`,
    a: `La limite porte sur les pièces en stock, pas sur ce que tu as vendu : chaque vente libère une place. Au-delà, tu gardes tout (lecture, ventes, exports) et la capture attend une place ou le passage à ${PLAN_NAMES.PREMIUM}. Rien n'est jamais supprimé.`,
  },
  {
    q: "Ça marche vraiment sans réseau, dans une cave de vide-grenier ?",
    a: "Oui. Chiné est une application installable (PWA). Photo, prix d'achat, lieu : tout est enregistré sur ton téléphone et synchronisé dès que le réseau revient. La pastille « Sync plus tard » te dit ce qui attend.",
  },
  {
    q: "C'est quoi, une « source » ?",
    a: "Un lot, une palette, un ballot ou une chine à l'unité : l'endroit d'où viennent tes pièces et ce qu'il t'a coûté. Chaque source se rembourse au fil rouge, vente après vente, et se tamponne « amortie » une fois rentabilisée.",
  },
  {
    q: "Les frais de plateforme sont-ils à jour ?",
    a: "Les grilles par défaut suivent les conditions de septembre 2026 (Vinted et eBay sans frais vendeur pour les particuliers, Vestiaire 17 % + 3 %, Etsy, Depop, Whatnot). Tu peux les ajuster par plateforme dans les réglages, par exemple pour Vinted Pro.",
  },
  {
    q: "L'expert IA, il fait quoi exactement ?",
    a: "Il reconnaît la marque, la coupe et l'époque sur ta photo, évalue l'état, propose une fourchette de prix par plateforme et un conseil d'achat. Tu confirmes, tu corriges : c'est toi qui décides. Il existe dès la formule gratuite.",
  },
  {
    q: "Mes données m'appartiennent ?",
    a: "Oui. Export CSV et JSON à tout moment, même en Gratuit. Aucune revente de données, hébergement en Europe, suppression du compte en un geste depuis les réglages.",
  },
  {
    q: "Puis-je essayer, changer de formule ou annuler ?",
    a: `${PLAN_TRIAL_DAYS} jours d'essai sans carte bancaire sur ${PLAN_NAMES.PREMIUM} et ${PLAN_NAMES.PRO}. Changement ou annulation à tout moment depuis les réglages ; en cas d'annulation tu gardes l'accès jusqu'à la fin de la période payée, puis tes données restent lisibles.`,
  },
];
