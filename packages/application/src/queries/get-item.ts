import {
  type DomainError,
  err,
  type ItemId,
  ok,
  type Platform,
  type Result,
  ScheduleFeePolicy,
  simulatePrice,
} from "@chine/domain";
import type {
  AppraisalDto,
  ItemDto,
  ListingDto,
  PriceSimulationDto,
  SaleDto,
  SourceDto,
} from "../dto.js";
import { NotFound } from "../errors.js";
import {
  toAppraisalDto,
  toItemDto,
  toListingDto,
  toSaleDto,
  toSimulationDto,
  toSourceDto,
} from "../mappers/index.js";
import type { AppDependencies } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import type { Query } from "./query.js";

/** Plateformes simulées par défaut sur la fiche d'une pièce. */
export const SIMULATED_PLATFORMS: readonly Platform[] = [
  "VINTED",
  "VESTIAIRE",
  "LEBONCOIN",
  "EBAY",
];

export interface GetItemQuery extends WorkspaceScoped {
  readonly itemId: ItemId;
}
export interface GetItemOutput {
  readonly item: ItemDto;
  readonly source: SourceDto | null;
  readonly sales: readonly SaleDto[];
  readonly listings: readonly ListingDto[];
  readonly appraisal: AppraisalDto | null;
  /** Simulations au prix cible (vide si la pièce n'a pas de prix cible). */
  readonly simulations: readonly PriceSimulationDto[];
}

export class GetItem implements Query<GetItemQuery, GetItemOutput> {
  constructor(
    private readonly deps: Pick<
      AppDependencies,
      "workspaces" | "items" | "sources" | "sales" | "listings" | "appraisals" | "clock" | "photos"
    >,
  ) {}

  async execute(q: GetItemQuery): Promise<Result<GetItemOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const id = ws.value.id;
    const item = await this.deps.items.byId(id, q.itemId);
    if (!item) return err(new NotFound("Item", q.itemId));
    const [source, sales, listings, appraisal, overrides] = await Promise.all([
      this.deps.sources.byId(id, item.sourceId),
      this.deps.sales.byItem(id, item.id),
      this.deps.listings.byItem(id, item.id),
      this.deps.appraisals.latestForItem(id, item.id),
      this.deps.workspaces.feeOverrides(id),
    ]);
    const policy = ScheduleFeePolicy.withOverrides(overrides);
    const target = item.targetPrice;
    const simulations = target
      ? SIMULATED_PLATFORMS.map((p) =>
          toSimulationDto(simulatePrice(p, target, item.acquisitionCost, policy)),
        )
      : [];
    return ok({
      item: toItemDto(item, {
        now: this.deps.clock.now(),
        publicUrl: (k) => this.deps.photos.publicUrl(k),
      }),
      source: source ? toSourceDto(source) : null,
      sales: sales.map(toSaleDto),
      listings: listings.map(toListingDto),
      appraisal: appraisal ? toAppraisalDto(appraisal) : null,
      simulations,
    });
  }
}
