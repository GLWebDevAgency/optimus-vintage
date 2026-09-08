import type { Item, PeriodReport, PriceSimulation, Sale, SourcePerformance } from "@chine/domain";
import type {
  PeriodReportDto,
  PriceSimulationDto,
  SaleDto,
  SaleListEntryDto,
  SourcePerformanceDto,
} from "../dto.js";
import { toIso, toIsoOrNull, toMoneyDto, toMoneyDtoOrNull } from "./core.js";

export function toSaleDto(s: Sale): SaleDto {
  const p = s.toProps();
  const e = s.economics;
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    itemId: p.itemId,
    sourceId: p.sourceId,
    platform: p.platform,
    grossPrice: toMoneyDto(p.grossPrice),
    platformFees: toMoneyDto(p.platformFees),
    shippingCost: toMoneyDto(p.shippingCost),
    packagingCost: toMoneyDto(p.packagingCost),
    otherCosts: toMoneyDto(p.otherCosts),
    acquisitionCost: toMoneyDto(p.acquisitionCost),
    soldAt: p.soldAt,
    status: p.status,
    buyer: p.buyer ?? null,
    notes: p.notes ?? null,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt),
    refundedAt: toIsoOrNull(p.refundedAt),
    economics: {
      gross: toMoneyDto(e.gross),
      fees: toMoneyDto(e.fees),
      costs: toMoneyDto(e.costs),
      net: toMoneyDto(e.net),
      margin: toMoneyDto(e.margin),
      roi: e.roi ?? null,
      marginRate: e.marginRate ?? null,
    },
  };
}

export function toSaleListEntryDto(
  s: Sale,
  item: Item | undefined,
  publicUrl: (key: string) => string,
): SaleListEntryDto {
  const cover = item?.photos[0];
  return {
    ...toSaleDto(s),
    item: item
      ? {
          id: item.id,
          sku: item.sku,
          title: item.title,
          coverUrl: cover ? publicUrl(cover.key) : null,
        }
      : null,
  };
}

export function toPerformanceDto(p: SourcePerformance): SourcePerformanceDto {
  return {
    invested: toMoneyDto(p.invested),
    recovered: toMoneyDto(p.recovered),
    remainingToRecover: toMoneyDto(p.remainingToRecover),
    profit: toMoneyDto(p.profit),
    roi: p.roi ?? null,
    recoveryRate: p.recoveryRate,
    isAmortized: p.isAmortized,
    soldCount: p.soldCount,
    sellableCount: p.sellableCount,
    writtenOffCount: p.writtenOffCount,
    stockValueAtCost: toMoneyDto(p.stockValueAtCost),
    floorPriceBreakEven: toMoneyDtoOrNull(p.floorPriceBreakEven),
    floorPriceTarget: toMoneyDtoOrNull(p.floorPriceTarget),
  };
}

export function toPeriodReportDto(r: PeriodReport): PeriodReportDto {
  return {
    from: r.from,
    to: r.to,
    salesCount: r.salesCount,
    gross: toMoneyDto(r.gross),
    fees: toMoneyDto(r.fees),
    costs: toMoneyDto(r.costs),
    net: toMoneyDto(r.net),
    acquisition: toMoneyDto(r.acquisition),
    margin: toMoneyDto(r.margin),
    marginRate: r.marginRate ?? null,
    averageTicket: toMoneyDto(r.averageTicket),
    refundedCount: r.refundedCount,
    byPlatform: r.byPlatform.map((b) => ({
      platform: b.platform,
      count: b.count,
      net: toMoneyDto(b.net),
      margin: toMoneyDto(b.margin),
    })),
    byDay: r.byDay.map((b) => ({
      day: b.day,
      count: b.count,
      net: toMoneyDto(b.net),
      margin: toMoneyDto(b.margin),
    })),
  };
}

export function toSimulationDto(s: PriceSimulation): PriceSimulationDto {
  return {
    platform: s.platform,
    price: toMoneyDto(s.price),
    fees: toMoneyDto(s.fees),
    net: toMoneyDto(s.net),
    margin: toMoneyDto(s.margin),
    roi: s.roi ?? null,
  };
}
