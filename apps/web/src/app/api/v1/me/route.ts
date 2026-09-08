import { GetWorkspaceOverview } from "@chine/application";
import { routes } from "@chine/contract";
import { asWorkspaceId } from "@chine/domain";
import { scopeOf } from "@/lib/api/loaders";
import { mapOverview } from "@/lib/api/mappers";
import { sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { readWorkspacePreferences } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Espace courant, utilisateur, quotas, fonctionnalités, facturation. */
export const GET = withAuth(async (_req, ctx) => {
  const { deps, session } = ctx;
  const result = await new GetWorkspaceOverview(deps).execute(scopeOf(ctx));
  const prefs = await readWorkspacePreferences(deps.database.db, asWorkspaceId(ctx.workspaceId));
  return sendResult(result, {
    route: "GET /me",
    schema: routes.getWorkspaceOverview.response,
    map: (overview) =>
      mapOverview(overview, session.user, prefs, {
        portalAvailable: deps.stripe !== undefined && overview.plan !== "FREE",
      }),
  });
});
