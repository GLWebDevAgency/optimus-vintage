import { DomainError, err, ok, type Plan, type Result } from "@chine/domain";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import type { UseCase } from "../use-case.js";

export class BillingUnavailable extends DomainError {
  override readonly name = "BillingUnavailable";
  constructor() {
    super("BILLING_UNAVAILABLE", "Le paiement en ligne est indisponible pour le moment");
  }
}

export interface StartCheckoutCommand extends WorkspaceScoped {
  readonly plan: Exclude<Plan, "FREE">;
  readonly interval: "monthly" | "yearly";
  readonly returnUrl: string;
}
export interface BillingUrlOutput {
  readonly url: string;
}

/** Démarre un paiement Stripe vers un plan payant. */
export class StartCheckout implements UseCase<StartCheckoutCommand, BillingUrlOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "workspaces" | "billing">) {}
  async execute(cmd: StartCheckoutCommand): Promise<Result<BillingUrlOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, cmd);
    if (!ws.ok) return ws;
    const url = await this.deps.billing.createCheckoutUrl(
      ws.value.id,
      cmd.plan,
      cmd.interval,
      cmd.returnUrl,
    );
    return url ? ok({ url }) : err(new BillingUnavailable());
  }
}

export interface OpenBillingPortalCommand extends WorkspaceScoped {
  readonly returnUrl: string;
}

/** Ouvre le portail de gestion d'abonnement. */
export class OpenBillingPortal implements UseCase<OpenBillingPortalCommand, BillingUrlOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "workspaces" | "billing">) {}
  async execute(cmd: OpenBillingPortalCommand): Promise<Result<BillingUrlOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, cmd);
    if (!ws.ok) return ws;
    const url = await this.deps.billing.createPortalUrl(ws.value.id, cmd.returnUrl);
    return url ? ok({ url }) : err(new BillingUnavailable());
  }
}
