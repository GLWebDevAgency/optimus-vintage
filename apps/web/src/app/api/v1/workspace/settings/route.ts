import { GetWorkspaceOverview, UpdateWorkspaceSettings } from "@chine/application";
import { routes } from "@chine/contract";
import { asWorkspaceId, type FeeSchedule, type Platform } from "@chine/domain";
import { scopeOf } from "@/lib/api/loaders";
import { mapOverview } from "@/lib/api/mappers";
import { fail } from "@/lib/api/respond";
import { parseBody, sendResult } from "@/lib/api/route";
import { withAuth } from "@/lib/api/with-auth";
import { readWorkspacePreferences, saveWorkspacePreferences } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * Réglages de l'espace. Les surcharges de frais reçues sont fusionnées avec les surcharges
 * existantes : `null` retire la surcharge d'une plateforme (grille par défaut), une clé absente
 * ne change rien. Seuil de dormance et objectif mensuel sont des préférences d'espace.
 */
export const PATCH = withAuth(
  async (req, ctx) => {
    const { deps } = ctx;
    const body = await parseBody(req, routes.updateWorkspaceSettings.body);
    const scope = scopeOf(ctx);
    const workspaceId = asWorkspaceId(ctx.workspaceId);

    let feeOverrides: Partial<Record<Platform, FeeSchedule>> | undefined;
    if (body.feeOverrides) {
      const merged: Partial<Record<Platform, FeeSchedule>> = {
        ...(await deps.workspaces.feeOverrides(workspaceId)),
      };
      for (const [platform, schedule] of Object.entries(body.feeOverrides) as [
        Platform,
        FeeSchedule | null | undefined,
      ][]) {
        if (schedule === undefined) continue;
        if (schedule === null) delete merged[platform];
        else merged[platform] = schedule;
      }
      feeOverrides = merged;
    }

    const updated = await new UpdateWorkspaceSettings(deps).execute({
      ...scope,
      name: body.name,
      currency: body.currency,
      locale: body.locale,
      targetMargin: body.targetMargin,
      skuPrefix: body.skuPrefix,
      feeOverrides,
    });
    if (!updated.ok) return fail(updated.error);

    if (body.dormantThresholdDays !== undefined || body.monthlyGoal !== undefined) {
      if (body.monthlyGoal && body.monthlyGoal.currency !== updated.value.workspace.currency) {
        return fail({
          code: "VALIDATION_FAILED",
          message: `Devise attendue : ${updated.value.workspace.currency}`,
          details: { field: "monthlyGoal" },
        });
      }
      await saveWorkspacePreferences(deps.database.db, workspaceId, {
        dormantThresholdDays: body.dormantThresholdDays,
        monthlyGoalMinor:
          body.monthlyGoal === undefined ? undefined : (body.monthlyGoal?.minor ?? null),
      });
    }

    const overview = await new GetWorkspaceOverview(deps).execute(scope);
    const prefs = await readWorkspacePreferences(deps.database.db, workspaceId);
    return sendResult(overview, {
      route: "PATCH /workspace/settings",
      schema: routes.updateWorkspaceSettings.response,
      map: (o) =>
        mapOverview(o, ctx.session.user, prefs, {
          portalAvailable: deps.stripe !== undefined && o.plan !== "FREE",
        }),
    });
  },
  { limit: { key: "workspace:settings", max: 60, windowSeconds: 60 } },
);
