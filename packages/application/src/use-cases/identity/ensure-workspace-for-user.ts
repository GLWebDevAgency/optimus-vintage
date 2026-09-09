import {
  asWorkspaceId,
  type Currency,
  type DomainError,
  ok,
  type Result,
  type UserId,
  Workspace,
} from "@chine/domain";
import type { WorkspaceDto } from "../../dto.js";
import { toWorkspaceDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { attempt } from "../../shared/attempt.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface EnsureWorkspaceForUserCommand {
  readonly userId: UserId;
  readonly name?: string;
  readonly currency?: Currency;
  readonly locale?: "fr" | "en" | "de";
}
export interface EnsureWorkspaceForUserOutput {
  readonly workspace: WorkspaceDto;
  readonly created: boolean;
}

/**
 * Premier login : crée l'espace de l'utilisateur (EUR, fr, préfixe CH, marge cible 30 %).
 * L'index unique sur le propriétaire empêche deux espaces en cas de première requête concurrente.
 */
export class EnsureWorkspaceForUser
  implements UseCase<EnsureWorkspaceForUserCommand, EnsureWorkspaceForUserOutput>
{
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "billing">,
  ) {}

  execute(
    cmd: EnsureWorkspaceForUserCommand,
  ): Promise<Result<EnsureWorkspaceForUserOutput, DomainError>> {
    return transact<EnsureWorkspaceForUserOutput>(this.deps, async (repos) => {
      const existing = await repos.workspaces.byOwner(cmd.userId);
      // Le plan appartient à la facturation (webhooks Stripe) : l'agrégat le lit, ne l'écrit pas.
      if (existing) return ok({ workspace: toWorkspaceDto(existing), created: false });
      const id = asWorkspaceId(this.deps.ids.next());
      const plan = await this.deps.billing.currentPlan(id);
      const created = attempt(() =>
        Workspace.create({
          id,
          ownerId: cmd.userId,
          name: cmd.name?.trim() || "Mon espace",
          currency: cmd.currency ?? "EUR",
          locale: cmd.locale ?? "fr",
          targetMargin: { kind: "PERCENT", value: 30 },
          plan,
          skuPrefix: "CH",
          createdAt: this.deps.clock.now(),
        }),
      );
      if (!created.ok) return created;
      await repos.workspaces.save(created.value);
      return ok({ workspace: toWorkspaceDto(created.value), created: true });
    });
  }
}
