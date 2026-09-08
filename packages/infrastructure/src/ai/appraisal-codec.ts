/**
 * Codec des expertises : JSON (réponse IA ou colonne jsonb) ↔ types du domaine.
 * Le parseur est volontairement tolérant : un modèle de langage renvoie parfois un champ
 * manquant, une casse différente ou un montant en texte. On normalise, on ne plante pas.
 */
import {
  type Appraisal,
  type BuyAdvice,
  CATEGORIES,
  type Category,
  CONDITIONS,
  type Condition,
  type Currency,
  ERAS,
  type Era,
  type Identification,
  isCurrency,
  type ListingCopy,
  type MarketRead,
  Money,
  PLATFORMS,
  type Platform,
  type PriceEstimate,
} from "@chine/domain";

/** Corps d'une expertise (sans identité ni métadonnées de fournisseur). */
export type AppraisalBody = Pick<
  Appraisal,
  "identification" | "price" | "market" | "advice" | "listingCopy"
>;

const DEMANDS = ["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"] as const;
const TRENDS = ["RISING", "STABLE", "DECLINING"] as const;
const ACTIONS = ["STRONG_BUY", "BUY", "CONSIDER", "PASS"] as const;

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null;
const obj = (v: unknown): Json => (isObject(v) ? v : {});

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const strOrNull = (v: unknown): string | null => {
  const s = str(v);
  return s.length > 0 && s.toLowerCase() !== "null" ? s : null;
};
const num = (v: unknown, fallback: number): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === "boolean" ? v : fallback);
/** Score 0..1 : accepte aussi un pourcentage 0..100. */
const unit = (v: unknown, fallback: number): number => {
  const n = num(v, fallback);
  const scaled = n > 1 && n <= 100 ? n / 100 : n;
  return Math.min(1, Math.max(0, scaled));
};
const strings = (v: unknown): readonly string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter((s) => s.length > 0) : [];

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  if (typeof v !== "string") return fallback;
  const norm = v
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return allowed.find((a) => a.toUpperCase() === norm) ?? fallback;
}

/** Montant : `{ minor, currency }`, nombre décimal, ou texte ("25,00"). */
export function parseMoney(v: unknown, currency: Currency): Money | undefined {
  if (v === null || v === undefined) return undefined;
  if (Money.isMoneyLike(v)) {
    const minor = num(v.minor, Number.NaN);
    if (!Number.isFinite(minor)) return undefined;
    return Money.ofMinor(Math.round(minor), isCurrency(v.currency) ? v.currency : currency);
  }
  if (typeof v === "number") return Number.isFinite(v) ? Money.of(v, currency) : undefined;
  if (typeof v === "string") return Money.parse(v.replace(/[^\d,.\-\s]/g, ""), currency);
  if (isObject(v) && "amount" in v) return parseMoney(v["amount"], currency);
  return undefined;
}

function parseIdentification(raw: unknown): Identification {
  const r = obj(raw);
  return {
    brand: strOrNull(r["brand"]),
    brandConfidence: unit(r["brandConfidence"], 0.5),
    category: oneOf<Category>(r["category"], CATEGORIES, "OTHER"),
    model: strOrNull(r["model"]),
    era: oneOf<Era>(r["era"], ERAS, "UNKNOWN"),
    materials: strings(r["materials"]),
    colors: strings(r["colors"]),
    size: strOrNull(r["size"]),
    condition: oneOf<Condition>(r["condition"], CONDITIONS, "GOOD"),
    conditionNotes: strings(r["conditionNotes"]),
    isVintage: bool(r["isVintage"], false),
    notableFeatures: strings(r["notableFeatures"]),
  };
}

function parsePrice(raw: unknown, currency: Currency): PriceEstimate {
  const r = obj(raw);
  const mid = parseMoney(r["mid"], currency) ?? Money.zero(currency);
  const low = parseMoney(r["low"], currency) ?? mid;
  const high = parseMoney(r["high"], currency) ?? mid;
  const perPlatform = Array.isArray(r["perPlatform"])
    ? r["perPlatform"].flatMap((p) => {
        const e = obj(p);
        const price = parseMoney(e["price"], currency);
        if (!price) return [];
        return [
          {
            platform: oneOf<Platform>(e["platform"], PLATFORMS, "OTHER"),
            price,
            daysToSell: Math.max(0, Math.round(num(e["daysToSell"], 30))),
          },
        ];
      })
    : [];
  return {
    low: low.min(mid),
    mid,
    high: high.max(mid),
    retailNew: parseMoney(r["retailNew"], currency) ?? null,
    confidence: unit(r["confidence"], 0.5),
    perPlatform,
  };
}

function parseMarket(raw: unknown): MarketRead {
  const r = obj(raw);
  return {
    demand: oneOf(r["demand"], DEMANDS, "MEDIUM"),
    trend: oneOf(r["trend"], TRENDS, "STABLE"),
    rarity: unit(r["rarity"], 0.3),
    audience: strings(r["audience"]),
    seasonality: strOrNull(r["seasonality"]),
  };
}

function parseAdvice(raw: unknown, currency: Currency): BuyAdvice {
  const r = obj(raw);
  return {
    action: oneOf(r["action"], ACTIONS, "CONSIDER"),
    maxBuyPrice: parseMoney(r["maxBuyPrice"], currency) ?? null,
    reasons: strings(r["reasons"]),
    risk: unit(r["risk"], 0.5),
    sellingTips: strings(r["sellingTips"]),
  };
}

function parseListingCopy(raw: unknown): ListingCopy | null {
  if (!isObject(raw)) return null;
  const title = str(raw["title"]);
  const description = str(raw["description"]);
  if (!title && !description) return null;
  return {
    title,
    description,
    hashtags: strings(raw["hashtags"]).map((h) => (h.startsWith("#") ? h : `#${h}`)),
  };
}

/** Parse tolérant d'un corps d'expertise (réponse IA ou jsonb). */
export function parseAppraisalBody(raw: unknown, currency: Currency): AppraisalBody {
  const r = obj(raw);
  return {
    identification: parseIdentification(r["identification"]),
    price: parsePrice(r["price"], currency),
    market: parseMarket(r["market"]),
    advice: parseAdvice(r["advice"], currency),
    listingCopy: parseListingCopy(r["listingCopy"]),
  };
}

/** Sérialisation JSON stable (Money → `{ minor, currency }`). */
export function serializeAppraisalBody(body: AppraisalBody): Json {
  const m = (v: Money | null): { minor: number; currency: Currency } | null =>
    v ? v.toJSON() : null;
  return {
    identification: { ...body.identification },
    price: {
      low: m(body.price.low),
      mid: m(body.price.mid),
      high: m(body.price.high),
      retailNew: m(body.price.retailNew),
      confidence: body.price.confidence,
      perPlatform: body.price.perPlatform.map((p) => ({
        platform: p.platform,
        price: m(p.price),
        daysToSell: p.daysToSell,
      })),
    },
    market: { ...body.market },
    advice: { ...body.advice, maxBuyPrice: m(body.advice.maxBuyPrice) },
    listingCopy: body.listingCopy ? { ...body.listingCopy } : null,
  };
}
