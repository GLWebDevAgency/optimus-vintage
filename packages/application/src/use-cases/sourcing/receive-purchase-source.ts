import { type DomainError, err, ok, type Result, type SourceId } from "@chine/domain";
import type { SourceDto } from "../../dto.js";
import { NotFound, ValidationFailed } from "../../errors.js";
import { toSourceDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface ReceivePurchaseSourceCommand extends WorkspaceScoped {
  readonly sourceId: SourceId;
  readonly receivedQuantity: number;
}
export interface ReceivePurchaseSourceOutput {
  readonly source: SourceDto;
}

/** Réception d'un lot / ballot : on note la quantité réellement reçue (casse, manquants). */
export class ReceivePurchaseSource
  implements UseCase<ReceivePurchaseSourceCommand, ReceivePurchaseSourceOutput>
{
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events" | "clock">) {}

  execute(
    cmd: ReceivePurchaseSourceCommand,
  ): Promise<Result<ReceivePurchaseSourceOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      if (!Number.isInteger(cmd.receivedQuantity) || cmd.receivedQuantity < 0) {
        return err(
          new ValidationFailed("Quantité reçue invalide", {
            receivedQuantity: cmd.receivedQuantity,
          }),
        );
      }
      const source = await repos.sources.byId(ws.value.id, cmd.sourceId);
      if (!source) return err(new NotFound("PurchaseSource", cmd.sourceId));
      const received = source.receive(cmd.receivedQuantity, this.deps.clock.now());
      if (!received.ok) return received;
      await repos.sources.save(source);
      events.collect(source);
      return ok({ source: toSourceDto(source) });
    });
  }
}
