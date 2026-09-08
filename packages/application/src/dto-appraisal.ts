/** DTOs de l'expertise IA (séparés pour garder `dto.ts` lisible ; ré-exportés depuis `dto.ts`). */
import type {
  AppraisalId,
  Identification,
  ItemId,
  ListingCopy,
  MarketRead,
  Platform,
  WorkspaceId,
} from "@chine/domain";
import type { MoneyDto } from "./dto.js";

export interface PriceEstimateDto {
  readonly low: MoneyDto;
  readonly mid: MoneyDto;
  readonly high: MoneyDto;
  readonly retailNew: MoneyDto | null;
  readonly confidence: number;
  readonly perPlatform: ReadonlyArray<{
    readonly platform: Platform;
    readonly price: MoneyDto;
    readonly daysToSell: number;
  }>;
}
export interface BuyAdviceDto {
  readonly action: "STRONG_BUY" | "BUY" | "CONSIDER" | "PASS";
  readonly maxBuyPrice: MoneyDto | null;
  readonly reasons: readonly string[];
  readonly risk: number;
  readonly sellingTips: readonly string[];
}
export interface AppraisalDto {
  readonly id: AppraisalId;
  readonly workspaceId: WorkspaceId;
  readonly itemId: ItemId | null;
  readonly provider: string;
  readonly model: string;
  readonly createdAt: string;
  readonly identification: Identification;
  readonly price: PriceEstimateDto;
  readonly market: MarketRead;
  readonly advice: BuyAdviceDto;
  readonly listingCopy: ListingCopy | null;
  readonly latencyMs: number;
}
