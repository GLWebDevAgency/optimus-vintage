import { ChangeItemStatus, type ChangeItemStatusCommand } from "@chine/application";
import { routes } from "@chine/contract";
import { asItemId } from "@chine/domain";
import type { z } from "zod";
import { loadItem, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { fail } from "@/lib/api/respond";
import { parseBody, sendDto } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

type Body = z.output<typeof routes.changeItemStatus.body>;
type Action = Omit<ChangeItemStatusCommand, "workspaceId" | "actorUserId" | "itemId">;

/** Verbe du contrat → action du cas d'usage. */
function toAction(body: Body): Action {
  switch (body.action) {
    case "list":
      return { action: "LIST", platform: body.platform, price: body.price, url: body.url };
    case "unlist":
      return { action: "UNLIST" };
    case "reserve":
      return { action: "RESERVE" };
    case "restock":
      return { action: "RESTOCK" };
    case "writeOff":
      return { action: "WRITE_OFF", reason: body.reason };
  }
}

/** Mettre en ligne, retirer, réserver, remettre en stock, sortir (perdue / donnée). */
export const POST = withAuth<{ id: string }>(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.changeItemStatus.body);
    const scope = scopeOf(ctx);
    const result = await new ChangeItemStatus(deps).execute({
      ...scope,
      itemId: asItemId(ctx.params.id),
      ...toAction(body),
    });
    if (!result.ok) return fail(result.error);
    const dto = await loadItem(deps, scope, ctx.params.id, mapContextFor(req));
    return sendDto("POST /items/:id/status", routes.changeItemStatus.response, dto);
  },
  { limit: { key: "items:status", max: 240, windowSeconds: 60 } },
);
