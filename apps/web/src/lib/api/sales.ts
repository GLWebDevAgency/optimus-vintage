import { GetSale, type WorkspaceScoped } from "@chine/application";
import type * as C from "@chine/contract";
import { asSaleId } from "@chine/domain";
import type { Container } from "@/lib/container";
import { attachItemSummaries } from "./loaders";
import type { MapContext } from "./mappers";

/** Vente au format du contrat, avec le résumé de sa pièce. */
export async function loadSale(
  deps: Container,
  scope: WorkspaceScoped,
  saleId: string,
  ctx: MapContext,
): Promise<C.SaleDto> {
  const result = await new GetSale(deps).execute({ ...scope, saleId: asSaleId(saleId) });
  if (!result.ok) throw result.error;
  const [dto] = await attachItemSummaries(
    deps,
    scope.workspaceId,
    [{ ...result.value.sale, item: null }],
    ctx,
  );
  if (!dto) throw new Error("Vente chargée mais absente de la réponse");
  return dto;
}
