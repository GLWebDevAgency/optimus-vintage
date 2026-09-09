/**
 * Plans, limites et fonctionnalités. Données du produit, pas du code : la grille se relit d'un coup d'œil.
 *
 * Modèle : le plan gratuit est limité par le nombre de pièces suivies **en stock** (vendues, sorties et
 * perdues ne comptent plus : une vente libère une place). Les plans payants relèvent la limite et
 * débloquent le suivi complet (IA, analytique, exports, étiquettes). Les codes de plan sont stables
 * (base, Stripe, i18n) ; les noms affichés vivent dans `PLAN_NAMES`.
 */
export const PLANS = ["FREE", "PREMIUM", "PRO", "BUSINESS"] as const;
export type Plan = (typeof PLANS)[number];

/** Noms commerciaux (français). Les autres langues passent par i18n. */
export const PLAN_NAMES: Readonly<Record<Plan, string>> = {
  FREE: "Gratuit",
  PREMIUM: "Chineur",
  PRO: "Pro",
  BUSINESS: "Atelier",
};

/**
 * Disponibilité à la vente. `BUSINESS` (équipes, API, marque) est sur liste d'attente tant que ses
 * fonctionnalités ne sont pas livrées : il n'est ni affiché en achat ni proposé comme upgrade.
 */
export const PLAN_AVAILABILITY: Readonly<Record<Plan, "free" | "sale" | "waitlist">> = {
  FREE: "free",
  PREMIUM: "sale",
  PRO: "sale",
  BUSINESS: "waitlist",
};

export const PURCHASABLE_PLANS: readonly Plan[] = PLANS.filter(
  (p) => PLAN_AVAILABILITY[p] === "sale",
);

export const FEATURES = [
  "AI_APPRAISAL",
  "AI_LISTING_COPY",
  "ADVANCED_ANALYTICS",
  "PDF_REPORTS",
  "CSV_EXPORT",
  "ACCOUNTING_EXPORT",
  "QR_LABELS",
  "API_ACCESS",
  "MULTI_USER",
  "CUSTOM_BRANDING",
] as const;
export type Feature = (typeof FEATURES)[number];

export interface PlanLimits {
  /** Pièces en stock (IN_STOCK, LISTED, RESERVED, RETURNED) suivies simultanément. */
  readonly maxItems: number;
  /** Sources LOT / PALLET / PICKING créées par mois civil (les achats à l'unité ne comptent pas). */
  readonly maxSourcesPerMonth: number;
  /**
   * Crédits IA par mois civil. Chaque action IA coûte un nombre de crédits (`AI_CREDIT_COST`) ;
   * une expertise photo en coûte un. Jamais illimité : le coût d'inférence est réel.
   */
  readonly aiCreditsPerMonth: number;
  readonly members: number;
  readonly features: ReadonlySet<Feature>;
}

/**
 * Actions IA décomptées en crédits. `PHOTO_STUDIO` (fond et lumière professionnels) n'est pas
 * encore livré : son coût est réservé pour que les quotas n'aient pas à changer à sa sortie.
 */
export const AI_ACTIONS = ["APPRAISAL", "LISTING_COPY", "PHOTO_STUDIO"] as const;
export type AiAction = (typeof AI_ACTIONS)[number];
export const AI_CREDIT_COST: Readonly<Record<AiAction, number>> = {
  /** Expertise photo complète ; le texte d'annonce demandé dans le même appel est inclus. */
  APPRAISAL: 1,
  /** Régénération d'un texte d'annonce seul (sans image) pour une autre plateforme. */
  LISTING_COPY: 1,
  /** Photo studio : fond et lumière professionnels (génération d'image). */
  PHOTO_STUDIO: 3,
};

const F = (...f: Feature[]): ReadonlySet<Feature> => new Set(f);
export const INF = Number.POSITIVE_INFINITY;

export const PLAN_LIMITS: Readonly<Record<Plan, PlanLimits>> = {
  FREE: {
    maxItems: 50,
    maxSourcesPerMonth: 3,
    aiCreditsPerMonth: 10,
    members: 1,
    features: F("AI_APPRAISAL", "CSV_EXPORT"),
  },
  PREMIUM: {
    maxItems: 500,
    maxSourcesPerMonth: INF,
    aiCreditsPerMonth: 100,
    members: 1,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
    ),
  },
  PRO: {
    maxItems: INF,
    maxSourcesPerMonth: INF,
    aiCreditsPerMonth: 300,
    members: 1,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
      "ACCOUNTING_EXPORT",
      "QR_LABELS",
    ),
  },
  BUSINESS: {
    maxItems: INF,
    maxSourcesPerMonth: INF,
    aiCreditsPerMonth: 1000,
    members: 5,
    features: F(
      "AI_APPRAISAL",
      "AI_LISTING_COPY",
      "ADVANCED_ANALYTICS",
      "PDF_REPORTS",
      "CSV_EXPORT",
      "ACCOUNTING_EXPORT",
      "QR_LABELS",
      "API_ACCESS",
      "MULTI_USER",
      "CUSTOM_BRANDING",
    ),
  },
};

