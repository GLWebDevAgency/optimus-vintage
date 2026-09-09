import {
  checkQuota,
  DEFAULT_FEE_SCHEDULES,
  type DomainError,
  FEATURES,
  hasFeature,
  minimumPlanFor,
  ok,
  PLAN_LIMITS,
  type Plan,
  type QuotaResource,
  type Result,
} from "@chine/domain";
import type { QuotaUsageDto, WorkspaceOverviewDto } from "../dto.js";
import { toWorkspaceDto } from "../mappers/index.js";
import type { AppDependencies } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { startOfMonth } from "../shared/dates.js";
import { countSellableItems } from "../use-cases/shared/counts.js";
import type { Query } from "./query.js";

export type GetWorkspaceOverviewQuery = WorkspaceScoped;

const finiteOrNull = (n: number): number | null => (Number.isFinite(n) ? n : null);

function usage(plan: Plan, resource: QuotaResource, used: number): QuotaUsageDto {
  const d = checkQuota(plan, resource, used);
  const limit = finiteOrNull(d.limit);
  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(0, limit - used),
    allowed: d.allowed,
    upgradeTo: d.upgradeTo ?? null,
  };
}

/** Espace, plan, quotas consommés et fonctionnalités : de quoi afficher « Mon compte » et les paywalls. */
export class GetWorkspaceOverview
  implements Query<GetWorkspaceOverviewQuery, WorkspaceOverviewDto>
{
  constructor(
    private readonly deps: Pick<
      AppDependencies,
      "workspaces" | "items" | "sources" | "appraisals" | "clock"
    >,
  ) {}

  async execute(q: GetWorkspaceOverviewQuery): Promise<Result<WorkspaceOverviewDto, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const { id, plan } = ws.value;
    const since = startOfMonth(this.deps.clock.now());
    const [items, sources, appraisals, feeOverrides] = await Promise.all([
      countSellableItems(this.deps.items, id),
      this.deps.sources.countCreatedSince(id, since),
      this.deps.appraisals.creditsSince(id, since),
      this.deps.workspaces.feeOverrides(id),
    ]);
    const limits = PLAN_LIMITS[plan];
    return ok({
      workspace: toWorkspaceDto(ws.value),
      plan,
      limits: {
        maxItems: finiteOrNull(limits.maxItems),
        maxSourcesPerMonth: finiteOrNull(limits.maxSourcesPerMonth),
        aiCreditsPerMonth: finiteOrNull(limits.aiCreditsPerMonth),
        members: limits.members,
      },
      usage: {
        items: usage(plan, "items", items),
        sourcesPerMonth: usage(plan, "sourcesPerMonth", sources),
        aiCreditsPerMonth: usage(plan, "aiCreditsPerMonth", appraisals),
        members: usage(plan, "members", 1),
      },
      features: FEATURES.filter((f) => hasFeature(plan, f)),
      lockedFeatures: FEATURES.filter((f) => !hasFeature(plan, f)).map((feature) => ({
        feature,
        minimumPlan: minimumPlanFor(feature),
      })),
      feeOverrides,
      feeSchedules: { ...DEFAULT_FEE_SCHEDULES, ...feeOverrides },
    });
  }
}
