import {
  CreateItem,
  type CreateItemCommand,
  DeleteItem,
  DeletePurchaseSource,
  ListItems,
} from "@chine/application";
import type { CreateItemQuickCaptureCommand, CreateItemStandardCommand } from "@chine/contract";
import { routes } from "@chine/contract";
import {
  asAppraisalId,
  asItemId,
  asSourceId,
  asWorkspaceId,
  type SourceLocation,
} from "@chine/domain";
import { ClientIdConflict } from "@chine/infrastructure";
import type { z } from "zod";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { mapItem } from "@/lib/api/mappers";
import { assertOwnedPhotoKeys } from "@/lib/api/photos";
import { fail } from "@/lib/api/respond";
import { parseBody, parseQuery, sendDto } from "@/lib/api/route";
import { type AuthContext, withAuth } from "@/lib/api/with-auth";
import { readWorkspacePreferences } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Stock : filtres statut, source, recherche, dormant ; nom de la source dénormalisé. */
export const GET = withAuth(async (req, ctx) => {
  const { deps } = ctx;
  const query = parseQuery(req, routes.listItems.query);
  const workspaceId = asWorkspaceId(ctx.workspaceId);
  const prefs = await readWorkspacePreferences(deps.database.db, workspaceId);
  const result = await new ListItems(deps).execute({
    ...scopeOf(ctx),
    status: query.status,
    sourceId: query.sourceId ? asSourceId(query.sourceId) : undefined,
    search: query.search,
    dormantOnly: query.dormantOnly,
    dormantThresholdDays: prefs.dormantThresholdDays,
    sort: query.sort,
    limit: query.limit,
    offset: query.offset,
  });
  if (!result.ok) return fail(result.error);
  const sources = await deps.sources.list(workspaceId, { limit: 500 });
  const names = new Map(sources.map((s) => [s.id as string, s.name]));
  const mapCtx = mapContextFor(req);
  return sendDto("GET /items", routes.listItems.response, {
    items: result.value.items.map((i) => mapItem(i, mapCtx, { sourceName: names.get(i.sourceId) })),
    total: result.value.total,
    limit: query.limit,
    offset: query.offset,
  });
});

type Body = z.output<typeof routes.createItem.body>;
type Scope = ReturnType<typeof scopeOf>;

const locationFrom = (
  c: z.output<typeof CreateItemQuickCaptureCommand>,
): SourceLocation | undefined => {
  const point = c.lat !== undefined && c.lng !== undefined ? { lat: c.lat, lng: c.lng } : undefined;
  const label = c.locationLabel?.trim() || (point ? `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}` : "");
  if (!label) return undefined;
  return point ? { label, point } : { label };
};

const standardCommand = (
  scope: Scope,
  c: z.output<typeof CreateItemStandardCommand>,
): CreateItemCommand => ({
  ...scope,
  sourceId: asSourceId(c.sourceId),
  appraisalId: c.appraisalId ? asAppraisalId(c.appraisalId) : undefined,
  title: c.title,
  brand: c.brand,
  category: c.category,
  gender: c.gender,
  size: c.size,
  condition: c.condition,
  era: c.era,
  colors: c.colors,
  materials: c.materials,
  measurements: c.measurements,
  acquisitionCost: c.acquisitionCost,
  retailPrice: c.retailPrice,
  targetPrice: c.targetPrice,
  photos: (c.photoKeys ?? []).map((key) => ({ key })),
  bin: c.bin,
  notes: c.notes,
});

const quickCaptureCommand = (
  scope: Scope,
  c: z.output<typeof CreateItemQuickCaptureCommand>,
): CreateItemCommand => ({
  ...scope,
  quickCapture: {
    pricePaid: c.pricePaid,
    supplierKind: c.supplierKind,
    location: locationFrom(c),
    purchasedAt: c.purchasedAt,
  },
  appraisalId: c.appraisalId ? asAppraisalId(c.appraisalId) : undefined,
  title: c.title,
  brand: c.brand,
  category: c.category,
  condition: c.condition,
  size: c.size,
  targetPrice: c.targetPrice,
  retailPrice: c.retailPrice,
  photos: c.photoKeys.map((key) => ({ key })),
  notes: c.notes,
});

const toCommand = (scope: Scope, body: Body): CreateItemCommand =>
  body.mode === "standard" ? standardCommand(scope, body) : quickCaptureCommand(scope, body);

/**
 * Création idempotente par `clientId` (capture hors ligne rejouée) : si une pièce porte déjà cet
 * identifiant, on la renvoie (200). Sinon on crée puis on rattache l'identifiant ; si un rejeu
 * concurrent a gagné la course, la pièce en trop (et sa source unitaire) sont supprimées et
 * c'est la première qui est renvoyée.
 */
async function createIdempotent(ctx: AuthContext, scope: Scope, body: Body) {
  const { deps } = ctx;
  const workspaceId = asWorkspaceId(ctx.workspaceId);
  const clientId = body.mode === "quickCapture" ? body.clientId : undefined;
  if (clientId) {
    const existing = await deps.items.byClientId(workspaceId, clientId);
    if (existing) return { itemId: existing.id as string, status: 200 as const };
  }
  const result = await new CreateItem(deps).execute(toCommand(scope, body));
  if (!result.ok) return { error: result.error };
  const created = result.value;
  if (!clientId) return { itemId: created.item.id as string, status: 201 as const };
  try {
    await deps.items.setClientId(workspaceId, asItemId(created.item.id), clientId);
    return { itemId: created.item.id as string, status: 201 as const };
  } catch (e) {
    if (!(e instanceof ClientIdConflict)) throw e;
    const winner = await deps.items.byClientId(workspaceId, clientId);
    await new DeleteItem(deps).execute({ ...scope, itemId: asItemId(created.item.id) });
    if (body.mode === "quickCapture") {
      await new DeletePurchaseSource(deps).execute({
        ...scope,
        sourceId: asSourceId(created.source.id),
      });
    }
    if (!winner) throw e;
    ctx.log.info("création rejouée : pièce existante renvoyée", { clientId });
    return { itemId: winner.id as string, status: 200 as const };
  }
}

/** Créer une pièce : fiche complète depuis une source, ou capture rapide « Chiner ». */
export const POST = withAuth(
  async (req, ctx) => {
    const body = await parseBody(req, routes.createItem.body);
    assertOwnedPhotoKeys(ctx.workspaceId, body.photoKeys ?? []);
    const scope = scopeOf(ctx);
    const outcome = await createIdempotent(ctx, scope, body);
    if ("error" in outcome) return fail(outcome.error);
    const dto = await loadItem(ctx.deps, scope, outcome.itemId, mapContextFor(req));
    return sendDto("POST /items", routes.createItem.response, dto, { status: outcome.status });
  },
  { limit: { key: "items:create", max: 120, windowSeconds: 60 } },
);
