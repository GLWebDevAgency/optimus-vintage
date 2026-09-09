import type { Currency } from "../money/currency.js";
import type { Money } from "../money/money.js";
import { AggregateRoot, type IsoDate } from "../shared/entity.js";
import type { SourceId, WorkspaceId } from "../shared/ids.js";
import { assertInvariant, DomainError, err, ok, type Result } from "../shared/result.js";

/** Comment la pièce a été achetée. C'est le concept racine de Chiné. */
export const SOURCE_KINDS = ["LOT", "PALLET", "PICKING", "UNIT"] as const;
export type SourceKind = (typeof SOURCE_KINDS)[number];

/** D'où : grossiste (Eureka), B2B en ligne (Fleek), brocante / vide-grenier, friperie, perso, autre. */
export const SUPPLIER_KINDS = [
  "WHOLESALER",
  "ONLINE_B2B",
  "FLEA_MARKET",
  "THRIFT_STORE",
  "PERSONAL",
  "AUCTION",
  "OTHER",
] as const;
export type SupplierKind = (typeof SUPPLIER_KINDS)[number];

export type AllocationPolicy = "EVEN" | "BY_WEIGHT" | "MANUAL";

export interface GeoPoint {
  readonly lat: number;
  readonly lng: number;
}
export interface SourceLocation {
  readonly label: string;
  readonly point?: GeoPoint;
}

export interface PurchaseSourceProps {
  readonly id: SourceId;
  readonly workspaceId: WorkspaceId;
  readonly kind: SourceKind;
  readonly name: string;
  readonly supplierName?: string;
  readonly supplierKind: SupplierKind;
  readonly purchasedAt: IsoDate;
  readonly goodsCost: Money;
  readonly extraCosts: Money;
  readonly announcedQuantity?: number;
  readonly receivedQuantity?: number;
  readonly weightKg?: number;
  readonly location?: SourceLocation;
  readonly allocationPolicy: AllocationPolicy;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class QuantityRequired extends DomainError {
  constructor(kind: SourceKind) {
    super("QUANTITY_REQUIRED", `Une source de type ${kind} doit annoncer une quantité`, { kind });
  }
}

export class PurchaseSource extends AggregateRoot<SourceId> {
  private constructor(private p: PurchaseSourceProps) {
    super(p.id);
  }

  static create(
    p: Omit<PurchaseSourceProps, "allocationPolicy" | "createdAt" | "updatedAt"> & {
      allocationPolicy?: AllocationPolicy;
      now: Date;
    },
  ): Result<PurchaseSource> {
    const { now, ...rest } = p;
    if (!p.name.trim())
      return err(new DomainError("NAME_REQUIRED", "Le nom de la source est requis"));
    if (p.goodsCost.isNegative || p.extraCosts.isNegative)
      return err(new DomainError("NEGATIVE_COST", "Un coût ne peut pas être négatif"));
    if (p.goodsCost.currency !== p.extraCosts.currency)
      return err(new DomainError("CURRENCY_MISMATCH", "Coûts en devises différentes"));
    if (
      (p.kind === "LOT" || p.kind === "PALLET") &&
      !(p.announcedQuantity && p.announcedQuantity > 0)
    )
      return err(new QuantityRequired(p.kind));
    if (p.kind === "UNIT" && p.announcedQuantity !== undefined && p.announcedQuantity !== 1)
      return err(new DomainError("UNIT_QUANTITY", "Un achat unitaire porte une seule pièce"));
    const policy =
      p.allocationPolicy ??
      (p.kind === "PALLET" && p.weightKg ? "BY_WEIGHT" : p.kind === "PICKING" ? "MANUAL" : "EVEN");
    const props: PurchaseSourceProps = {
      ...rest,
      allocationPolicy: policy,
      createdAt: now,
      updatedAt: now,
      ...(p.kind === "UNIT" ? { announcedQuantity: 1 } : {}),
    };
    return ok(new PurchaseSource(props));
  }
  static rehydrate(p: PurchaseSourceProps): PurchaseSource {
    return new PurchaseSource(p);
  }

  get workspaceId(): WorkspaceId {
    return this.p.workspaceId;
  }
  get kind(): SourceKind {
    return this.p.kind;
  }
  get name(): string {
    return this.p.name;
  }
  get supplierName(): string | undefined {
    return this.p.supplierName;
  }
  get supplierKind(): SupplierKind {
    return this.p.supplierKind;
  }
  get purchasedAt(): IsoDate {
    return this.p.purchasedAt;
  }
  get goodsCost(): Money {
    return this.p.goodsCost;
  }
  get extraCosts(): Money {
    return this.p.extraCosts;
  }
  get currency(): Currency {
    return this.p.goodsCost.currency;
  }
  get announcedQuantity(): number | undefined {
    return this.p.announcedQuantity;
  }
  get receivedQuantity(): number | undefined {
    return this.p.receivedQuantity;
  }
  get weightKg(): number | undefined {
    return this.p.weightKg;
  }
  get location(): SourceLocation | undefined {
    return this.p.location;
  }
  get allocationPolicy(): AllocationPolicy {
    return this.p.allocationPolicy;
  }
  get notes(): string | undefined {
    return this.p.notes;
  }
  get createdAt(): Date {
    return this.p.createdAt;
  }
  get updatedAt(): Date {
    return this.p.updatedAt;
  }

  /** Investissement total = marchandise + frais (port, essence, entrée de brocante…). */
  get totalInvestment(): Money {
    return this.p.goodsCost.add(this.p.extraCosts);
  }

  /** Quantité de référence : reçue si connue, sinon annoncée. */
  get effectiveQuantity(): number | undefined {
    return this.p.receivedQuantity ?? this.p.announcedQuantity;
  }

  /** Coût unitaire moyen théorique. */
  get averageUnitCost(): Money | undefined {
    const q = this.effectiveQuantity;
    return q && q > 0 ? this.totalInvestment.divide(q) : undefined;
  }

  /** Réception d'un lot / ballot : quantité réellement reçue (casse, manquants). */
  receive(receivedQuantity: number, now: Date): Result<void> {
    assertInvariant(
      Number.isInteger(receivedQuantity) && receivedQuantity >= 0,
      "Quantité reçue invalide",
    );
    if (this.p.kind === "UNIT")
      return err(new DomainError("NOT_RECEIVABLE", "Un achat unitaire ne se réceptionne pas"));
    this.p = { ...this.p, receivedQuantity, updatedAt: now };
    this.record({
      type: "SourceReceived",
      workspaceId: this.p.workspaceId,
      sourceId: this.id,
      receivedQuantity,
      occurredAt: now,
    });
    return ok(undefined);
  }

  update(
    patch: Partial<
      Pick<
        PurchaseSourceProps,
        | "name"
        | "supplierName"
        | "supplierKind"
        | "purchasedAt"
        | "goodsCost"
        | "extraCosts"
        | "announcedQuantity"
        | "weightKg"
        | "location"
        | "notes"
        | "allocationPolicy"
      >
    >,
    now: Date,
  ): Result<void> {
    const next = { ...this.p, ...patch, updatedAt: now };
    const check = PurchaseSource.create({ ...next, now });
    if (!check.ok) return check;
    this.p = { ...next, createdAt: this.p.createdAt };
    return ok(undefined);
  }

  /** Taux de casse / manquants entre annoncé et reçu. */
  get shrinkageRate(): number | undefined {
    const a = this.p.announcedQuantity,
      r = this.p.receivedQuantity;
    if (!a || r === undefined) return undefined;
    return Math.max(0, (a - r) / a);
  }

  toProps(): PurchaseSourceProps {
    return { ...this.p };
  }
}
