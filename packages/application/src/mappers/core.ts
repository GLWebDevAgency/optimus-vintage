import type { Listing, Money, PurchaseSource, Workspace } from "@chine/domain";
import type { ListingDto, MoneyDto, SourceDto, WorkspaceDto } from "../dto.js";

export const toMoneyDto = (m: Money): MoneyDto => m.toJSON();
export const toMoneyDtoOrNull = (m: Money | undefined | null): MoneyDto | null =>
  m ? m.toJSON() : null;
export const toIso = (d: Date): string => d.toISOString();
export const toIsoOrNull = (d: Date | undefined): string | null => (d ? d.toISOString() : null);

export function toWorkspaceDto(ws: Workspace): WorkspaceDto {
  return {
    id: ws.id,
    ownerId: ws.ownerId,
    name: ws.name,
    currency: ws.currency,
    locale: ws.locale,
    targetMargin: ws.targetMargin,
    plan: ws.plan,
    skuPrefix: ws.skuPrefix,
    createdAt: toIso(ws.createdAt),
  };
}

export function toSourceDto(s: PurchaseSource): SourceDto {
  return {
    id: s.id,
    workspaceId: s.workspaceId,
    kind: s.kind,
    name: s.name,
    supplierName: s.supplierName ?? null,
    supplierKind: s.supplierKind,
    purchasedAt: s.purchasedAt,
    goodsCost: toMoneyDto(s.goodsCost),
    extraCosts: toMoneyDto(s.extraCosts),
    totalInvestment: toMoneyDto(s.totalInvestment),
    announcedQuantity: s.announcedQuantity ?? null,
    receivedQuantity: s.receivedQuantity ?? null,
    effectiveQuantity: s.effectiveQuantity ?? null,
    averageUnitCost: toMoneyDtoOrNull(s.averageUnitCost),
    shrinkageRate: s.shrinkageRate ?? null,
    weightKg: s.weightKg ?? null,
    location: s.location ?? null,
    allocationPolicy: s.allocationPolicy,
    notes: s.notes ?? null,
    createdAt: toIso(s.createdAt),
    updatedAt: toIso(s.updatedAt),
  };
}

export function toListingDto(l: Listing): ListingDto {
  const p = l.toProps();
  return {
    id: p.id,
    itemId: p.itemId,
    platform: p.platform,
    price: toMoneyDto(p.price),
    listedAt: p.listedAt,
    url: p.url ?? null,
    status: p.status,
    endedAt: p.endedAt ?? null,
  };
}
