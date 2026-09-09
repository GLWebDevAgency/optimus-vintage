import { GetDashboard } from "@chine/application";
import { type DashboardPeriod, routes } from "@chine/contract";
import { asWorkspaceId, hasFeature, type IsoDate, toIsoDate } from "@chine/domain";
import { attachItemSummaries, mapContextFor, scopeOf } from "@/lib/api/loaders";
import { mapDashboard } from "@/lib/api/mappers";
import { parseQuery, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { readWorkspacePreferences } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const LABELS: Readonly<Record<DashboardPeriod, string>> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  month: "Ce mois-ci",
  "3m": "3 derniers mois",
  year: "Cette année",
  all: "Depuis le début",
};

const shift = (d: Date, days: number): Date => {
  const c = new Date(d);
  c.setDate(c.getDate() + days);
  return c;
};

/** Bornes de la période demandée ; `month` laisse la requête choisir le mois civil courant. */
function boundsFor(
  period: DashboardPeriod,
  now: Date,
  since: Date,
): { from?: IsoDate; to?: IsoDate } {
  const today = toIsoDate(now);
  switch (period) {
    case "7d":
      return { from: toIsoDate(shift(now, -6)), to: today };
    case "30d":
      return { from: toIsoDate(shift(now, -29)), to: today };
    case "3m": {
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: toIsoDate(from), to: today };
    }
    case "year":
      return { from: toIsoDate(new Date(now.getFullYear(), 0, 1)), to: today };
    case "all":
      return { from: toIsoDate(since < now ? since : now), to: today };
    default:
      return {};
  }
}

/** Synthèse de la période : marge, objectif, stock, dernières ventes. */
export const GET = withAuth(async (req, ctx) => {
  const { deps } = ctx;
  const query = parseQuery(req, routes.getDashboard.query);
  const workspaceId = asWorkspaceId(ctx.workspaceId);
  const [prefs, workspace] = await Promise.all([
    readWorkspacePreferences(deps.database.db, workspaceId),
    deps.workspaces.byId(workspaceId),
  ]);
  const now = deps.clock.now();
  const bounds =
    query.from && query.to
      ? { from: query.from as IsoDate, to: query.to as IsoDate }
      : boundsFor(query.period, now, workspace?.createdAt ?? now);
  const result = await new GetDashboard(deps).execute({
    ...scopeOf(ctx),
    ...bounds,
    goalMinor: prefs.monthlyGoalMinor ?? undefined,
    dormantThresholdDays: prefs.dormantThresholdDays,
  });
  const mapCtx = mapContextFor(req);
  return sendResult(result, {
    route: "GET /dashboard",
    schema: routes.getDashboard.response,
    map: async (d) =>
      mapDashboard(
        d,
        await attachItemSummaries(deps, workspaceId, d.lastSales, mapCtx),
        query.from && query.to ? `${query.from} → ${query.to}` : LABELS[query.period],
        // L'analytique avancée est une fonctionnalité de formule : absente du contrat sinon.
        workspace && hasFeature(workspace.plan, "ADVANCED_ANALYTICS"),
      ),
  });
});
