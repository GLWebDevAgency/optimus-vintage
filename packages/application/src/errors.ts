import { DomainError } from "@chine/domain";

/** Erreurs applicatives typées, mappées en HTTP par la couche web. */
export class NotFound extends DomainError {
  override readonly name = "NotFound";
  constructor(entity: string, id: string) {
    super("NOT_FOUND", `${entity} introuvable`, { entity, id });
  }
}
export class Forbidden extends DomainError {
  override readonly name = "Forbidden";
  constructor(message = "Accès refusé") {
    super("FORBIDDEN", message);
  }
}
export class QuotaExceeded extends DomainError {
  override readonly name = "QuotaExceeded";
  constructor(resource: string, used: number, limit: number, upgradeTo?: string) {
    super("QUOTA_EXCEEDED", `Quota atteint : ${resource} (${used}/${limit})`, {
      resource,
      used,
      limit,
      ...(upgradeTo ? { upgradeTo } : {}),
    });
  }
}
export class FeatureLocked extends DomainError {
  override readonly name = "FeatureLocked";
  constructor(feature: string, minimumPlan: string) {
    super("FEATURE_LOCKED", `Fonctionnalité réservée au plan ${minimumPlan}`, {
      feature,
      minimumPlan,
    });
  }
}
export class ValidationFailed extends DomainError {
  override readonly name = "ValidationFailed";
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_FAILED", message, details);
  }
}
