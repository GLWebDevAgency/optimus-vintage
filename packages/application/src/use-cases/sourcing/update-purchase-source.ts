import {
  type AllocationPolicy,
  type DomainError,
  err,
  type IsoDate,
  ok,
  type Result,
  type SourceId,
  type SourceLocation,
  type SupplierKind,
} from "@chine/domain";
import type { SourceDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toSourceDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface UpdatePurchaseSourceCommand extends WorkspaceScoped {
  readonly sourceId: SourceId;
  readonly name?: string;
  readonly supplierName?: string;
  readonly supplierKind?: SupplierKind;
  readonly purchasedAt?: IsoDate;
  readonly goodsCost?: MoneyInput;
  readonly extraCosts?: MoneyInput;
  readonly announcedQuantity?: number;
  readonly weightKg?: number;
  readonly location?: SourceLocation;
  readonly notes?: string;
  readonly allocationPolicy?: AllocationPolicy;
}
export interface UpdatePurchaseSourceOutput {
  readonly source: SourceDto;
}

export class UpdatePurchaseSource
  implements UseCase<UpdatePurchaseSourceCommand, UpdatePurchaseSourceOutput>
{
  constructor(private readonly deps: Pick<AppDependencies, "uow" | "events" | "clock">) {}

  execute(
    cmd: UpdatePurchaseSourceCommand,
  ): Promise<Result<UpdatePurchaseSourceOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const source = await repos.sources.byId(ws.value.id, cmd.sourceId);
      if (!source) return err(new NotFound("PurchaseSource", cmd.sourceId));
      const money = readMoney(ws.value, { goodsCost: cmd.goodsCost, extraCosts: cmd.extraCosts });
      if (!money.ok) return money;
      const patch = omitUndefined({
        name: cmd.name?.trim(),
        supplierName: cmd.supplierName,
        supplierKind: cmd.supplierKind,
        purchasedAt: cmd.purchasedAt,
        goodsCost: money.value.goodsCost,
        extraCosts: money.value.extraCosts,
        announcedQuantity: cmd.announcedQuantity,
        weightKg: cmd.weightKg,
        location: cmd.location,
        notes: cmd.notes,
        allocationPolicy: cmd.allocationPolicy,
      });
      const updated = source.update(patch, this.deps.clock.now());
      if (!updated.ok) return updated;
      await repos.sources.save(source);
      events.collect(source);
      return ok({ source: toSourceDto(source) });
    });
  }
}
