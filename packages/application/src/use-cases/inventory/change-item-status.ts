import {
  asListingId,
  type DomainError,
  err,
  type ItemId,
  Listing,
  ok,
  type Platform,
  type Result,
  toIsoDate,
} from "@chine/domain";
import type { ItemDto, ListingDto } from "../../dto.js";
import { NotFound, ValidationFailed } from "../../errors.js";
import { toItemDto, toListingDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { attempt } from "../../shared/attempt.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import { endActiveListings } from "../shared/listings.js";
import type { UseCase } from "../use-case.js";

export type ItemStatusAction = "LIST" | "UNLIST" | "RESERVE" | "WRITE_OFF" | "RESTOCK";

export interface ChangeItemStatusCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
  readonly action: ItemStatusAction;
  /** LIST : plateforme (défaut OTHER) et, si un prix est donné, création d'une annonce. */
  readonly platform?: Platform;
  readonly price?: MoneyInput;
  readonly url?: string;
  /** WRITE_OFF : perdue (défaut) ou donnée. */
  readonly reason?: "LOST" | "DONATED";
}
export interface ChangeItemStatusOutput {
  readonly item: ItemDto;
  readonly listing: ListingDto | null;
}

/** Pilote la machine à états d'une pièce et tient les annonces à jour. */
export class ChangeItemStatus implements UseCase<ChangeItemStatusCommand, ChangeItemStatusOutput> {
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "ids" | "clock" | "photos">,
  ) {}

  execute(cmd: ChangeItemStatusCommand): Promise<Result<ChangeItemStatusOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      const now = this.deps.clock.now();
      const today = toIsoDate(now);
      let listing: Listing | undefined;

      switch (cmd.action) {
        case "LIST": {
          const platform = cmd.platform ?? "OTHER";
          const r = item.markListed(platform, now);
          if (!r.ok) return r;
          if (cmd.price) {
            const money = readMoney(ws.value, { price: cmd.price });
            if (!money.ok) return money;
            const created = attempt(() =>
              Listing.create({
                ...omitUndefined({ url: cmd.url }),
                id: asListingId(this.deps.ids.next()),
                workspaceId: ws.value.id,
                itemId: item.id,
                platform,
                price: money.value.price,
                listedAt: today,
              }),
            );
            if (!created.ok) return err(new ValidationFailed(created.error.message));
            listing = created.value;
            await repos.listings.save(listing);
          }
          break;
        }
        case "UNLIST": {
          const r = item.unlist(now);
          if (!r.ok) return r;
          await endActiveListings(repos.listings, ws.value.id, item.id, today, "ENDED");
          break;
        }
        case "RESERVE": {
          const r = item.reserve(now);
          if (!r.ok) return r;
          break;
        }
        case "WRITE_OFF": {
          const r = item.writeOff(cmd.reason ?? "LOST", now);
          if (!r.ok) return r;
          await endActiveListings(repos.listings, ws.value.id, item.id, today, "ENDED");
          break;
        }
        case "RESTOCK": {
          const r = item.restock(now);
          if (!r.ok) return r;
          break;
        }
      }
      await repos.items.save(item);
      events.collect(item);
      const dto = toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) });
      return ok({ item: dto, listing: listing ? toListingDto(listing) : null });
    });
  }
}
