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
 * Aux logins suivants, resynchronise le plan depuis la facturation.
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
      if (existing) {
        const plan = await this.deps.billing.currentPlan(existing.id);
        if (plan === existing.plan)
          return ok({ workspace: toWorkspaceDto(existing), created: false });
        const synced = existing.with({ plan });
        await repos.workspaces.save(synced);
        return ok({ workspace: toWorkspaceDto(synced), created: false });
      }
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
