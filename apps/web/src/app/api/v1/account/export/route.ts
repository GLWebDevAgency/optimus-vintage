import { routes } from "@chine/contract";
import { toIsoDate } from "@chine/domain";
import { assertContract } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";

export const dynamic = "force-dynamic";

/**
 * Portabilité (RGPD) : export JSON complet de l'espace, servi en téléchargement.
 * Le fichier contient l'enveloppe `{ data }` de l'API, comme toute réponse du contrat.
 */
export const GET = withAuth(
  async (_req, ctx) => {
    const { deps } = ctx;
    const data = await deps.lifecycle.exportWorkspace(ctx.workspaceId);
    assertContract("GET /account/export", routes.exportAccount.response, data);
    const filename = `chine-export-${toIsoDate(deps.clock.now())}.json`;
    return new Response(JSON.stringify({ data }, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { limit: { key: "account:export", max: 5, windowSeconds: 3600 } },
);
