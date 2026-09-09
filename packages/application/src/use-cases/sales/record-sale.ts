import {
  asSaleId,
  type DomainError,
  err,
  type IsoDate,
  type ItemId,
  ok,
  type Platform,
  type Result,
  Sale,
  ScheduleFeePolicy,
  toIsoDate,
} from "@chine/domain";
import type { ItemDto, SaleDto } from "../../dto.js";
import { Conflict, NotFound, ValidationFailed } from "../../errors.js";
import { toItemDto, toSaleDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import { endActiveListings } from "../shared/listings.js";
import type { UseCase } from "../use-case.js";

export interface RecordSaleCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
  readonly platform: Platform;
  readonly grossPrice: MoneyInput;
  readonly soldAt?: IsoDate;
  readonly shippingCost?: MoneyInput;
  readonly packagingCost?: MoneyInput;
  readonly otherCosts?: MoneyInput;
  /** Frais plateforme saisis à la main ; sinon calculés depuis la grille de l'espace. */
  readonly platformFeesOverride?: MoneyInput;
  /** PENDING = vendue mais pas encore encaissée (la pièce est réservée). */
  readonly status?: "COMPLETED" | "PENDING";
  readonly buyer?: string;
  readonly notes?: string;
}
export interface RecordSaleOutput {
  readonly sale: SaleDto;
  readonly item: ItemDto;
}

/** Enregistre une vente : frais depuis la grille de l'espace, pièce marquée vendue, annonces clôturées. */
export class RecordSale implements UseCase<RecordSaleCommand, RecordSaleOutput> {
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "photos">,
  ) {}

  execute(cmd: RecordSaleCommand): Promise<Result<RecordSaleOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      if (!item.isSellable)
        return err(new ValidationFailed("La pièce n'est pas vendable", { status: item.status }));
      // Une vente en attente réserve déjà la pièce : on l'encaisse ou on l'annule, on n'en crée pas une seconde.
      const pending = (await repos.sales.byItem(ws.value.id, item.id)).find(
        (s) => s.status === "PENDING",
      );
      if (pending)
        return err(
          new Conflict("Une vente en attente existe déjà pour cette pièce", {
            reason: "PENDING_SALE",
            saleId: pending.id,
          }),
        );
      const money = readMoney(ws.value, {
        grossPrice: cmd.grossPrice,
        shippingCost: cmd.shippingCost,
        packagingCost: cmd.packagingCost,
        otherCosts: cmd.otherCosts,
        platformFeesOverride: cmd.platformFeesOverride,
      });
      if (!money.ok) return money;

      const now = this.deps.clock.now();
      const soldAt = cmd.soldAt ?? toIsoDate(now);
      const feePolicy = ScheduleFeePolicy.withOverrides(
        await repos.workspaces.feeOverrides(ws.value.id),
      );
      const recorded = Sale.record(
        {
          ...omitUndefined({
            shippingCost: money.value.shippingCost,
            packagingCost: money.value.packagingCost,
            otherCosts: money.value.otherCosts,
            platformFeesOverride: money.value.platformFeesOverride,
            status: cmd.status,
            buyer: cmd.buyer,
            notes: cmd.notes,
          }),
          id: asSaleId(this.deps.ids.next()),
          workspaceId: ws.value.id,
          itemId: item.id,
          sourceId: item.sourceId,
          platform: cmd.platform,
          grossPrice: money.value.grossPrice,
          acquisitionCost: item.acquisitionCost,
          soldAt,
          now,
        },
        feePolicy,
      );
      if (!recorded.ok) return recorded;
      const sale = recorded.value;

      if (sale.status === "PENDING") {
        if (item.status !== "RESERVED") {
          const r = item.reserve(now);
          if (!r.ok) return r;
        }
      } else {
        const r = item.markSold(now);
        if (!r.ok) return r;
        await endActiveListings(repos.listings, ws.value.id, item.id, soldAt, "SOLD");
      }
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
