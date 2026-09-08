import { GetItem, GetSource, type SaleListEntryDto, type WorkspaceScoped } from "@chine/application";
import type * as C from "@chine/contract";
import { asItemId, asSourceId, asUserId, asWorkspaceId, type WorkspaceId } from "@chine/domain";
import type { Container } from "@/lib/container";
import { itemSummariesByIds } from "@/lib/db/queries";
import { type MapContext, mapItem, mapItemSummary, mapSale, mapSource } from "./mappers";
import { publicOrigin } from "./request";
import type { AuthContext } from "./with-auth";

/**
 * Chargements composés, partagés par plusieurs routes : une pièce complète (source, annonces,
 * dernière expertise), une source avec sa performance, des ventes avec le résumé de leur pièce.
 */

export const scopeOf = (ctx: Pick<AuthContext, "workspaceId" | "userId">): WorkspaceScoped => ({
  workspaceId: asWorkspaceId(ctx.workspaceId),
  actorUserId: asUserId(ctx.userId),
});

export const mapContextFor = (req: Request): MapContext => ({ origin: publicOrigin(req) });

/** Pièce au format du contrat, avec nom de source, annonces actives et dernière expertise. */
export async function loadItem(
  deps: Container,
  scope: WorkspaceScoped,
  itemId: string,
  ctx: MapContext,
): Promise<C.ItemDto> {
  const result = await new GetItem(deps).execute({ ...scope, itemId: asItemId(itemId) });
  if (!result.ok) throw result.error;
  const { item, source, listings, appraisal } = result.value;
  return mapItem(item, ctx, {
    sourceName: source?.name,
    activeListings: listings,
    latestAppraisalId: appraisal?.id,
  });
}

/** Source au format du contrat (performance + nombre de pièces). */
export async function loadSource(
  deps: Container,
  scope: WorkspaceScoped,
  sourceId: string,
): Promise<C.SourceDto> {
  const result = await new GetSource(deps).execute({ ...scope, sourceId: asSourceId(sourceId) });
  if (!result.ok) throw result.error;
  const { source, performance, items } = result.value;
  return mapSource(source, performance, items.length);
}

/** Ventes enrichies du résumé de leur pièce (statut, vignette), en une seule lecture. */
export async function attachItemSummaries(
  deps: Container,
  workspaceId: WorkspaceId,
  sales: readonly SaleListEntryDto[],
  ctx: MapContext,
): Promise<C.SaleDto[]> {
  const summaries = await itemSummariesByIds(
    deps.database.db,
    workspaceId,
    sales.map((s) => s.itemId),
  );
  const publicUrl = (key: string) => deps.photos.publicUrl(key);
  return sales.map((s) => {
    const row = summaries.get(s.itemId);
    return mapSale(s, row ? mapItemSummary(row, ctx, publicUrl) : undefined);
  });
}
