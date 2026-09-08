import { NotFound, type WorkspaceScoped } from "@chine/application";
import { asItemId } from "@chine/domain";
import type { Container } from "@/lib/container";

export type ClearablePrice = "retailPrice" | "targetPrice";

/**
 * Efface un prix (neuf, cible) d'une pièce. Le cas d'usage `UpdateItem` ne modélise pas
 * l'effacement d'un montant (un montant absent = « inchangé ») ; on applique donc directement
 * la méthode de l'agrégat, dans l'unité de travail, puis on publie ses événements — exactement
 * ce que fait la couche application pour ses propres cas d'usage.
 */
export async function clearItemPrices(
  deps: Container,
  scope: WorkspaceScoped,
  itemId: string,
  fields: readonly ClearablePrice[],
): Promise<void> {
  if (fields.length === 0) return;
  const now = deps.clock.now();
  const events = await deps.uow.run(async (repos) => {
    const item = await repos.items.byId(scope.workspaceId, asItemId(itemId));
    if (!item) throw new NotFound("Item", itemId);
    const patch: { retailPrice?: undefined; targetPrice?: undefined } = {};
    for (const field of fields) patch[field] = undefined;
    const updated = item.update(patch, now);
    if (!updated.ok) throw updated.error;
    await repos.items.save(item);
    return item.pullEvents();
  });
  await deps.events.publish(events);
}
