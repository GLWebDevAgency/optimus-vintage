import type * as App from "@chine/application";
import type * as C from "@chine/contract";
import type { Plan } from "@chine/domain";
import type { ItemSummaryRow, WorkspacePreferences } from "@/lib/db/queries";
import { absoluteUrl } from "./request";

/**
 * Conversion des DTOs de la couche application (absence = `null`, URL relatives possibles)
 * vers les DTOs du contrat HTTP (absence = clé omise, URL absolues).
 * Aucune logique métier ici : uniquement de la forme.
 */

/** `null` → clé omise (le contrat modélise l'absence par `optional()`). */
const opt = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

export interface MapContext {
  /** Origine publique de l'app, pour rendre absolues les URL de photos locales. */
  readonly origin: string;
}

/* ───────────── Photos, annonces, pièces ───────────── */

export function mapPhoto(p: App.PhotoDto, ctx: MapContext): C.PhotoDto {
  return {
    id: p.id,
    key: p.key,
    url: absoluteUrl(p.url, ctx.origin),
    width: opt(p.width),
    height: opt(p.height),
    blurhash: opt(p.blurhash),
  };
}

export function mapListing(l: App.ListingDto): C.ListingDto {
  return {
    id: l.id,
    itemId: l.itemId,
    platform: l.platform,
    price: l.price,
    listedAt: l.listedAt,
    url: opt(l.url),
    status: l.status,
    endedAt: opt(l.endedAt),
  };
}

export interface ItemExtras {
  readonly sourceName?: string | undefined;
  readonly activeListings?: readonly App.ListingDto[] | undefined;
  readonly latestAppraisalId?: string | undefined;
}

export function mapItem(item: App.ItemDto, ctx: MapContext, extras: ItemExtras = {}): C.ItemDto {
  const photos = item.photos.map((p) => mapPhoto(p, ctx));
  return {
    id: item.id,
    workspaceId: item.workspaceId,
    sourceId: item.sourceId,
    sku: item.sku,
    title: item.title,
    brand: opt(item.brand),
    category: item.category,
    gender: opt(item.gender),
    size: opt(item.size),
    condition: item.condition,
    era: opt(item.era),
    colors: [...item.colors],
    materials: [...item.materials],
    measurements: opt(item.measurements),
    acquisitionCost: item.acquisitionCost,
    retailPrice: opt(item.retailPrice),
    targetPrice: opt(item.targetPrice),
    status: item.status,
    photos,
    photoUrls: photos.map((p) => p.url),
    bin: opt(item.bin),
    notes: opt(item.notes),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    listedAt: opt(item.listedAt),
    soldAt: opt(item.soldAt),
    discountVsRetail: item.discountVsRetail === null ? undefined : clamp01(item.discountVsRetail),
    ageDays: Math.max(0, item.ageDays),
    isDormant: item.isDormant,
    activeListings: (extras.activeListings ?? [])
      .filter((l) => l.status === "ACTIVE")
      .map(mapListing),
    sourceName: extras.sourceName,
    latestAppraisalId: extras.latestAppraisalId,
  };
}

/* ───────────── Ventes ───────────── */

export function mapItemSummary(
  row: ItemSummaryRow,
  ctx: MapContext,
  publicUrl: (key: string) => string,
): C.ItemSummaryDto {
  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    brand: opt(row.brand),
    thumbnailUrl: row.coverKey ? absoluteUrl(publicUrl(row.coverKey), ctx.origin) : undefined,
    status: row.status,
  };
}

export function mapSale(sale: App.SaleDto, item?: C.ItemSummaryDto): C.SaleDto {
  const e = sale.economics;
  return {
    id: sale.id,
    workspaceId: sale.workspaceId,
    itemId: sale.itemId,
    sourceId: sale.sourceId,
    platform: sale.platform,
    grossPrice: sale.grossPrice,
    platformFees: sale.platformFees,
    shippingCost: sale.shippingCost,
    packagingCost: sale.packagingCost,
    otherCosts: sale.otherCosts,
    acquisitionCost: sale.acquisitionCost,
    soldAt: sale.soldAt,
    status: sale.status,
    buyer: opt(sale.buyer),
    notes: opt(sale.notes),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    refundedAt: opt(sale.refundedAt),
    economics: {
      gross: e.gross,
      fees: e.fees,
      costs: e.costs,
      net: e.net,
      margin: e.margin,
      roi: opt(e.roi),
      marginRate: opt(e.marginRate),
    },
    item,
  };
}

