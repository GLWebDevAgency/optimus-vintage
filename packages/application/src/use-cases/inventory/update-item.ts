import {
  type Category,
  type Condition,
  type DomainError,
  type Era,
  err,
  type Gender,
  type ItemId,
  type Measurements,
  ok,
  type Result,
} from "@chine/domain";
import type { ItemDto } from "../../dto.js";
import { NotFound } from "../../errors.js";
import { toItemDto } from "../../mappers/index.js";
import type { AppDependencies } from "../../ports/index.js";
import { loadOwnedWorkspace, type WorkspaceScoped } from "../../shared/access.js";
import { type MoneyInput, readMoney } from "../../shared/money.js";
import { omitUndefined } from "../../shared/objects.js";
import { transact } from "../../shared/transaction.js";
import type { UseCase } from "../use-case.js";

export interface UpdateItemCommand extends WorkspaceScoped {
  readonly itemId: ItemId;
  readonly title?: string;
  readonly brand?: string;
  readonly category?: Category;
  readonly gender?: Gender;
  readonly size?: string;
  readonly condition?: Condition;
  readonly era?: Era;
  readonly colors?: readonly string[];
  readonly materials?: readonly string[];
  readonly measurements?: Measurements;
  readonly acquisitionCost?: MoneyInput;
  readonly retailPrice?: MoneyInput;
  readonly targetPrice?: MoneyInput;
  readonly bin?: string;
  readonly notes?: string;
}
export interface UpdateItemOutput {
  readonly item: ItemDto;
}

export class UpdateItem implements UseCase<UpdateItemCommand, UpdateItemOutput> {
  constructor(
    private readonly deps: Pick<AppDependencies, "uow" | "events" | "clock" | "photos">,
  ) {}

  execute(cmd: UpdateItemCommand): Promise<Result<UpdateItemOutput, DomainError>> {
    return transact(this.deps, async (repos, events) => {
      const ws = await loadOwnedWorkspace(repos.workspaces, cmd);
      if (!ws.ok) return ws;
      const item = await repos.items.byId(ws.value.id, cmd.itemId);
      if (!item) return err(new NotFound("Item", cmd.itemId));
      const money = readMoney(ws.value, {
        acquisitionCost: cmd.acquisitionCost,
        retailPrice: cmd.retailPrice,
        targetPrice: cmd.targetPrice,
      });
      if (!money.ok) return money;
      const patch = omitUndefined({
        title: cmd.title?.trim(),
        brand: cmd.brand,
        category: cmd.category,
        gender: cmd.gender,
        size: cmd.size,
        condition: cmd.condition,
        era: cmd.era,
        colors: cmd.colors,
        materials: cmd.materials,
        measurements: cmd.measurements,
        bin: cmd.bin,
        notes: cmd.notes,
        ...money.value,
      });
      const now = this.deps.clock.now();
      const updated = item.update(patch, now);
      if (!updated.ok) return updated;
      await repos.items.save(item);
      events.collect(item);
      return ok({
        item: toItemDto(item, { now, publicUrl: (k) => this.deps.photos.publicUrl(k) }),
      });
    });
  }
}