export type BillingInterval = "monthly" | "yearly";

/** Prix TTC en centimes d'euro (jamais de flottant pour de l'argent). */
export interface PlanPrice {
  readonly monthlyMinor: number;
  readonly yearlyMinor: number;
}

export const PLAN_PRICES_EUR: Readonly<Record<Plan, PlanPrice>> = {
  FREE: { monthlyMinor: 0, yearlyMinor: 0 },
  PREMIUM: { monthlyMinor: 699, yearlyMinor: 5_900 },
  PRO: { monthlyMinor: 1_499, yearlyMinor: 12_900 },
  BUSINESS: { monthlyMinor: 3_499, yearlyMinor: 29_900 },
};

/** Essai gratuit (sans carte) sur les plans payants, géré par Stripe. */
export const PLAN_TRIAL_DAYS = 14;

/** Prix mensuel équivalent de la formule annuelle, en centimes (arrondi au centime). */
export const yearlyPerMonthMinor = (plan: Plan): number =>
  Math.round(PLAN_PRICES_EUR[plan].yearlyMinor / 12);

/** Économie de la formule annuelle par rapport à 12 mois, en centimes. */
export const yearlySavingMinor = (plan: Plan): number =>
  PLAN_PRICES_EUR[plan].monthlyMinor * 12 - PLAN_PRICES_EUR[plan].yearlyMinor;

const ORDER: Readonly<Record<Plan, number>> = { FREE: 0, PREMIUM: 1, PRO: 2, BUSINESS: 3 };
export const planAtLeast = (plan: Plan, min: Plan): boolean => ORDER[plan] >= ORDER[min];
export const hasFeature = (plan: Plan, feature: Feature): boolean =>
  PLAN_LIMITS[plan].features.has(feature);
/** Plan minimal qui débloque une fonctionnalité. */
export const minimumPlanFor = (feature: Feature): Plan =>
  PLANS.find((p) => hasFeature(p, feature)) ?? "BUSINESS";

export type QuotaResource = "items" | "sourcesPerMonth" | "aiCreditsPerMonth" | "members";

export interface QuotaDecision {
  readonly allowed: boolean;
  /** Consommation constatée (pièces en stock, sources du mois…). */
  readonly used: number;
  /** Limite du plan ; `Infinity` = illimité (sérialisé `null` par la couche application). */
  readonly limit: number;
  /** Premier plan **achetable** dont la limite couvre `used + 1`. */
  readonly upgradeTo?: Plan;
}

const limitOf = (plan: Plan, resource: QuotaResource): number => {
  const l = PLAN_LIMITS[plan];
  switch (resource) {
    case "items":
      return l.maxItems;
    case "sourcesPerMonth":
      return l.maxSourcesPerMonth;
    case "aiCreditsPerMonth":
      return l.aiCreditsPerMonth;
    case "members":
      return l.members;
  }
};

/**
 * Peut-on consommer `cost` unité(s) de plus ? `used` est la consommation actuelle : autorisé tant
 * que `used + cost <= limit`. Propose le premier plan achetable qui accepterait `used + cost`.
 */
export function checkQuota(
  plan: Plan,
  resource: QuotaResource,
  used: number,
  cost = 1,
): QuotaDecision {
  const limit = limitOf(plan, resource);
  const allowed = used + cost <= limit;
  if (allowed) return { allowed, used, limit };
  const upgradeTo = PLANS.find(
    (p) =>
      ORDER[p] > ORDER[plan] &&
      PLAN_AVAILABILITY[p] === "sale" &&
      used + cost <= limitOf(p, resource),
  );
  return upgradeTo ? { allowed, used, limit, upgradeTo } : { allowed, used, limit };
}

/** Pièces en stock au-delà de la limite du plan (après une rétrogradation) ; 0 sinon. */
export const overQuotaBy = (plan: Plan, resource: QuotaResource, used: number): number =>
  Math.max(0, used - limitOf(plan, resource));
