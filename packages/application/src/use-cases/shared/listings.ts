import type { IsoDate, ItemId, Listing, WorkspaceId } from "@chine/domain";
import type { ListingRepository } from "../../ports/index.js";

/** Clôture toutes les annonces actives d'une pièce (retrait ou vente). */
export async function endActiveListings(
  listings: ListingRepository,
  workspaceId: WorkspaceId,
  itemId: ItemId,
  at: IsoDate,
  reason: "ENDED" | "SOLD",
): Promise<readonly Listing[]> {
  const active = (await listings.byItem(workspaceId, itemId)).filter((l) => l.status === "ACTIVE");
  for (const l of active) {
    l.end(at, reason);
    await listings.save(l);
  }
  return active;
}
