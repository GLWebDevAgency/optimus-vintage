/**
 * DTOs (read models) : objets simples, sérialisables en JSON.
 * Money → `{ minor, currency }`, dates → ISO 8601, absence → `null`.
 * Consommés par l'app web et la future app Expo.
 */
import type {
  AllocationPolicy,
  Category,
  Condition,
  Currency,
  Era,
  Feature,
  FeeSchedule,
  Gender,
  IsoDate,
  ItemId,
  ItemStatus,
  ListingId,
  ListingStatus,
  Measurements,
  Plan,
  Platform,
  QuotaResource,
  SaleId,
  SaleStatus,
  SourceId,
  SourceKind,
  SourceLocation,
  SupplierKind,
  TargetMargin,
  UserId,
  WorkspaceId,
} from "@chine/domain";

export type { AppraisalDto, BuyAdviceDto, PriceEstimateDto } from "./dto-appraisal.js";

export interface MoneyDto {
  readonly minor: number;
  readonly currency: Currency;
}

export interface WorkspaceDto {
  readonly id: WorkspaceId;
  readonly ownerId: UserId;
  readonly name: string;
  readonly currency: Currency;
  readonly locale: "fr" | "en" | "de";
  readonly targetMargin: TargetMargin;
  readonly plan: Plan;
  readonly skuPrefix: string;
  readonly createdAt: string;
}

