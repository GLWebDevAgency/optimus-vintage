import {
  checkQuota,
  type DomainError,
  err,
  type Feature,
  hasFeature,
  minimumPlanFor,
  ok,
  type Plan,
  type QuotaResource,
  type Result,
} from "@chine/domain";
import { FeatureLocked, QuotaExceeded } from "../errors.js";

/** Vérifie qu'on peut ajouter `adding` ressources sans dépasser le plan. */
export function ensureQuota(
  plan: Plan,
  resource: QuotaResource,
  used: number,
  adding = 1,
): Result<void, DomainError> {
  const decision = checkQuota(plan, resource, used, adding);
  if (decision.allowed) return ok(undefined);
  return err(new QuotaExceeded(resource, used, decision.limit, decision.upgradeTo));
}

export function ensureFeature(plan: Plan, feature: Feature): Result<void, DomainError> {
  if (hasFeature(plan, feature)) return ok(undefined);
  return err(new FeatureLocked(feature, minimumPlanFor(feature)));
}
