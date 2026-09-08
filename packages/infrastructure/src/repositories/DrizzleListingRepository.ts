import {
  asItemId,
  asListingId,
  asWorkspaceId,
  type ItemId,
  Listing,
  type ListingId,
  type ListingProps,
  type WorkspaceId,
} from "@chine/domain";
import { and, asc, eq } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type ListingRow, listings } from "../db/schema.js";
import type { ListingRepository } from "../ports.js";
import { compact, isoDate, money, orNull, orUndefined } from "./mapping.js";

export function listingToDomain(row: ListingRow): Listing {
  const props = compact<ListingProps>({
    id: asListingId(row.id),
    workspaceId: asWorkspaceId(row.workspaceId),
    itemId: asItemId(row.itemId),
    platform: row.platform,
    price: money(row.priceMinor, row.currency),
    listedAt: isoDate(row.listedAt),
    url: orUndefined(row.url),
    status: row.status,
    endedAt: row.endedAt === null ? undefined : isoDate(row.endedAt),
  });
  return Listing.rehydrate(props);
}

export function listingToRow(listing: Listing) {
  const p = listing.toProps();
  return {
    id: p.id as string,
    workspaceId: p.workspaceId as string,
    itemId: p.itemId as string,
    platform: p.platform,
    priceMinor: p.price.minor,
    currency: p.price.currency,
    listedAt: p.listedAt,
    url: orNull(p.url),
    status: p.status,
    endedAt: orNull(p.endedAt),
  };
}

export class DrizzleListingRepository implements ListingRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(workspaceId: WorkspaceId, id: ListingId): Promise<Listing | undefined> {
    const row = await this.db.query.listings.findFirst({
      where: and(eq(listings.workspaceId, workspaceId), eq(listings.id, id)),
    });
    return row ? listingToDomain(row) : undefined;
  }

  async byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Listing[]> {
    const rows = await this.db
      .select()
      .from(listings)
      .where(and(eq(listings.workspaceId, workspaceId), eq(listings.itemId, itemId)))
      .orderBy(asc(listings.listedAt), asc(listings.id));
    return rows.map(listingToDomain);
  }

  async save(listing: Listing): Promise<void> {
    const { id, workspaceId, itemId, ...rest } = listingToRow(listing);
    await this.db
      .insert(listings)
      .values({ id, workspaceId, itemId, ...rest })
      .onConflictDoUpdate({ target: listings.id, set: rest });
  }
}
