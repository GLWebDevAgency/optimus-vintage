import { AggregateRoot, type IsoDate } from "../shared/entity.js";
import type { ItemId, SaleId, SourceId, WorkspaceId } from "../shared/ids.js";
import { DomainError, InvalidTransition, err, ok, type Result } from "../shared/result.js";
import { Money } from "../money/money.js";
import type { Platform, PlatformFeePolicy } from "../listing/platforms.js";

export const SALE_STATUSES = ["COMPLETED", "PENDING", "CANCELLED", "REFUNDED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];

export interface SaleProps {
  readonly id: SaleId;
  readonly workspaceId: WorkspaceId;
  readonly itemId: ItemId;
  readonly sourceId: SourceId;
  readonly platform: Platform;
  readonly grossPrice: Money;
  readonly platformFees: Money;
  readonly shippingCost: Money;
  readonly packagingCost: Money;
  readonly otherCosts: Money;
  readonly acquisitionCost: Money;
  readonly soldAt: IsoDate;
  readonly status: SaleStatus;
  readonly buyer?: string;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly refundedAt?: Date;
}

/** Ce que rapporte réellement une vente. */
export interface SaleEconomics {
  readonly gross: Money;
  readonly fees: Money;
  readonly costs: Money;
  readonly net: Money;
  readonly margin: Money;
  readonly roi: number | undefined;
  readonly marginRate: number | undefined;
}

export interface RecordSaleInput {
  readonly id: SaleId;
  readonly workspaceId: WorkspaceId;
  readonly itemId: ItemId;
  readonly sourceId: SourceId;
  readonly platform: Platform;
  readonly grossPrice: Money;
  readonly acquisitionCost: Money;
  readonly soldAt: IsoDate;
  readonly shippingCost?: Money;
  readonly packagingCost?: Money;
  readonly otherCosts?: Money;
  /** Frais plateforme saisis manuellement ; sinon calculés par la politique. */
  readonly platformFeesOverride?: Money;
  readonly status?: SaleStatus;
  readonly buyer?: string;
  readonly notes?: string;
  readonly now: Date;
}

export class Sale extends AggregateRoot<SaleId> {
  private constructor(private p: SaleProps) { super(p.id); }

  static record(input: RecordSaleInput, feePolicy: PlatformFeePolicy): Result<Sale> {
    const c = input.grossPrice.currency;
    if (input.grossPrice.isNegative) return err(new DomainError("NEGATIVE_PRICE", "Le prix de vente ne peut pas être négatif"));
    if (input.acquisitionCost.currency !== c) return err(new DomainError("CURRENCY_MISMATCH", "Coût d'acquisition dans une autre devise"));
    const zero = Money.zero(c);
    const shipping = input.shippingCost ?? zero, packaging = input.packagingCost ?? zero, other = input.otherCosts ?? zero;
    for (const m of [shipping, packaging, other]) {
      if (m.currency !== c) return err(new DomainError("CURRENCY_MISMATCH", "Frais dans une autre devise"));
      if (m.isNegative) return err(new DomainError("NEGATIVE_COST", "Un frais ne peut pas être négatif"));
    }
    const fees = input.platformFeesOverride ?? feePolicy.feesFor(input.platform, input.grossPrice);
    if (fees.currency !== c || fees.isNegative) return err(new DomainError("INVALID_FEES", "Frais plateforme invalides"));
    const status = input.status ?? "COMPLETED";
    const sale = new Sale({
      id: input.id, workspaceId: input.workspaceId, itemId: input.itemId, sourceId: input.sourceId, platform: input.platform,
      grossPrice: input.grossPrice, platformFees: fees, shippingCost: shipping, packagingCost: packaging, otherCosts: other,
      acquisitionCost: input.acquisitionCost, soldAt: input.soldAt, status, createdAt: input.now, updatedAt: input.now,
      ...(input.buyer !== undefined ? { buyer: input.buyer } : {}), ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });
    if (status === "COMPLETED") sale.record({ type: "ItemSold", workspaceId: input.workspaceId, itemId: input.itemId, saleId: input.id, net: sale.economics.net, occurredAt: input.now });
    return ok(sale);
  }
  static rehydrate(p: SaleProps): Sale { return new Sale(p); }

  get workspaceId(): WorkspaceId { return this.p.workspaceId; }
  get itemId(): ItemId { return this.p.itemId; }
  get sourceId(): SourceId { return this.p.sourceId; }
  get platform(): Platform { return this.p.platform; }
  get status(): SaleStatus { return this.p.status; }
  get soldAt(): IsoDate { return this.p.soldAt; }
  get grossPrice(): Money { return this.p.grossPrice; }
  get platformFees(): Money { return this.p.platformFees; }
  get shippingCost(): Money { return this.p.shippingCost; }
  get packagingCost(): Money { return this.p.packagingCost; }
  get otherCosts(): Money { return this.p.otherCosts; }
  get acquisitionCost(): Money { return this.p.acquisitionCost; }
  get buyer(): string | undefined { return this.p.buyer; }
  /** Une vente qui compte dans le CA : complétée (ou en attente d'encaissement). */
  get countsAsRevenue(): boolean { return this.p.status === "COMPLETED" || this.p.status === "PENDING"; }

  get economics(): SaleEconomics {
    const gross = this.p.grossPrice;
    const fees = this.p.platformFees;
    const costs = this.p.shippingCost.add(this.p.packagingCost).add(this.p.otherCosts);
    const net = gross.subtract(fees).subtract(costs);
    const margin = net.subtract(this.p.acquisitionCost);
    return { gross, fees, costs, net, margin, roi: margin.ratioTo(this.p.acquisitionCost), marginRate: margin.ratioTo(gross) };
  }

  complete(now: Date): Result<void> {
    if (this.p.status !== "PENDING") return err(new InvalidTransition("Sale", this.p.status, "COMPLETED"));
    this.p = { ...this.p, status: "COMPLETED", updatedAt: now };
    this.record({ type: "ItemSold", workspaceId: this.p.workspaceId, itemId: this.p.itemId, saleId: this.id, net: this.economics.net, occurredAt: now });
    return ok(undefined);
  }
  /** Annulation avant expédition : la pièce revient en stock, rien n'a été encaissé. */
  cancel(now: Date): Result<void> {
    if (this.p.status === "CANCELLED" || this.p.status === "REFUNDED") return err(new InvalidTransition("Sale", this.p.status, "CANCELLED"));
    this.p = { ...this.p, status: "CANCELLED", updatedAt: now };
    this.record({ type: "SaleCancelled", workspaceId: this.p.workspaceId, itemId: this.p.itemId, saleId: this.id, occurredAt: now });
    return ok(undefined);
  }
  /** Remboursement après retour : la pièce revient (statut RETURNED), les frais de port sont perdus. */
  refund(now: Date): Result<void> {
    if (this.p.status !== "COMPLETED") return err(new InvalidTransition("Sale", this.p.status, "REFUNDED"));
    this.p = { ...this.p, status: "REFUNDED", refundedAt: now, updatedAt: now };
    this.record({ type: "SaleRefunded", workspaceId: this.p.workspaceId, itemId: this.p.itemId, saleId: this.id, occurredAt: now });
    return ok(undefined);
  }
  update(patch: Partial<Pick<SaleProps, "grossPrice" | "platformFees" | "shippingCost" | "packagingCost" | "otherCosts" | "soldAt" | "buyer" | "notes" | "platform">>, now: Date): Result<void> {
    const next = { ...this.p, ...patch, updatedAt: now };
    for (const m of [next.grossPrice, next.platformFees, next.shippingCost, next.packagingCost, next.otherCosts]) {
      if (m.currency !== this.p.grossPrice.currency) return err(new DomainError("CURRENCY_MISMATCH", "Devise incohérente"));
      if (m.isNegative) return err(new DomainError("NEGATIVE_AMOUNT", "Montant négatif"));
    }
    this.p = next;
    return ok(undefined);
  }
  toProps(): SaleProps { return { ...this.p }; }
}