/* ───────────── Sources ───────────── */

export function mapPerformance(p: App.SourcePerformanceDto): C.SourcePerformanceDto {
  return {
    invested: p.invested,
    recovered: p.recovered,
    remainingToRecover: p.remainingToRecover,
    profit: p.profit,
    roi: opt(p.roi),
    recoveryRate: Math.max(0, p.recoveryRate),
    isAmortized: p.isAmortized,
    soldCount: p.soldCount,
    sellableCount: p.sellableCount,
    writtenOffCount: p.writtenOffCount,
    stockValueAtCost: p.stockValueAtCost,
    floorPriceBreakEven: opt(p.floorPriceBreakEven),
    floorPriceTarget: opt(p.floorPriceTarget),
  };
}

export function mapSource(
  s: App.SourceDto,
  performance: App.SourcePerformanceDto,
  itemCount: number,
): C.SourceDto {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    kind: s.kind,
    name: s.name,
    supplierName: opt(s.supplierName),
    supplierKind: s.supplierKind,
    purchasedAt: s.purchasedAt,
    goodsCost: s.goodsCost,
    extraCosts: s.extraCosts,
    totalInvestment: s.totalInvestment,
    announcedQuantity: opt(s.announcedQuantity),
    receivedQuantity: opt(s.receivedQuantity),
    effectiveQuantity: opt(s.effectiveQuantity),
    averageUnitCost: opt(s.averageUnitCost),
    weightKg: opt(s.weightKg),
    location: s.location
      ? { label: s.location.label, ...(s.location.point ? { point: s.location.point } : {}) }
      : undefined,
    allocationPolicy: s.allocationPolicy,
    notes: opt(s.notes),
    shrinkageRate: s.shrinkageRate === null ? undefined : clamp01(s.shrinkageRate),
    itemCount,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    performance: mapPerformance(performance),
  };
}

/* ───────────── Tableau de bord ───────────── */

export function mapPeriodStats(r: App.PeriodReportDto): C.PeriodStatsDto {
  return {
    salesCount: r.salesCount,
    gross: r.gross,
    net: r.net,
    margin: r.margin,
    marginRate: opt(r.marginRate),
    averageTicket: r.averageTicket,
    refundedCount: r.refundedCount,
    byPlatform: r.byPlatform.map((p) => ({
      platform: p.platform,
      count: p.count,
      net: p.net,
      margin: p.margin,
    })),
    byDay: r.byDay.map((d) => ({ day: d.day, net: d.net, margin: d.margin, count: d.count })),
  };
}

export function mapDashboard(
  d: App.DashboardDto,
  lastSales: readonly C.SaleDto[],
  label: string,
): C.DashboardDto {
  return {
    period: { from: d.period.from, to: d.period.to, label },
    current: mapPeriodStats(d.current),
    previous: mapPeriodStats(d.previous),
    change: {
      net: opt(d.change.net),
      margin: opt(d.change.margin),
      salesCount: opt(d.change.salesCount),
    },
    counts: {
      inStock: d.countsByStatus.IN_STOCK,
      listed: d.countsByStatus.LISTED,
      reserved: d.countsByStatus.RESERVED,
      sold: d.countsByStatus.SOLD,
      dormant: d.dormantCount,
    },
    stockValueAtCost: d.stockValueAtCost,
    goal: d.goal
      ? {
          targetMinor: d.goal.target.minor,
          currency: d.goal.target.currency,
          progress: Math.max(0, d.goal.progress),
        }
      : undefined,
    lastSales: [...lastSales],
  };
}

/* ───────────── Espace de travail ───────────── */

