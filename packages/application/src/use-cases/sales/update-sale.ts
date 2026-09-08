import {
  type DomainError,
  err,
  type IsoDate,
  ok,
  type Platform,
  type Result,
  type SaleId,
  ScheduleFeePolicy,
} from "@chine/domain";
import type { SaleDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toSaleDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface UpdateSaleCommand extends WorkspaceScoped {
  readonly saleId: SaleId;
  readonly platform?: Platform;
  readonly grossPrice?: MoneyInput;
  /** Si absent alors que le prix ou la plateforme change, les frais sont recalculés. */
  readonly platformFees?: MoneyInput;
  readonly shippingCost?: MoneyInput;
  readonly packagingCost?: MoneyInput;
  readonly otherCosts?: MoneyInput;
  readonly soldAt?: IsoDate;
  readonly buyer?: string;
  readonly notes?: string;
}
export interface UpdateSaleOutput {
  readonly sale: SaleDto;
}

export class UpdateSale implements UseCase<UpdateSaleCommand, UpdateSaleOutput> {
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events" | "clock">) {}

  execute(cmd: UpdateSaleCommand): Promise<Result<UpdateSaleOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const sale = await repos.sales.byId(ws.value.id, cmd.saleId);
      if (!sale) return err(new NotFound("Sale", cmd.saleId));
      const money = readMoney(ws.value, {
        grossPrice: cmd.grossPrice,
        platformFees: cmd.platformFees,
        shippingCost: cmd.shippingCost,
        packagingCost: cmd.packagingCost,
        otherCosts: cmd.otherCosts,
      });
      if (!money.ok) return money;

      const platform = cmd.platform ?? sale.platform;
      const gross = money.value.grossPrice ?? sale.grossPrice;
      let platformFees = money.value.platformFees;
      if (!platformFees && (platform !== sale.platform || !gross.equals(sale.grossPrice))) {
        const policy = ScheduleFeePolicy.withOverrides(
          await repos.workspaces.feeOverrides(ws.value.id),
        );
        platformFees = policy.feesFor(platform, gross);
      }
      const patch = omitUndefined({
        platform: cmd.platform,
        grossPrice: money.value.grossPrice,
        platformFees,
        shippingCost: money.value.shippingCost,
        packagingCost: money.value.packagingCost,
        otherCosts: money.value.otherCosts,
        soldAt: cmd.soldAt,
        buyer: cmd.buyer,
        notes: cmd.notes,
      });
      const updated = sale.update(patch, this.deps.clock.now());
      if (!updated.ok) return updated;
      await repos.sales.save(sale);
      events.collect(sale);
      return ok({ sale: toSaleDto(sale) });
    });
  }
}
