import { type DomainError, err, ok, type Result, type SourceId } from "@chine/domain";
import { NotFound, ValidationFailed } from "../../errors.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface DeletePurchaseSourceCommand extends WorkspaceScoped {
  readonly sourceId: SourceId;
  /** Supprime aussi les pièces de la source (jamais si des ventes existent). */
  readonly force?: boolean;
}
export interface DeletePurchaseSourceOutput {
  readonly sourceId: SourceId;
  readonly deletedItems: number;
}

export class DeletePurchaseSource
  implements UseCase<DeletePurchaseSourceCommand, DeletePurchaseSourceOutput>
{
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events">) {}

  execute(
    cmd: DeletePurchaseSourceCommand,
  ): Promise<Result<DeletePurchaseSourceOutput, DomainError>> {
    return transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const source = await repos.sources.byId(ws.value.id, cmd.sourceId);
      if (!source) return err(new NotFound("PurchaseSource", cmd.sourceId));
      const items = await repos.items.bySource(ws.value.id, cmd.sourceId);
      if (items.length > 0 && !cmd.force) {
        return err(
          new ValidationFailed("La source contient des pièces", {
            reason: "HAS_ITEMS",
            itemCount: items.length,
          }),
        );
      }
      const sales = await repos.sales.bySource(ws.value.id, cmd.sourceId);
      if (sales.length > 0) {
        return err(
          new ValidationFailed("Des ventes sont rattachées à cette source", {
            reason: "HAS_SALES",
            saleCount: sales.length,
          }),
        );
      }
      for (const item of items) await repos.items.delete(ws.value.id, item.id);
      await repos.sources.delete(ws.value.id, cmd.sourceId);
      return ok({ sourceId: cmd.sourceId, deletedItems: items.length });
    });
  }
}
