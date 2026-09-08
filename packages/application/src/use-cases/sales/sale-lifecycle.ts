import {
  type DomainError,
  err,
  type Item,
  ok,
  type Result,
  type Sale,
  type SaleId,
  toIsoDate,
} from "@chine/domain";
import type { ItemDto, SaleDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toItemDto, toSaleDto } from "../../mappers/index.js";
import type { AppDependencies, TransactionalRepositories } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { transact } from "../../shared/transaction.js";
import { endActiveListings } from "../shared/listings.js";
import type { UseCase } from "../use-case.js";

type Deps = Pick<AppDependencies, "uow" | "events" | "clock" | "photos">;
export interface SaleLifecycleCommand extends WorkspaceScoped {
  readonly saleId: SaleId;
}
export interface SaleLifecycleOutput {
  readonly sale: SaleDto;
  readonly item: ItemDto;
}
type Step = (
  sale: Sale,
  item: Item,
  now: Date,
  repos: TransactionalRepositories,
) => Promise<Result<void, DomainError>>;

/** Squelette commun : charge vente + pièce, applique l'étape, sauvegarde et publie. */
abstract class SaleLifecycleUseCase implements UseCase<SaleLifecycleCommand, SaleLifecycleOutput> {
  constructor(protected readonly deps: Deps) {}
  protected abstract step: Step;

  execute(cmd: SaleLifecycleCommand): Promise<Result<SaleLifecycleOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const sale = await repos.sales.byId(ws.value.id, cmd.saleId);
      if (!sale) return err(new NotFound("Sale", cmd.saleId));
      const item = await repos.items.byId(ws.value.id, sale.itemId);
      if (!item) return err(new NotFound("Item", sale.itemId));
      const now = this.deps.clock.now();
      const r = await this.step(sale, item, now, repos);
      if (!r.ok) return r;
      await repos.sales.save(sale);
      await repos.items.save(item);
      events.collect(sale, item);
      return ok({
        sale: toSaleDto(sale),
        item: toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) }),
      });
    });
  }
}

/** Annulation avant expédition : rien n'a été encaissé, la pièce revient en stock. */
export class CancelSale extends SaleLifecycleUseCase {
  protected step: Step = async (sale, item, now) => {
    const r = sale.cancel(now);
    if (!r.ok) return r;
    return item.status === "SOLD" || item.status === "RESERVED" ? item.restock(now) : ok(undefined);
  };
}

/** Remboursement après retour : la pièce revient en statut RETURNED. */
export class RefundSale extends SaleLifecycleUseCase {
  protected step: Step = async (sale, item, now) => {
    const r = sale.refund(now);
    if (!r.ok) return r;
    return item.status === "SOLD" ? item.markReturned(now) : ok(undefined);
  };
}

/** Encaissement d'une vente en attente : la pièce passe vendue, les annonces sont clôturées. */
export class CompletePendingSale extends SaleLifecycleUseCase {
  protected step: Step = async (sale, item, now, repos) => {
    const r = sale.complete(now);
    if (!r.ok) return r;
    if (item.status !== "SOLD") {
      const sold = item.markSold(now);
      if (!sold.ok) return sold;
    }
    await endActiveListings(repos.listings, sale.workspaceId, item.id, toIsoDate(now), "SOLD");
    return ok(undefined);
  };
}
