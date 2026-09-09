/**
 * Ports (interfaces) de la couche application. L'infrastructure les implémente,
 * les tests utilisent des adaptateurs en mémoire (`@chine/application/testing`).
 */
import type {
  Appraisal,
  AppraisalId,
  Currency,
  DomainEvent,
  FeeSchedule,
  IsoDate,
  Item,
  ItemId,
  ItemStatus,
  Listing,
  ListingId,
  Plan,
  Platform,
  PurchaseSource,
  Sale,
  SaleId,
  SourceId,
  UserId,
  Workspace,
  WorkspaceId,
} from "@chine/domain";

export interface Clock {
  now(): Date;
}
export interface IdGenerator {
  next(): string;
}

/** Compteur de SKU par espace, monotone, sûr en concurrence (SELECT … FOR UPDATE côté SQL). */
export interface SkuSequence {
  next(workspaceId: WorkspaceId): Promise<number>;
}

export interface WorkspaceRepository {
  byId(id: WorkspaceId): Promise<Workspace | undefined>;
  byOwner(ownerId: UserId): Promise<Workspace | undefined>;
  /** Espaces accessibles à un utilisateur (propriétaire ou membre). */
  forUser(userId: UserId): Promise<readonly Workspace[]>;
  save(ws: Workspace): Promise<void>;
  feeOverrides(id: WorkspaceId): Promise<Partial<Record<Platform, FeeSchedule>>>;
  saveFeeOverrides(
    id: WorkspaceId,
    overrides: Partial<Record<Platform, FeeSchedule>>,
  ): Promise<void>;
}

export interface SourceFilter {
  readonly kind?: PurchaseSource["kind"];
  readonly search?: string;
  readonly limit?: number;
  readonly offset?: number;
}
export interface PurchaseSourceRepository {
  byId(workspaceId: WorkspaceId, id: SourceId): Promise<PurchaseSource | undefined>;
  list(workspaceId: WorkspaceId, filter?: SourceFilter): Promise<readonly PurchaseSource[]>;
  /** Sources soumises au quota mensuel (LOT, PALLET, PICKING) créées depuis `since` ; les achats à l'unité sont exclus. */
  countCreatedSince(workspaceId: WorkspaceId, since: Date): Promise<number>;
  save(source: PurchaseSource): Promise<void>;
  delete(workspaceId: WorkspaceId, id: SourceId): Promise<void>;
}

export interface ItemFilter {
  readonly status?: readonly ItemStatus[];
  readonly sourceId?: SourceId;
  readonly search?: string;
  readonly dormantSince?: Date;
  readonly sort?: "newest" | "oldest" | "cost_desc" | "cost_asc" | "title";
  readonly limit?: number;
  readonly offset?: number;
}
export interface ItemRepository {
  byId(workspaceId: WorkspaceId, id: ItemId): Promise<Item | undefined>;
  bySku(workspaceId: WorkspaceId, sku: string): Promise<Item | undefined>;
  list(workspaceId: WorkspaceId, filter?: ItemFilter): Promise<readonly Item[]>;
  bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Item[]>;
  count(workspaceId: WorkspaceId, filter?: ItemFilter): Promise<number>;
  save(item: Item): Promise<void>;
  saveMany(items: readonly Item[]): Promise<void>;
  delete(workspaceId: WorkspaceId, id: ItemId): Promise<void>;
}

export interface ListingRepository {
  byId(workspaceId: WorkspaceId, id: ListingId): Promise<Listing | undefined>;
  byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Listing[]>;
  save(listing: Listing): Promise<void>;
}

