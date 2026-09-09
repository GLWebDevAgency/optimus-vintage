/** DTOs de réponse : formes des agrégats + champs calculés côté serveur. */
import { z } from "zod";
import {
  FeeScheduleDto,
  GeoPointDto,
  IdDto,
  IsoDateDto,
  IsoDateTimeDto,
  LocationDto,
  MeasurementsDto,
  MoneyDto,
  TargetMarginDto,
} from "./common";
import {
  AllocationPolicyDto,
  CategoryDto,
  ConditionDto,
  CurrencyDto,
  EraDto,
  FeatureDto,
  GenderDto,
  ItemStatusDto,
  ListingStatusDto,
  LocaleDto,
  MemberRoleDto,
  PlanDto,
  PlatformDto,
  SaleStatusDto,
  SourceKindDto,
  SupplierKindDto,
} from "./enums";

/* ───────────── Photos & annonces ───────────── */

export const PhotoDto = z.object({
  id: IdDto,
  key: z.string(),
  url: z.url(),
  thumbnailUrl: z.url().optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  blurhash: z.string().optional(),
});
export type PhotoDto = z.infer<typeof PhotoDto>;

export const ListingDto = z.object({
  id: IdDto,
  itemId: IdDto,
  platform: PlatformDto,
  price: MoneyDto,
  listedAt: IsoDateDto,
  url: z.url().optional(),
  status: ListingStatusDto,
  endedAt: IsoDateDto.optional(),
});
export type ListingDto = z.infer<typeof ListingDto>;

/* ───────────── Pièce ───────────── */

export const ItemDto = z.object({
  id: IdDto,
  workspaceId: IdDto,
  sourceId: IdDto,
  sku: z.string(),
  title: z.string(),
  brand: z.string().optional(),
  category: CategoryDto,
  gender: GenderDto.optional(),
  size: z.string().optional(),
  condition: ConditionDto,
  era: EraDto.optional(),
  colors: z.array(z.string()),
  materials: z.array(z.string()),
  measurements: MeasurementsDto.optional(),
  acquisitionCost: MoneyDto,
  retailPrice: MoneyDto.optional(),
  targetPrice: MoneyDto.optional(),
  status: ItemStatusDto,
  photos: z.array(PhotoDto),
  /** Raccourci : URLs des photos dans l'ordre. */
  photoUrls: z.array(z.url()),
  bin: z.string().optional(),
  notes: z.string().optional(),
  createdAt: IsoDateTimeDto,
  updatedAt: IsoDateTimeDto,
  listedAt: IsoDateTimeDto.optional(),
  soldAt: IsoDateTimeDto.optional(),
  /** Décote face au neuf : 0.7 = −70 %. */
  discountVsRetail: z.number().min(0).max(1).optional(),
  ageDays: z.number().int().min(0),
  isDormant: z.boolean(),
  activeListings: z.array(ListingDto).default([]),
  /** Nom de la source (dénormalisé pour les listes). */
  sourceName: z.string().optional(),
  latestAppraisalId: IdDto.optional(),
});
export type ItemDto = z.infer<typeof ItemDto>;

/** Résumé d'une pièce pour les listes de ventes, le tableau de bord. */
export const ItemSummaryDto = z.object({
  id: IdDto,
  sku: z.string(),
  title: z.string(),
  brand: z.string().optional(),
  thumbnailUrl: z.url().optional(),
  status: ItemStatusDto,
});
export type ItemSummaryDto = z.infer<typeof ItemSummaryDto>;

/* ───────────── Source ───────────── */

export const SourcePerformanceDto = z.object({
  invested: MoneyDto,
  recovered: MoneyDto,
  remainingToRecover: MoneyDto,
  profit: MoneyDto,
  roi: z.number().optional(),
  /** 1 = 100 % remboursée ; peut dépasser 1. */
  recoveryRate: z.number().min(0),
  isAmortized: z.boolean(),
  soldCount: z.number().int().min(0),
  sellableCount: z.number().int().min(0),
  writtenOffCount: z.number().int().min(0),
  stockValueAtCost: MoneyDto,
  floorPriceBreakEven: MoneyDto.optional(),
  floorPriceTarget: MoneyDto.optional(),
});
export type SourcePerformanceDto = z.infer<typeof SourcePerformanceDto>;

