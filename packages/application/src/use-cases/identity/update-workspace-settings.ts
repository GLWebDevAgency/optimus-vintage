import {
  type Currency,
  type DomainError,
  err,
  type FeeSchedule,
  ok,
  PLATFORMS,
  type Platform,
  type Result,
  type TargetMargin,
} from "@chine/domain";
import type { WorkspaceDto } from "../../dto.js";
import { ValidationFailed } from "../../errors.js";
import { toWorkspaceDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { attempt } from "../../shared/attempt.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface UpdateWorkspaceSettingsCommand extends WorkspaceScoped {
  readonly name?: string;
  readonly currency?: Currency;
  readonly locale?: "fr" | "en" | "de";
  readonly targetMargin?: TargetMargin;
  readonly skuPrefix?: string;
  /** Remplace l'ensemble des surcharges de frais (une clé absente = grille par défaut). */
  readonly feeOverrides?: Partial<Record<Platform, FeeSchedule>>;
}
export interface UpdateWorkspaceSettingsOutput {
  readonly workspace: WorkspaceDto;
  readonly feeOverrides: Partial<Record<Platform, FeeSchedule>>;
}

function validateFeeOverrides(
  overrides: Partial<Record<Platform, FeeSchedule>>,
): DomainError | undefined {
  for (const [platform, s] of Object.entries(overrides)) {
    if (!(PLATFORMS as readonly string[]).includes(platform))
      return new ValidationFailed("Plateforme inconnue", { platform });
    if (!s) continue;
    const okPercent = Number.isFinite(s.percent) && s.percent >= 0 && s.percent <= 100;
    const okFixed = Number.isSafeInteger(s.fixedMinor) && s.fixedMinor >= 0;
    const okMin = s.minMinor === undefined || (Number.isSafeInteger(s.minMinor) && s.minMinor >= 0);
    if (!okPercent || !okFixed || !okMin)
      return new ValidationFailed("Grille de frais invalide", { platform });
  }
  return undefined;
}

export class UpdateWorkspaceSettings
  implements UseCase<UpdateWorkspaceSettingsCommand, UpdateWorkspaceSettingsOutput>
{
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events">) {}

  execute(
    cmd: UpdateWorkspaceSettingsCommand,
  ): Promise<Result<UpdateWorkspaceSettingsOutput, DomainError>> {
    return transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      if (
        cmd.currency &&
        cmd.currency !== ws.value.currency &&
        (await repos.items.count(ws.value.id)) > 0
      ) {
        return err(
          new ValidationFailed("Impossible de changer de devise : des pièces existent déjà"),
        );
      }
      if (cmd.feeOverrides) {
        const invalid = validateFeeOverrides(cmd.feeOverrides);
        if (invalid) return err(invalid);
      }
      const patch = omitUndefined({
        name: cmd.name?.trim(),
        currency: cmd.currency,
        locale: cmd.locale,
        targetMargin: cmd.targetMargin,
        skuPrefix: cmd.skuPrefix?.trim().toUpperCase(),
      });
      const updated = attempt(() => ws.value.with(patch));
      if (!updated.ok)
        return err(new ValidationFailed(updated.error.message, updated.error.details));
      await repos.workspaces.save(updated.value);
      if (cmd.feeOverrides) await repos.workspaces.saveFeeOverrides(ws.value.id, cmd.feeOverrides);
      return ok({
        workspace: toWorkspaceDto(updated.value),
        feeOverrides: await repos.workspaces.feeOverrides(ws.value.id),
      });
    });
  }
}
