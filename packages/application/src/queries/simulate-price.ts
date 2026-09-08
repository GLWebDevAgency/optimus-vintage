import {
  type DomainError,
  err,
  type ItemId,
  Money,
  ok,
  type Platform,
  priceForTargetMargin,
  type Result,
  ScheduleFeePolicy,
  simulatePrice,
  type Workspace,
} from "@chine/domain";
import type { MoneyDto, PriceSimulationDto } from "../dto.js";
import { NotFound, ValidationFailed } from "../errors.js";
import { toMoneyDto, toSimulationDto } from "../mappers/index.js";
import type { AppDependencies } from "../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../shared/access.js";
import { type MoneyInput, readMoney } from "../shared/money.js";
import type { Query } from "./query.js";

export interface SimulatePriceQuery extends WorkspaceScoped {
  readonly platform: Platform;
  readonly price: MoneyInput;
  /** Coût d'acquisition explicite, ou celui de la pièce `itemId`. */
  readonly acquisitionCost?: MoneyInput;
  readonly itemId?: ItemId;
  /** Frais annexes (port, emballage) déduits du net. */
  readonly extraCosts?: MoneyInput;
}
export interface SimulatePriceOutput extends PriceSimulationDto {
  /** Prix affiché minimal pour atteindre la marge cible de l'espace. */
  readonly priceForTargetMargin: MoneyDto;
  readonly targetMargin: MoneyDto;
}

/** Marge cible de l'espace convertie en montant pour un coût donné. */
export function targetMarginAmount(ws: Workspace, acquisitionCost: Money): Money {
  const t = ws.targetMargin;
  return t.kind === "PERCENT"
    ? acquisitionCost.percent(t.value)
    : Money.ofMinor(t.value, ws.currency);
}

export class SimulatePrice implements Query<SimulatePriceQuery, SimulatePriceOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "workspaces" | "items">) {}

  async execute(q: SimulatePriceQuery): Promise<Result<SimulatePriceOutput, DomainError>> {
    const ws = await loadOwnedWorkspace(this.deps.workspaces, q);
    if (!ws.ok) return ws;
    const money = readMoney(ws.value, {
      price: q.price,
      acquisitionCost: q.acquisitionCost,
      extraCosts: q.extraCosts,
    });
    if (!money.ok) return money;
    let cost = money.value.acquisitionCost;
    if (!cost && q.itemId) {
      const item = await this.deps.items.byId(ws.value.id, q.itemId);
      if (!item) return err(new NotFound("Item", q.itemId));
      cost = item.acquisitionCost;
    }
    if (!cost)
      return err(new ValidationFailed("Coût d'acquisition requis (acquisitionCost ou itemId)"));
    const policy = ScheduleFeePolicy.withOverrides(
      await this.deps.workspaces.feeOverrides(ws.value.id),
    );
    const extra = money.value.extraCosts ?? Money.zero(ws.value.currency);
    const target = targetMarginAmount(ws.value, cost);
    return ok({
      ...toSimulationDto(simulatePrice(q.platform, money.value.price, cost, policy, extra)),
      priceForTargetMargin: toMoneyDto(
        priceForTargetMargin(q.platform, cost, target, policy, extra),
      ),
      targetMargin: toMoneyDto(target),
    });
  }
}
