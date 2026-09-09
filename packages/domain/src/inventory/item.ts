import type { Platform } from "../listing/platforms.js";
import type { Money } from "../money/money.js";
import { AggregateRoot } from "../shared/entity.js";
import type { ItemId, PhotoId, SourceId, WorkspaceId } from "../shared/ids.js";
import { DomainError, err, InvalidTransition, ok, type Result } from "../shared/result.js";

export const ITEM_STATUSES = [
  "IN_STOCK",
  "LISTED",
  "RESERVED",
  "SOLD",
  "RETURNED",
  "LOST",
  "DONATED",
] as const;
export type ItemStatus = (typeof ITEM_STATUSES)[number];

export const CATEGORIES = [
  "JACKET",
  "COAT",
  "KNITWEAR",
  "SWEATSHIRT",
  "SHIRT",
  "TSHIRT",
  "POLO",
  "PANTS",
  "JEANS",
  "SHORTS",
  "DRESS",
  "SKIRT",
  "SUIT",
  "TRACKSUIT",
  "SHOES",
  "BOOTS",
  "SNEAKERS",
  "BAG",
  "HAT",
  "SCARF",
  "BELT",
  "JEWELRY",
  "ACCESSORY",
  "OTHER",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CONDITIONS = [
  "NEW_WITH_TAGS",
  "NEW",
  "EXCELLENT",
  "VERY_GOOD",
  "GOOD",
  "FAIR",
  "POOR",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const GENDERS = ["WOMEN", "MEN", "UNISEX", "KIDS"] as const;
export type Gender = (typeof GENDERS)[number];

export const ERAS = [
  "1950s",
  "1960s",
  "1970s",
  "1980s",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
  "UNKNOWN",
] as const;
export type Era = (typeof ERAS)[number];

export interface PhotoRef {
  readonly id: PhotoId;
  readonly key: string;
  readonly width?: number;
  readonly height?: number;
  readonly blurhash?: string;
}
export interface Measurements {
  readonly chestCm?: number;
  readonly lengthCm?: number;
  readonly shoulderCm?: number;
  readonly sleeveCm?: number;
  readonly waistCm?: number;
  readonly inseamCm?: number;
}

/** Transitions autorisées de la machine à états d'une pièce. */
const TRANSITIONS: Readonly<Record<ItemStatus, readonly ItemStatus[]>> = {
  IN_STOCK: ["LISTED", "RESERVED", "SOLD", "LOST", "DONATED"],
  LISTED: ["IN_STOCK", "RESERVED", "SOLD", "LOST", "DONATED"],
  RESERVED: ["IN_STOCK", "LISTED", "SOLD", "LOST"],
  SOLD: ["RETURNED", "IN_STOCK"],
  RETURNED: ["IN_STOCK", "LISTED", "LOST", "DONATED"],
  LOST: ["IN_STOCK"],
  DONATED: [],
};
export const canTransition = (from: ItemStatus, to: ItemStatus): boolean =>
  TRANSITIONS[from].includes(to);
/** Une pièce "vendable" compte dans les pièces restantes d'une source. */
export const SELLABLE: ReadonlySet<ItemStatus> = new Set([
  "IN_STOCK",
  "LISTED",
  "RESERVED",
  "RETURNED",
]);

export interface ItemProps {
  readonly id: ItemId;
  readonly workspaceId: WorkspaceId;
  readonly sourceId: SourceId;
  readonly sku: string;
  readonly title: string;
  readonly brand?: string;
  readonly category: Category;
  readonly gender?: Gender;
  readonly size?: string;
  readonly condition: Condition;
  readonly era?: Era;
  readonly colors: readonly string[];
  readonly materials: readonly string[];
  readonly measurements?: Measurements;
  readonly acquisitionCost: Money;
  readonly retailPrice?: Money;
  readonly targetPrice?: Money;
  readonly status: ItemStatus;
  readonly photos: readonly PhotoRef[];
  readonly bin?: string;
  readonly notes?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly listedAt?: Date;
  readonly soldAt?: Date;
}

export class Item extends AggregateRoot<ItemId> {
  private constructor(private p: ItemProps) {
    super(p.id);
  }

  static create(
    p: Omit<ItemProps, "status" | "createdAt" | "updatedAt" | "colors" | "materials" | "photos"> & {
      colors?: readonly string[];
      materials?: readonly string[];
      photos?: readonly PhotoRef[];
      now: Date;
    },
  ): Result<Item> {
    const { now, ...rest } = p;
    if (!p.title.trim())
      return err(new DomainError("TITLE_REQUIRED", "Le titre de la pièce est requis"));
    if (p.acquisitionCost.isNegative)
      return err(
        new DomainError("NEGATIVE_COST", "Le coût d'acquisition ne peut pas être négatif"),
      );
    if (p.retailPrice && p.retailPrice.currency !== p.acquisitionCost.currency)
      return err(new DomainError("CURRENCY_MISMATCH", "Prix neuf dans une autre devise"));
    if (p.targetPrice && p.targetPrice.currency !== p.acquisitionCost.currency)
      return err(new DomainError("CURRENCY_MISMATCH", "Prix cible dans une autre devise"));
    if (!/^[A-Z]{1,4}-\d{4,}$/.test(p.sku))
      return err(
        new DomainError("INVALID_SKU", "SKU invalide (attendu : CH-0001)", { sku: p.sku }),
      );
    const item = new Item({
      ...rest,
      colors: p.colors ?? [],
      materials: p.materials ?? [],
      photos: p.photos ?? [],
      status: "IN_STOCK",
      createdAt: now,
      updatedAt: now,
    });
    item.record({
      type: "ItemCreated",
      workspaceId: p.workspaceId,
      itemId: p.id,
      sourceId: p.sourceId,
      occurredAt: now,
    });
    return ok(item);
  }
  static rehydrate(p: ItemProps): Item {
    return new Item(p);
  }

  get workspaceId(): WorkspaceId {
    return this.p.workspaceId;
  }
  get sourceId(): SourceId {
    return this.p.sourceId;
  }
  get sku(): string {
    return this.p.sku;
  }
  get title(): string {
    return this.p.title;
  }
  get brand(): string | undefined {
    return this.p.brand;
  }
  get category(): Category {
    return this.p.category;
  }
  get condition(): Condition {
    return this.p.condition;
  }
  get status(): ItemStatus {
    return this.p.status;
  }
  get acquisitionCost(): Money {
    return this.p.acquisitionCost;
  }
  get retailPrice(): Money | undefined {
    return this.p.retailPrice;
  }
  get targetPrice(): Money | undefined {
    return this.p.targetPrice;
  }
  get photos(): readonly PhotoRef[] {
    return this.p.photos;
  }
  get createdAt(): Date {
    return this.p.createdAt;
  }
  get updatedAt(): Date {
    return this.p.updatedAt;
  }
  get soldAt(): Date | undefined {
    return this.p.soldAt;
  }
  get isSellable(): boolean {
    return SELLABLE.has(this.p.status);
  }

  /** Décote face au neuf : 0.7 = −70 % vs prix boutique. */
  discountVsRetail(price: Money | undefined = this.p.targetPrice): number | undefined {
    const rrp = this.p.retailPrice;
    if (!rrp || !price || rrp.isZero) return undefined;
    return Math.max(0, 1 - price.minor / rrp.minor);
  }

  /** Jours depuis l'entrée en stock (pour détecter le stock dormant). */
  ageInDays(now: Date): number {
    return Math.floor((now.getTime() - this.p.createdAt.getTime()) / 86_400_000);
  }
  isDormant(now: Date, thresholdDays = 30): boolean {
    return this.isSellable && this.ageInDays(now) >= thresholdDays;
  }

  private transition(to: ItemStatus, now: Date): Result<void> {
    if (!canTransition(this.p.status, to))
      return err(new InvalidTransition("Item", this.p.status, to));
    this.p = { ...this.p, status: to, updatedAt: now };
    return ok(undefined);
  }

  markListed(platform: Platform, now: Date): Result<void> {
    if (this.p.status === "LISTED") return ok(undefined);
    const r = this.transition("LISTED", now);
    if (!r.ok) return r;
    this.p = { ...this.p, listedAt: this.p.listedAt ?? now };
    this.record({
      type: "ItemListed",
      workspaceId: this.p.workspaceId,
      itemId: this.id,
      platform,
      occurredAt: now,
    });
    return ok(undefined);
  }
  unlist(now: Date): Result<void> {
    return this.transition("IN_STOCK", now);
  }
  reserve(now: Date): Result<void> {
    return this.transition("RESERVED", now);
  }
  /** Appelé par l'agrégat Sale via le use case : une pièce ne se vend pas "toute seule". */
  markSold(now: Date): Result<void> {
    const r = this.transition("SOLD", now);
    if (!r.ok) return r;
    this.p = { ...this.p, soldAt: now };
    return ok(undefined);
  }
  markReturned(now: Date): Result<void> {
    const r = this.transition("RETURNED", now);
    if (!r.ok) return r;
    const { soldAt: _sold, ...rest } = this.p;
    this.p = rest;
    return ok(undefined);
  }
  restock(now: Date): Result<void> {
    const r = this.transition("IN_STOCK", now);
    if (!r.ok) return r;
    const { soldAt: _sold, ...rest } = this.p;
    this.p = rest;
    return ok(undefined);
  }
  writeOff(reason: "LOST" | "DONATED", now: Date): Result<void> {
    const r = this.transition(reason, now);
    if (!r.ok) return r;
    this.record({
      type: "ItemWrittenOff",
      workspaceId: this.p.workspaceId,
      itemId: this.id,
      reason,
      occurredAt: now,
    });
    return ok(undefined);
  }

  update(
    patch: Partial<
      Pick<
        ItemProps,
        | "title"
        | "brand"
        | "category"
        | "gender"
        | "size"
        | "condition"
        | "era"
        | "colors"
        | "materials"
        | "measurements"
        | "acquisitionCost"
        | "retailPrice"
        | "targetPrice"
        | "bin"
        | "notes"
      >
    >,
    now: Date,
  ): Result<void> {
    const next: ItemProps = { ...this.p, ...patch, updatedAt: now };
    if (!next.title.trim())
      return err(new DomainError("TITLE_REQUIRED", "Le titre de la pièce est requis"));
    if (next.acquisitionCost.isNegative)
      return err(new DomainError("NEGATIVE_COST", "Coût négatif"));
    this.p = next;
    return ok(undefined);
  }
  addPhoto(photo: PhotoRef, now: Date, max = 8): Result<void> {
    if (this.p.photos.length >= max)
      return err(new DomainError("PHOTO_LIMIT", `Maximum ${max} photos`, { max }));
    this.p = { ...this.p, photos: [...this.p.photos, photo], updatedAt: now };
    return ok(undefined);
  }
  removePhoto(photoId: PhotoId, now: Date): void {
    this.p = { ...this.p, photos: this.p.photos.filter((ph) => ph.id !== photoId), updatedAt: now };
  }
  reorderPhotos(ids: readonly PhotoId[], now: Date): void {
    const byId = new Map(this.p.photos.map((ph) => [ph.id, ph]));
    const ordered = ids.map((id) => byId.get(id)).filter((ph): ph is PhotoRef => ph !== undefined);
    const rest = this.p.photos.filter((ph) => !ids.includes(ph.id));
    this.p = { ...this.p, photos: [...ordered, ...rest], updatedAt: now };
  }
  toProps(): ItemProps {
    return { ...this.p };
  }
}

/** Génère un SKU lisible : préfixe de l'espace + compteur sur 4 chiffres minimum. */
export const formatSku = (prefix: string, sequence: number): string =>
  `${prefix}-${String(sequence).padStart(4, "0")}`;
