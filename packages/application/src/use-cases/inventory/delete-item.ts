import { type DomainError, err, type ItemId, ok, type Result } from "@chine/domain";
import { Conflict, NotFound } from "../../errors.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface DeleteItemCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
}
export interface DeleteItemOutput {
  readonly itemId: ItemId;
}

/** Supprime une pièce (refusé si une vente encaissée ou en attente la référence). */
export class DeleteItem implements UseCase<DeleteItemCommand, DeleteItemOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events" | "photos">) {}

  async execute(cmd: DeleteItemCommand): Promise<Result<DeleteItemOutput, DomainError>> {
    let photoKeys: readonly string[] = [];
    const result = await transact(this.deps, async (repos) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      // Toute vente (même annulée ou remboursée) fait partie de l'historique comptable :
      // la pièce se sort du stock (LOST/DONATED), elle ne se supprime pas.
      const sales = await repos.sales.byItem(ws.value.id, item.id);
      if (sales.length > 0) {
        return err(
          new Conflict("Une vente référence cette pièce : sortez-la du stock plutôt", {
            reason: "HAS_SALES",
            saleIds: sales.map((s) => s.id),
          }),
        );
      }
      photoKeys = item.photos.map((p) => p.key);
      await repos.items.delete(ws.value.id, item.id);
      return ok({ itemId: item.id });
    });
    if (result.ok) await Promise.allSettled(photoKeys.map((k) => this.deps.photos.delete(k)));
    return result;
  }
}
