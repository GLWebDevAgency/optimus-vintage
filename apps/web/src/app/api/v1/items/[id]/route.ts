import { AddItemPhoto, DeleteItem, ReorderItemPhotos, UpdateItem } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId, asPhotoId } from "@chine/domain";
import { type ClearablePrice, clearItemPrices } from "@/lib/api/items";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { assertOwnedPhotoKeys } from "@/lib/api/photos";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

type Params = { id: string };

/**
 * `null` efface un champ texte ou énuméré : la valeur traverse le cas d'usage et l'agrégat
 * l'interprète comme une absence (persistée `NULL`, relue `undefined`). Les montants, eux,
 * passent par `clearItemPrices` (un montant absent signifie « inchangé » pour le cas d'usage).
 */
const clearable = <T>(v: T | null | undefined): T | undefined => v as T | undefined;
const money = <T>(v: T | null | undefined): T | undefined => (v === null ? undefined : v);

/** Détail d'une pièce : source, annonces actives, dernière expertise. */
export const GET = withAuth<Params>(async (req, ctx) => {
  const dto = await loadItem(ctx.deps, scopeOf(ctx), ctx.params.id, mapContextFor(req));
  return sendDto("GET /items/:id", routes.getItem.response, dto);
});

/**
 * Modifier une pièce. Les nouvelles photos (`addPhotoKeys`) sont rattachées puis l'ordre
 * final (`photoIds`) appliqué ; les identifiants inconnus sont ignorés par l'agrégat.
 */
export const PATCH = withAuth<Params>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.updateItem.body);
    assertOwnedPhotoKeys(ctx.workspaceId, body.addPhotoKeys ?? []);
    const scope = scopeOf(ctx);
    const itemId = asItemId(ctx.params.id);

    const updated = await new UpdateItem(deps).execute({
      ...scope,
      itemId,
      title: body.title,
      brand: clearable(body.brand),
      category: body.category,
      gender: clearable(body.gender),
      size: clearable(body.size),
      condition: body.condition,
      era: clearable(body.era),
      colors: body.colors,
      materials: body.materials,
      measurements: clearable(body.measurements),
      acquisitionCost: body.acquisitionCost,
      retailPrice: money(body.retailPrice),
      targetPrice: money(body.targetPrice),
      bin: clearable(body.bin),
      notes: clearable(body.notes),
    });
    if (!updated.ok) return fail(updated.error);

    const cleared: ClearablePrice[] = [];
    if (body.retailPrice === null) cleared.push("retailPrice");
    if (body.targetPrice === null) cleared.push("targetPrice");
    await clearItemPrices(deps, scope, ctx.params.id, cleared);

    for (const key of body.addPhotoKeys ?? []) {
      const added = await new AddItemPhoto(deps).execute({ ...scope, itemId, key });
      if (!added.ok) return fail(added.error);
    }
    if (body.photoIds && body.photoIds.length > 0) {
      const reordered = await new ReorderItemPhotos(deps).execute({
        ...scope,
        itemId,
        photoIds: body.photoIds.map(asPhotoId),
      });
      if (!reordered.ok) return fail(reordered.error);
    }

    const dto = await loadItem(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("PATCH /items/:id", routes.updateItem.response, dto);
  },
  { limit: { key: "items:update", max: 240, windowSeconds: 60 } },
);

/** Supprimer une pièce (photos retirées du stockage). */
export const DELETE = withAuth<Params>(
  async (_req, ctx) => {
    const result = await new DeleteItem(ctx.deps).execute({
      ...scopeOf(ctx),
      itemId: asItemId(ctx.params.id),
    });
    return sendResult(result, {
      route: "DELETE /items/:id",
      schema: routes.deleteItem.response,
      map: (out) => ({ id: out.itemId, deleted: true as const }),
    });
  },
  { limit: { key: "items:delete", max: 120, windowSeconds: 60 } },
);