export interface SourceDto {
  readonly id: SourceId;
  readonly workspaceId: WorkspaceId;
  readonly kind: SourceKind;
  readonly name: string;
  readonly supplierName: string | null;
  readonly supplierKind: SupplierKind;
  readonly purchasedAt: IsoDate;
  readonly goodsCost: MoneyDto;
  readonly extraCosts: MoneyDto;
  readonly totalInvestment: MoneyDto;
  readonly announcedQuantity: number | null;
  readonly receivedQuantity: number | null;
  readonly effectiveQuantity: number | null;
  readonly averageUnitCost: MoneyDto | null;
  readonly shrinkageRate: number | null;
  readonly weightKg: number | null;
  readonly location: SourceLocation | null;
  readonly allocationPolicy: AllocationPolicy;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PhotoDto {
  readonly id: string;
  readonly key: string;
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly blurhash: string | null;
}

export interface ItemDto {
  readonly id: ItemId;
  readonly workspaceId: WorkspaceId;
  readonly sourceId: SourceId;
  readonly sku: string;
  readonly title: string;
  readonly brand: string | null;
  readonly category: Category;
  readonly gender: Gender | null;
  readonly size: string | null;
  readonly condition: Condition;
  readonly era: Era | null;
  readonly colors: readonly string[];
  readonly materials: readonly string[];
  readonly measurements: Measurements | null;
  readonly acquisitionCost: MoneyDto;
  readonly retailPrice: MoneyDto | null;
  readonly targetPrice: MoneyDto | null;
  readonly status: ItemStatus;
  readonly isSellable: boolean;
  readonly photos: readonly PhotoDto[];
  readonly coverUrl: string | null;
  readonly bin: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly listedAt: string | null;
  readonly soldAt: string | null;
  /** Champs calculés pour l'affichage. */
  readonly discountVsRetail: number | null;
  readonly ageDays: number;
  readonly isDormant: boolean;
}

export interface ListingDto {
  readonly id: ListingId;
  readonly itemId: ItemId;
  readonly platform: Platform;
  readonly price: MoneyDto;
  readonly listedAt: IsoDate;
  readonly url: string | null;
  readonly status: ListingStatus;
  readonly endedAt: IsoDate | null;
}

export interface SaleEconomicsDto {
  readonly gross: MoneyDto;
  readonly fees: MoneyDto;
  readonly costs: MoneyDto;
  readonly net: MoneyDto;
  readonly margin: MoneyDto;
  readonly roi: number | null;
  readonly marginRate: number | null;
}

export interface SaleDto {
  readonly id: SaleId;
  readonly workspaceId: WorkspaceId;
  readonly itemId: ItemId;
  readonly sourceId: SourceId;
  readonly platform: Platform;
  readonly grossPrice: MoneyDto;
  readonly platformFees: MoneyDto;
  readonly shippingCost: MoneyDto;
  readonly packagingCost: MoneyDto;
  readonly otherCosts: MoneyDto;
  readonly acquisitionCost: MoneyDto;
  readonly soldAt: IsoDate;
  readonly status: SaleStatus;
  readonly buyer: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly refundedAt: string | null;
  readonly economics: SaleEconomicsDto;
}

/** Vente enrichie du résumé de la pièce vendue (listes). */
export interface SaleListEntryDto extends SaleDto {
  readonly item: {
    readonly id: ItemId;
    readonly sku: string;
    readonly title: string;
    readonly coverUrl: string | null;
  } | null;
}

export interface SourcePerformanceDto {
  readonly invested: MoneyDto;
  readonly recovered: MoneyDto;
  readonly remainingToRecover: MoneyDto;
  readonly profit: MoneyDto;
  readonly roi: number | null;
  readonly recoveryRate: number;
  readonly isAmortized: boolean;
  readonly soldCount: number;
  readonly sellableCount: number;
  readonly writtenOffCount: number;
  readonly stockValueAtCost: MoneyDto;
  readonly floorPriceBreakEven: MoneyDto | null;
  readonly floorPriceTarget: MoneyDto | null;
}

export interface PeriodReportDto {
  readonly from: IsoDate;
  readonly to: IsoDate;
  readonly salesCount: number;
  readonly gross: MoneyDto;
  readonly fees: MoneyDto;
  readonly costs: MoneyDto;
  readonly net: MoneyDto;
  readonly acquisition: MoneyDto;
  readonly margin: MoneyDto;
  readonly marginRate: number | null;
  readonly averageTicket: MoneyDto;
  readonly refundedCount: number;
  readonly byPlatform: ReadonlyArray<{
    readonly platform: Platform;
    readonly count: number;
    readonly net: MoneyDto;
    readonly margin: MoneyDto;
  }>;
  readonly byDay: ReadonlyArray<{
    readonly day: IsoDate;
    readonly net: MoneyDto;
    readonly margin: MoneyDto;
    readonly count: number;
  }>;
}

export interface PriceSimulationDto {
  readonly platform: Platform;
  readonly price: MoneyDto;
  readonly fees: MoneyDto;
  readonly net: MoneyDto;
  readonly margin: MoneyDto;
  readonly roi: number | null;
}

export interface GoalProgressDto {
  readonly target: MoneyDto;
  readonly achieved: MoneyDto;
  readonly remaining: MoneyDto;
  /** 0 → 1 (peut dépasser 1 quand l'objectif est battu). */
  readonly progress: number;
}

export interface DashboardDto {
  readonly period: { readonly from: IsoDate; readonly to: IsoDate };
  readonly current: PeriodReportDto;
  readonly previous: PeriodReportDto;
  /** Variations relatives vs période précédente (`null` si non calculable). */
  readonly change: {
    readonly gross: number | null;
    readonly net: number | null;
    readonly margin: number | null;
    readonly salesCount: number | null;
  };
  readonly countsByStatus: Readonly<Record<ItemStatus, number>>;
  readonly sellableCount: number;
  readonly dormantCount: number;
  readonly stockValueAtCost: MoneyDto;
  /** Objectif mensuel de marge, si un `goalMinor` a été fourni. */
  readonly goal: GoalProgressDto | null;
  readonly lastSales: readonly SaleListEntryDto[];
}

export interface QuotaUsageDto {
  readonly used: number;
  /** `null` = illimité. */
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly allowed: boolean;
  readonly upgradeTo: Plan | null;
}

export interface WorkspaceOverviewDto {
  readonly workspace: WorkspaceDto;
  readonly plan: Plan;
  readonly limits: {
    readonly maxItems: number | null;
    readonly maxSourcesPerMonth: number | null;
    readonly aiAppraisalsPerMonth: number | null;
    readonly historyMonths: number | null;
    readonly members: number;
  };
  readonly usage: Readonly<Record<QuotaResource, QuotaUsageDto>>;
  readonly features: readonly Feature[];
  readonly lockedFeatures: ReadonlyArray<{ readonly feature: Feature; readonly minimumPlan: Plan }>;
  readonly feeOverrides: Partial<Record<Platform, FeeSchedule>>;
  /** Grilles effectives (défaut + surcharges), prêtes pour l'affichage. */
  readonly feeSchedules: Readonly<Record<Platform, FeeSchedule>>;
}
