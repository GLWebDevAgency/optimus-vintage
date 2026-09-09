import { GetWorkspaceOverview } from "@chine/application";
import { routes } from "@chine/contract";
import { asWorkspaceId } from "@chine/domain";
import { scopeOf } from "@/lib/api/loaders";
import { mapOverview } from "@/lib/api/mappers";
import { sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { readWorkspaceBilling, readWorkspacePreferences } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/** Espace courant, utilisateur, quotas, fonctionnalités, facturation. */
export const GET = withAuth(async (_req, ctx) => {
  const { deps, session } = ctx;
  const result = await new GetWorkspaceOverview(deps).execute(scopeOf(ctx));
  const workspaceId = asWorkspaceId(ctx.workspaceId);
  const [prefs, billing] = await Promise.all([
    readWorkspacePreferences(deps.database.db, workspaceId),
    readWorkspaceBilling(deps.database.db, workspaceId),
  ]);
  return sendResult(result, {
    route: "GET /me",
    schema: routes.getWorkspaceOverview.response,
    map: (overview) =>
      mapOverview(overview, session.user, prefs, {
        // Le portail reste ouvert à un ancien abonné (factures, réabonnement).
        portalAvailable: deps.stripe !== undefined && billing.hasCustomer,
        status: billing.status,
        interval: billing.interval,
        renewsAt: billing.currentPeriodEnd,
        cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
        trialEndsAt: billing.trialEndsAt,
      }),
  });
});