export const SourceDto = z.object({
  id: IdDto,
  workspaceId: IdDto,
  kind: SourceKindDto,
  name: z.string(),
  supplierName: z.string().optional(),
  supplierKind: SupplierKindDto,
  purchasedAt: IsoDateDto,
  goodsCost: MoneyDto,
  extraCosts: MoneyDto,
  totalInvestment: MoneyDto,
  announcedQuantity: z.number().int().optional(),
  receivedQuantity: z.number().int().optional(),
  effectiveQuantity: z.number().int().optional(),
  averageUnitCost: MoneyDto.optional(),
  weightKg: z.number().optional(),
  location: LocationDto.optional(),
  allocationPolicy: AllocationPolicyDto,
  notes: z.string().optional(),
  shrinkageRate: z.number().min(0).max(1).optional(),
  itemCount: z.number().int().min(0),
  createdAt: IsoDateTimeDto,
  updatedAt: IsoDateTimeDto,
  performance: SourcePerformanceDto,
});
export type SourceDto = z.infer<typeof SourceDto>;

/* ───────────── Vente ───────────── */

export const SaleEconomicsDto = z.object({
  gross: MoneyDto,
  fees: MoneyDto,
  costs: MoneyDto,
  net: MoneyDto,
  margin: MoneyDto,
  roi: z.number().optional(),
  marginRate: z.number().optional(),
});
export type SaleEconomicsDto = z.infer<typeof SaleEconomicsDto>;

export const SaleDto = z.object({
  id: IdDto,
  workspaceId: IdDto,
  itemId: IdDto,
  sourceId: IdDto,
  platform: PlatformDto,
  grossPrice: MoneyDto,
  platformFees: MoneyDto,
  shippingCost: MoneyDto,
  packagingCost: MoneyDto,
  otherCosts: MoneyDto,
  acquisitionCost: MoneyDto,
  soldAt: IsoDateDto,
  status: SaleStatusDto,
  buyer: z.string().optional(),
  notes: z.string().optional(),
  createdAt: IsoDateTimeDto,
  updatedAt: IsoDateTimeDto,
  refundedAt: IsoDateTimeDto.optional(),
  economics: SaleEconomicsDto,
  item: ItemSummaryDto.optional(),
  /** Numéro lisible de la vente (#0231). */
  number: z.number().int().positive().optional(),
});
export type SaleDto = z.infer<typeof SaleDto>;

/* ───────────── Expertise IA ───────────── */

export const IdentificationDto = z.object({
  brand: z.string().nullable(),
  brandConfidence: z.number().min(0).max(1),
  category: CategoryDto,
  model: z.string().nullable(),
  era: EraDto,
  materials: z.array(z.string()),
  colors: z.array(z.string()),
  size: z.string().nullable(),
  condition: ConditionDto,
  conditionNotes: z.array(z.string()),
  isVintage: z.boolean(),
  notableFeatures: z.array(z.string()),
});
export const PriceEstimateDto = z.object({
  low: MoneyDto,
  mid: MoneyDto,
  high: MoneyDto,
  retailNew: MoneyDto.nullable(),
  confidence: z.number().min(0).max(1),
  perPlatform: z.array(
    z.object({ platform: PlatformDto, price: MoneyDto, daysToSell: z.number().int().min(0) }),
  ),
});
export const MarketReadDto = z.object({
  demand: z.enum(["VERY_HIGH", "HIGH", "MEDIUM", "LOW", "VERY_LOW"]),
  trend: z.enum(["RISING", "STABLE", "DECLINING"]),
  rarity: z.number().min(0).max(1),
  audience: z.array(z.string()),
  seasonality: z.string().nullable(),
});
export const BuyAdviceDto = z.object({
  action: z.enum(["STRONG_BUY", "BUY", "CONSIDER", "PASS"]),
  maxBuyPrice: MoneyDto.nullable(),
  reasons: z.array(z.string()),
  risk: z.number().min(0).max(1),
  sellingTips: z.array(z.string()),
});
export const ListingCopyDto = z.object({
  title: z.string(),
  description: z.string(),
  hashtags: z.array(z.string()),
});
export const AppraisalDto = z.object({
  id: IdDto,
  workspaceId: IdDto,
  itemId: IdDto.optional(),
  provider: z.string(),
  model: z.string(),
  createdAt: IsoDateTimeDto,
  identification: IdentificationDto,
  price: PriceEstimateDto,
  market: MarketReadDto,
  advice: BuyAdviceDto,
  listingCopy: ListingCopyDto.nullable(),
  latencyMs: z.number().int().min(0),
  /** Quota IA restant sur le mois après cette expertise. */
  quota: z.object({ used: z.number().int().min(0), limit: z.number() }).optional(),
});
export type IdentificationDto = z.infer<typeof IdentificationDto>;
export type PriceEstimateDto = z.infer<typeof PriceEstimateDto>;
export type MarketReadDto = z.infer<typeof MarketReadDto>;
export type BuyAdviceDto = z.infer<typeof BuyAdviceDto>;
export type ListingCopyDto = z.infer<typeof ListingCopyDto>;
export type AppraisalDto = z.infer<typeof AppraisalDto>;

