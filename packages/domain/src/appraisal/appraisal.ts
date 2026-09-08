import type { Money } from "../money/money.js";
import type { Category, Condition, Era } from "../inventory/item.js";
import type { Platform } from "../listing/platforms.js";
import type { AppraisalId, ItemId, WorkspaceId } from "../shared/ids.js";

/** Résultat d'une expertise IA sur photo. Produit par un port (Gemini, Claude, ou un faux en dev). */
export interface Identification {
  readonly brand: string | null;
  readonly brandConfidence: number;
  readonly category: Category;
  readonly model: string | null;
  readonly era: Era;
  readonly materials: readonly string[];
  readonly colors: readonly string[];
  readonly size: string | null;
  readonly condition: Condition;
  readonly conditionNotes: readonly string[];
  readonly isVintage: boolean;
  readonly notableFeatures: readonly string[];
}
export interface PriceEstimate {
  readonly low: Money;
  readonly mid: Money;
  readonly high: Money;
  readonly retailNew: Money | null;
  readonly confidence: number;
  readonly perPlatform: ReadonlyArray<{ platform: Platform; price: Money; daysToSell: number }>;
}
export interface MarketRead {
  readonly demand: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
  readonly trend: "RISING" | "STABLE" | "DECLINING";
  readonly rarity: number;
  readonly audience: readonly string[];
  readonly seasonality: string | null;
}
export interface BuyAdvice {
  readonly action: "STRONG_BUY" | "BUY" | "CONSIDER" | "PASS";
  readonly maxBuyPrice: Money | null;
  readonly reasons: readonly string[];
  readonly risk: number;
  readonly sellingTips: readonly string[];
}
export interface ListingCopy {
  readonly title: string;
  readonly description: string;
  readonly hashtags: readonly string[];
}
export interface Appraisal {
  readonly id: AppraisalId;
  readonly workspaceId: WorkspaceId;
  readonly itemId?: ItemId;
  readonly provider: string;
  readonly model: string;
  readonly createdAt: Date;
  readonly identification: Identification;
  readonly price: PriceEstimate;
  readonly market: MarketRead;
  readonly advice: BuyAdvice;
  readonly listingCopy: ListingCopy | null;
  readonly latencyMs: number;
}