export interface SaleFilter {
  readonly from?: IsoDate;
  readonly to?: IsoDate;
  readonly sourceId?: SourceId;
  readonly itemId?: ItemId;
  readonly platform?: Platform;
  readonly limit?: number;
  readonly offset?: number;
}
export interface SaleRepository {
  byId(workspaceId: WorkspaceId, id: SaleId): Promise<Sale | undefined>;
  byItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<readonly Sale[]>;
  bySource(workspaceId: WorkspaceId, sourceId: SourceId): Promise<readonly Sale[]>;
  list(workspaceId: WorkspaceId, filter?: SaleFilter): Promise<readonly Sale[]>;
  save(sale: Sale): Promise<void>;
}

export interface AppraisalRepository {
  byId(workspaceId: WorkspaceId, id: AppraisalId): Promise<Appraisal | undefined>;
  save(appraisal: Appraisal): Promise<void>;
  countSince(workspaceId: WorkspaceId, since: Date): Promise<number>;
  latestForItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<Appraisal | undefined>;
}

/** Entrée d'une expertise : image en base64 + contexte facultatif. */
export interface AppraisalRequest {
  readonly imageBase64: string;
  readonly mimeType: "image/jpeg" | "image/png" | "image/webp";
  readonly currency: Currency;
  readonly locale: "fr" | "en" | "de";
  readonly hints?: { brand?: string; category?: string; purchasePriceMinor?: number };
  readonly wantListingCopy?: boolean;
}
export type AppraisalDraft = Omit<Appraisal, "id" | "workspaceId" | "itemId" | "createdAt">;
/** Port IA : Gemini, Claude, ou un faux déterministe en dev. */
export interface Appraiser {
  readonly name: string;
  appraise(req: AppraisalRequest): Promise<AppraisalDraft>;
}

/** Stockage des photos : clé opaque, URL signée d'upload direct, URL publique de lecture. */
export interface PhotoStorage {
  createUploadTarget(
    workspaceId: WorkspaceId,
    mimeType: string,
  ): Promise<{
    key: string;
    uploadUrl: string;
    method: "PUT" | "POST";
    headers?: Record<string, string>;
  }>;
  /** Upload direct côté serveur (mode local ou fallback). */
  put(key: string, bytes: Uint8Array, mimeType: string): Promise<void>;
  publicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

export interface EventPublisher {
  publish(events: readonly DomainEvent[]): Promise<void>;
}

/** Unité de travail : exécute un bloc dans une transaction (les repos passés sont transactionnels). */
export interface UnitOfWork {
  run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
export interface TransactionalRepositories {
  readonly workspaces: WorkspaceRepository;
  readonly sources: PurchaseSourceRepository;
  readonly items: ItemRepository;
  readonly listings: ListingRepository;
  readonly sales: SaleRepository;
  readonly appraisals: AppraisalRepository;
  readonly skuSequence: SkuSequence;
}

/** Abonnement courant d'un espace (renseigné par Stripe ou par défaut FREE). */
export interface BillingGateway {
  currentPlan(workspaceId: WorkspaceId): Promise<Plan>;
  /** Un abonnement en cours (essai, actif, impayé en délai de grâce) : on passe par le portail. */
  hasActiveSubscription(workspaceId: WorkspaceId): Promise<boolean>;
  createCheckoutUrl(
    workspaceId: WorkspaceId,
    plan: Exclude<Plan, "FREE">,
    interval: "monthly" | "yearly",
    returnUrl: string,
  ): Promise<string | undefined>;
  createPortalUrl(workspaceId: WorkspaceId, returnUrl: string): Promise<string | undefined>;
  /** Suppression de compte : résilie l'abonnement immédiatement et efface le client. */
  releaseWorkspace(workspaceId: WorkspaceId): Promise<void>;
}

/** Tout ce dont un cas d'usage peut avoir besoin, injecté par le composition root. */
export interface AppDependencies extends TransactionalRepositories {
  readonly clock: Clock;
  readonly ids: IdGenerator;
  readonly uow: UnitOfWork;
  readonly events: EventPublisher;
  readonly appraiser: Appraiser;
  readonly photos: PhotoStorage;
  readonly billing: BillingGateway;
}