/* ───────────── Tableau de bord ───────────── */

export const PeriodStatsDto = z.object({
  salesCount: z.number().int().min(0),
  gross: MoneyDto,
  net: MoneyDto,
  margin: MoneyDto,
  marginRate: z.number().optional(),
  averageTicket: MoneyDto,
  refundedCount: z.number().int().min(0).default(0),
  byPlatform: z.array(
    z.object({ platform: PlatformDto, count: z.number().int(), net: MoneyDto, margin: MoneyDto }),
  ),
  byDay: z.array(
    z.object({ day: IsoDateDto, net: MoneyDto, margin: MoneyDto, count: z.number().int() }),
  ),
});
export type PeriodStatsDto = z.infer<typeof PeriodStatsDto>;

export const AnalyticsDto = z.object({
  sellThroughRate: z.number().min(0).max(1).nullable(),
  averageDaysToSell: z.number().min(0).nullable(),
  medianDaysToSell: z.number().min(0).nullable(),
  topPlatforms: z.array(
    z.object({
      platform: PlatformDto,
      count: z.number().int(),
      margin: MoneyDto,
      marginRate: z.number().nullable(),
    }),
  ),
  topSources: z.array(
    z.object({ sourceId: IdDto, name: z.string(), count: z.number().int(), margin: MoneyDto }),
  ),
  topBrands: z.array(z.object({ brand: z.string(), count: z.number().int(), margin: MoneyDto })),
});
export type AnalyticsDto = z.infer<typeof AnalyticsDto>;

export const DashboardDto = z.object({
  period: z.object({ from: IsoDateDto, to: IsoDateDto, label: z.string().optional() }),
  current: PeriodStatsDto,
  previous: PeriodStatsDto,
  /** Variations relatives vs période précédente (0.18 = +18 %). */
  change: z.object({
    net: z.number().optional(),
    margin: z.number().optional(),
    salesCount: z.number().optional(),
  }),
  counts: z.object({
    inStock: z.number().int().min(0),
    listed: z.number().int().min(0),
    reserved: z.number().int().min(0),
    sold: z.number().int().min(0),
    dormant: z.number().int().min(0),
  }),
  stockValueAtCost: MoneyDto.optional(),
  goal: z
    .object({
      targetMinor: z.number().int().min(0),
      currency: CurrencyDto,
      /** 0..1 (peut dépasser 1 si l'objectif est battu). */
      progress: z.number().min(0),
    })
    .optional(),
  /** Analytique avancée ; `null` quand le plan ne l'inclut pas. */
  analytics: AnalyticsDto.nullable().optional(),
  lastSales: z.array(SaleDto),
});
export type DashboardDto = z.infer<typeof DashboardDto>;

/* ───────────── Espace de travail ───────────── */

