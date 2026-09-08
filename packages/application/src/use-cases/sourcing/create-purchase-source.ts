import { type DomainError, ok, type Result } from "@chine/domain";
import type { SourceDto } from "../../dto.js";
import { toSourceDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";
import { createSourceInTx, type NewSourceInput } from "./new-source.js";

export interface CreatePurchaseSourceCommand
  extends WorkspaceScoped,
    Omit<NewSourceInput, "goodsCost" | "extraCosts"> {
  readonly goodsCost: MoneyInput;
  readonly extraCosts?: MoneyInput;
}
export interface CreatePurchaseSourceOutput {
  readonly source: SourceDto;
}

/** Enregistre un lot, une palette, une session de picking ou un achat unitaire. */
export class CreatePurchaseSource
  implements UseCase<CreatePurchaseSourceCommand, CreatePurchaseSourceOutput>
{
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock">) {}

  execute(
    cmd: CreatePurchaseSourceCommand,
  ): Promise<Result<CreatePurchaseSourceOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const money = readMoney(ws.value, { goodsCost: cmd.goodsCost, extraCosts: cmd.extraCosts });
      if (!money.ok) return money;
      const { workspaceId: _w, actorUserId: _a, goodsCost: _g, extraCosts: _e, ...input } = cmd;
      const created = await createSourceInTx(repos, this.deps, ws.value, {
        ...input,
        ...omitUndefined(money.value),
      });
      if (!created.ok) return created;
      events.collect(created.value);
      return ok({ source: toSourceDto(created.value) });
    });
  }
}
