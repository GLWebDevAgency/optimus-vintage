import { SELLABLE, type WorkspaceId } from "@chine/domain";
import type { ItemRepository } from "../../ports/index.js";

/** Pièces qui comptent dans le quota `items` : celles encore en stock (au sens large). */
export const countSellableItems = (
  items: ItemRepository,
  workspaceId: WorkspaceId,
): Promise<number> => items.count(workspaceId, { status: [...SELLABLE] });
