import type { Item } from "@chine/domain";
import type { ItemDto, PhotoDto } from "../dto.js";
import { toIso, toIsoOrNull, toMoneyDto, toMoneyDtoOrNull } from "./core.js";

export interface ItemDtoContext {
  readonly now: Date;
  readonly publicUrl: (key: string) => string;
  readonly dormantThresholdDays?: number;
}

export function toItemDto(item: Item, ctx: ItemDtoContext): ItemDto {
  const p = item.toProps();
  const photos: PhotoDto[] = p.photos.map((ph) => ({
    id: ph.id,
    key: ph.key,
    url: ctx.publicUrl(ph.key),
    width: ph.width ?? null,
    height: ph.height ?? null,
    blurhash: ph.blurhash ?? null,
  }));
  return {
    id: p.id,
    workspaceId: p.workspaceId,
    sourceId: p.sourceId,
    sku: p.sku,
    title: p.title,
    brand: p.brand ?? null,
    category: p.category,
    gender: p.gender ?? null,
    size: p.size ?? null,
    condition: p.condition,
    era: p.era ?? null,
    colors: [...p.colors],
    materials: [...p.materials],
    measurements: p.measurements ?? null,
    acquisitionCost: toMoneyDto(p.acquisitionCost),
    retailPrice: toMoneyDtoOrNull(p.retailPrice),
    targetPrice: toMoneyDtoOrNull(p.targetPrice),
    status: p.status,
    isSellable: item.isSellable,
    photos,
    coverUrl: photos[0]?.url ?? null,
    bin: p.bin ?? null,
    notes: p.notes ?? null,
    createdAt: toIso(p.createdAt),
    updatedAt: toIso(p.updatedAt),
    listedAt: toIsoOrNull(p.listedAt),
    soldAt: toIsoOrNull(p.soldAt),
    discountVsRetail: item.discountVsRetail() ?? null,
    ageDays: item.ageInDays(ctx.now),
    isDormant: item.isDormant(ctx.now, ctx.dormantThresholdDays ?? 30),
  };
}