export function mapWorkspace(ws: App.WorkspaceDto, prefs: WorkspacePreferences): C.WorkspaceDto {
  return {
    id: ws.id,
    name: ws.name,
    currency: ws.currency,
    locale: ws.locale,
    targetMargin: ws.targetMargin,
    plan: ws.plan,
    skuPrefix: ws.skuPrefix,
    createdAt: ws.createdAt,
    dormantThresholdDays: prefs.dormantThresholdDays,
    monthlyGoal:
      prefs.monthlyGoalMinor === null
        ? undefined
        : { minor: prefs.monthlyGoalMinor, currency: ws.currency },
  };
}

export interface OverviewUser {
  readonly id: string;
  readonly email: string;
  readonly name?: string | null | undefined;
  readonly image?: string | null | undefined;
}

const isHttpUrl = (s: string): boolean => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

const quota = (u: App.QuotaUsageDto): C.QuotaUsageDto => ({ used: u.used, limit: u.limit });

export function mapOverview(
  o: App.WorkspaceOverviewDto,
  user: OverviewUser,
  prefs: WorkspacePreferences,
  billing: { readonly portalAvailable: boolean },
): C.WorkspaceOverviewDto {
  const plan: Plan = o.plan;
  return {
    workspace: mapWorkspace(o.workspace, prefs),
    user: {
      id: user.id,
      email: user.email,
      name: user.name?.trim() ? user.name.trim() : undefined,
      avatarUrl: user.image && isHttpUrl(user.image) ? user.image : undefined,
      role: "OWNER",
    },
    quotas: {
      items: quota(o.usage.items),
      sourcesPerMonth: quota(o.usage.sourcesPerMonth),
      aiAppraisalsPerMonth: quota(o.usage.aiAppraisalsPerMonth),
      members: quota(o.usage.members),
    },
    features: [...o.features],
    feeOverrides: { ...o.feeOverrides },
    feeSchedules: { ...o.feeSchedules },
    billing: { plan, portalAvailable: billing.portalAvailable },
    workspaces: [{ id: o.workspace.id, name: o.workspace.name, role: "OWNER" }],
  };
}

/* ───────────── Expertise IA ───────────── */

export function mapAppraisal(a: App.AppraisalDto, usage?: App.QuotaUsageDto): C.AppraisalDto {
  return {
    id: a.id,
    workspaceId: a.workspaceId,
    itemId: opt(a.itemId),
    provider: a.provider,
    model: a.model,
    createdAt: a.createdAt,
    identification: {
      ...a.identification,
      materials: [...a.identification.materials],
      colors: [...a.identification.colors],
      conditionNotes: [...a.identification.conditionNotes],
      notableFeatures: [...a.identification.notableFeatures],
    },
    price: {
      low: a.price.low,
      mid: a.price.mid,
      high: a.price.high,
      retailNew: a.price.retailNew,
      confidence: clamp01(a.price.confidence),
      perPlatform: a.price.perPlatform.map((p) => ({
        platform: p.platform,
        price: p.price,
        daysToSell: Math.max(0, Math.round(p.daysToSell)),
      })),
    },
    market: { ...a.market, audience: [...a.market.audience], rarity: clamp01(a.market.rarity) },
    advice: {
      action: a.advice.action,
      maxBuyPrice: a.advice.maxBuyPrice,
      reasons: [...a.advice.reasons],
      risk: clamp01(a.advice.risk),
      sellingTips: [...a.advice.sellingTips],
    },
    listingCopy: a.listingCopy ? { ...a.listingCopy, hashtags: [...a.listingCopy.hashtags] } : null,
    latencyMs: Math.max(0, a.latencyMs),
    quota: usage && usage.limit !== null ? { used: usage.used, limit: usage.limit } : undefined,
  };
}

/* ───────────── Upload ───────────── */

export function mapUploadTarget(
  t: App.PrepareUploadOutput,
  ctx: MapContext,
  expiresAt: string | undefined,
): C.UploadTargetDto {
  return {
    key: t.key,
    uploadUrl: absoluteUrl(t.uploadUrl, ctx.origin),
    method: t.method,
    headers: t.headers,
    publicUrl: absoluteUrl(t.publicUrl, ctx.origin),
    expiresAt,
  };
}