export const QuotaUsageDto = z.object({
  used: z.number().int().min(0),
  /** `null` = illimité. */
  limit: z.number().int().min(0).nullable(),
  /** Unités restantes (`null` = illimité). */
  remaining: z.number().int().min(0).nullable().optional(),
  /** Une unité de plus est-elle acceptée ? */
  allowed: z.boolean().optional(),
  /** Premier plan achetable qui accepterait une unité de plus. */
  upgradeTo: PlanDto.nullable().optional(),
});
export type QuotaUsageDto = z.infer<typeof QuotaUsageDto>;

export const WorkspaceDto = z.object({
  id: IdDto,
  name: z.string(),
  currency: CurrencyDto,
  locale: LocaleDto,
  targetMargin: TargetMarginDto,
  plan: PlanDto,
  skuPrefix: z.string(),
  createdAt: IsoDateTimeDto,
  dormantThresholdDays: z.number().int().min(1).default(30),
  monthlyGoal: MoneyDto.optional(),
});
export type WorkspaceDto = z.infer<typeof WorkspaceDto>;

export const WorkspaceOverviewDto = z.object({
  workspace: WorkspaceDto,
  user: z.object({
    id: IdDto,
    email: z.email(),
    name: z.string().optional(),
    avatarUrl: z.url().optional(),
    role: MemberRoleDto,
  }),
  quotas: z.object({
    items: QuotaUsageDto,
    sourcesPerMonth: QuotaUsageDto,
    aiAppraisalsPerMonth: QuotaUsageDto,
    members: QuotaUsageDto,
  }),
  features: z.array(FeatureDto),
  feeOverrides: z.partialRecord(PlatformDto, FeeScheduleDto),
  /** Grilles effectives (défaut + surcharges) telles qu'appliquées aux ventes. */
  feeSchedules: z.partialRecord(PlatformDto, FeeScheduleDto).optional(),
  billing: z.object({
    plan: PlanDto,
    /** Statut Stripe : essai, actif, impayé (délai de grâce), terminé. */
    status: z.enum(["trialing", "active", "past_due", "canceled", "none"]).optional(),
    interval: z.enum(["monthly", "yearly"]).optional(),
    renewsAt: IsoDateTimeDto.optional(),
    cancelAtPeriodEnd: z.boolean().optional(),
    trialEndsAt: IsoDateTimeDto.optional(),
    portalAvailable: z.boolean(),
  }),
  workspaces: z.array(z.object({ id: IdDto, name: z.string(), role: MemberRoleDto })).default([]),
});
export type WorkspaceOverviewDto = z.infer<typeof WorkspaceOverviewDto>;

export const UploadTargetDto = z.object({
  key: z.string(),
  uploadUrl: z.url(),
  method: z.enum(["PUT", "POST"]),
  headers: z.record(z.string(), z.string()).optional(),
  publicUrl: z.url().optional(),
  expiresAt: IsoDateTimeDto.optional(),
});
export type UploadTargetDto = z.infer<typeof UploadTargetDto>;

export const RedirectDto = z.object({ url: z.url() });
export type RedirectDto = z.infer<typeof RedirectDto>;

/* ───────────── Compte (RGPD) ───────────── */

const JsonObjectDto = z.record(z.string(), z.unknown());

/** Export portable d'un espace de travail (format `chine.workspace-export`, version 1). */
export const WorkspaceExportDto = z.object({
  format: z.literal("chine.workspace-export"),
  version: z.literal(1),
  exportedAt: IsoDateTimeDto,
  workspace: JsonObjectDto,
  members: z.array(z.object({ userId: IdDto, role: MemberRoleDto, createdAt: IsoDateTimeDto })),
  feeOverrides: JsonObjectDto,
  monthlyGoalMinor: z.number().int().nullable(),
  sources: z.array(JsonObjectDto),
  items: z.array(JsonObjectDto),
  listings: z.array(JsonObjectDto),
  sales: z.array(JsonObjectDto),
  appraisals: z.array(JsonObjectDto),
});
export type WorkspaceExportDto = z.infer<typeof WorkspaceExportDto>;

export const AccountDeletedDto = z.object({
  userId: IdDto,
  deleted: z.literal(true),
  deletedWorkspaceIds: z.array(IdDto),
});
export type AccountDeletedDto = z.infer<typeof AccountDeletedDto>;

export { GeoPointDto };
