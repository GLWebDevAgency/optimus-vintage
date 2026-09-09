import {
  AI_CREDIT_COST,
  type Appraisal,
  asAppraisalId,
  checkQuota,
  type DomainError,
  err,
  type ItemId,
  ok,
  type Result,
} from "@chine/domain";
import type { AppraisalDto, QuotaUsageDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toAppraisalDto } from "../../mappers/index.js";
import type { AppDependencies, AppraisalRequest } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { startOfMonth } from "../../shared/dates.js";
import { omitUndefined } from "../../shared/objects.js";
import { ensureFeature, ensureQuota } from "../../shared/quotas.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface AppraiseImageCommand extends WorkspaceScoped {
  readonly imageBase64: string;
  readonly mimeType: AppraisalRequest["mimeType"];
  readonly hints?: AppraisalRequest["hints"];
  /** Génère aussi titre / description / hashtags (fonctionnalité AI_LISTING_COPY). */
  readonly wantListingCopy?: boolean;
  /** Rattache l'expertise à une pièce existante. */
  readonly itemId?: ItemId;
}
export interface AppraiseImageOutput {
  readonly appraisal: AppraisalDto;
  readonly usage: QuotaUsageDto;
}

/**
 * Expertise IA d'une photo : fonctionnalité AI_APPRAISAL, quota mensuel.
 * L'appel IA (lent) se fait hors transaction ; seule la persistance est transactionnelle.
 */
export class AppraiseImage implements UseCase<AppraiseImageCommand, AppraiseImageOutput> {
  constructor(
    private readonly deps: Pick<
      AppDependencies,
      "uow" | "events" | "ids" | "clock" | "appraiser" | "workspaces" | "appraisals" | "items"
    >,
  ) {}

  async execute(cmd: AppraiseImageCommand): Promise<Result<AppraiseImageOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, cmd);
    if (!ws.ok) return ws;
    const feature = ensureFeature(ws.value.plan, "AI_APPRAISAL");
    if (!feature.ok) return feature;
    if (cmd.wantListingCopy) {
      const copy = ensureFeature(ws.value.plan, "AI_LISTING_COPY");
      if (!copy.ok) return copy;
    }
    const since = startOfMonth(this.deps.clock.now());
    const used = await this.deps.appraisals.creditsSince(ws.value.id, since);
    const cost = AI_CREDIT_COST.APPRAISAL;
    const quota = ensureQuota(ws.value.plan, "aiCreditsPerMonth", used, cost);
    if (!quota.ok) return quota;
    if (cmd.itemId && !(await this.deps.items.byId(ws.value.id, cmd.itemId)))
      return err(new NotFound("Item", cmd.itemId));

    const draft = await this.deps.appraiser.appraise({
      ...omitUndefined({ hints: cmd.hints, wantListingCopy: cmd.wantListingCopy }),
      imageBase64: cmd.imageBase64,
      mimeType: cmd.mimeType,
      currency: ws.value.currency,
      locale: ws.value.locale,
    });
    const appraisal: Appraisal = {
      ...draft,
      ...omitUndefined({ itemId: cmd.itemId }),
      id: asAppraisalId(this.deps.ids.next()),
      workspaceId: ws.value.id,
      createdAt: this.deps.clock.now(),
      credits: cost,
      listingCopy: cmd.wantListingCopy ? draft.listingCopy : null,
    };
    return transact(this.deps, async (repos) => {
      await repos.appraisals.save(appraisal);
      const decision = checkQuota(ws.value.plan, "aiCreditsPerMonth", used + cost, cost);
      const limit = Number.isFinite(decision.limit) ? decision.limit : null;
      const usage: QuotaUsageDto = {
        used: used + cost,
        limit,
        remaining: limit === null ? null : Math.max(0, limit - used - cost),
        allowed: decision.allowed,
        upgradeTo: decision.upgradeTo ?? null,
      };
      return ok({ appraisal: toAppraisalDto(appraisal), usage });
    });
  }
}
