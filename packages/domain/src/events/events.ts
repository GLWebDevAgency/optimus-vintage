import type { Money } from "../money/money.js";
import type { ItemId, SaleId, SourceId, WorkspaceId } from "../shared/ids.js";

interface Base<T extends string> {
  readonly type: T;
  readonly workspaceId: WorkspaceId;
  readonly occurredAt: Date;
}
export interface ItemCreated extends Base<"ItemCreated"> {
  readonly itemId: ItemId;
  readonly sourceId: SourceId;
}
export interface ItemListed extends Base<"ItemListed"> {
  readonly itemId: ItemId;
  readonly platform: string;
}
export interface ItemSold extends Base<"ItemSold"> {
  readonly itemId: ItemId;
  readonly saleId: SaleId;
  readonly net: Money;
}
export interface ItemWrittenOff extends Base<"ItemWrittenOff"> {
  readonly itemId: ItemId;
  readonly reason: "LOST" | "DONATED";
}
export interface SaleRefunded extends Base<"SaleRefunded"> {
  readonly saleId: SaleId;
  readonly itemId: ItemId;
}
export interface SaleCancelled extends Base<"SaleCancelled"> {
  readonly saleId: SaleId;
  readonly itemId: ItemId;
}
export interface SourceReceived extends Base<"SourceReceived"> {
  readonly sourceId: SourceId;
  readonly receivedQuantity: number;
}

export type DomainEvent =
  | ItemCreated
  | ItemListed
  | ItemSold
  | ItemWrittenOff
  | SaleRefunded
  | SaleCancelled
  | SourceReceived;
