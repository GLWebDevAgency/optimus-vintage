import { GeneratePiecesForSource } from "@chine/application";
import { routes } from "@chine/contract";
import { asSourceId } from "@chine/domain";
import { mapContextFor, scopeOf } from "@/lib/api/loaders";
import { mapItem } from "@/lib/api/mappers";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/** Générer N pièces « à détailler » depuis un lot ou une palette. */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.generatePieces.body);
    const scope = scopeOf(ctx);
    const source = await deps.sources.byId(scope.workspaceId, asSourceId(ctx.params.id));
    const result = await new GeneratePiecesForSource(deps).execute({
      ...scope,
      sourceId: asSourceId(ctx.params.id),
      count: body.count,
      category: body.category,
      condition: body.condition,
      weightsKg: body.weightsKg,
    });
    const mapCtx = mapContextFor(req);
    return sendResult(result, {
      route: "POST /sources/:id/pieces",
      schema: routes.generatePieces.response,
      status: 201,
      map: (out) => ({
        items: out.items.map((i) => mapItem(i, mapCtx, { sourceName: source?.name })),
        total: out.items.length,
        limit: Math.max(1, out.items.length),
        offset: 0,
      }),
    });
  },
  { limit: { key: "sources:pieces", max: 30, windowSeconds: 60 } },
);
