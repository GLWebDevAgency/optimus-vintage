import type { IsoDate } from "../shared/entity.js";
import type { ItemId, ListingId, WorkspaceId } from "../shared/ids.js";
import { Money } from "../money/money.js";
import type { Platform } from "./platforms.js";
import { assertInvariant } from "../shared/result.js";

export type ListingStatus = "ACTIVE" | "ENDED" | "SOLD";

export interface ListingProps {
  readonly id: ListingId;
  readonly workspaceId: WorkspaceId;
  readonly itemId: ItemId;
  readonly platform: Platform;
  readonly price: Money;
  readonly listedAt: IsoDate;
  readonly url?: string;
  readonly status: ListingStatus;
  readonly endedAt?: IsoDate;
}

/** Une pièce peut être exposée sur plusieurs plateformes à des prix différents. */
export class Listing {
  private constructor(private p: ListingProps) {}
  static create(p: Omit<ListingProps, "status">): Listing {
    assertInvariant(p.price.isPositive, "Le prix affiché doit être positif");
    return new Listing({ ...p, status: "ACTIVE" });
  }
  static rehydrate(p: ListingProps): Listing { return new Listing(p); }
  get id(): ListingId { return this.p.id; }
  get itemId(): ItemId { return this.p.itemId; }
  get platform(): Platform { return this.p.platform; }
  get price(): Money { return this.p.price; }
  get status(): ListingStatus { return this.p.status; }
  get listedAt(): IsoDate { return this.p.listedAt; }
  get url(): string | undefined { return this.p.url; }
  reprice(price: Money): void { assertInvariant(price.isPositive, "Prix invalide"); this.p = { ...this.p, price }; }
  end(at: IsoDate, reason: "ENDED" | "SOLD" = "ENDED"): void { this.p = { ...this.p, status: reason, endedAt: at }; }
  toProps(): ListingProps { return { ...this.p }; }
}
