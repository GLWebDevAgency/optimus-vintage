/**
 * Facturation Stripe via l'API REST (`fetch`, sans SDK) : Checkout pour souscrire (essai sans carte),
 * Customer Portal pour gérer, webhooks signés, idempotents et ordonnés pour synchroniser
 * `workspaces.plan` et l'état d'abonnement.
 */
import { PLAN_TRIAL_DAYS, type Plan, type WorkspaceId } from "@chine/domain";
import { eq, lt } from "drizzle-orm";
import * as auth from "../db/auth-schema.js";
import type { DbExecutor } from "../db/client.js";
import { stripeEvents, type WorkspaceRow, workspaces } from "../db/schema.js";
import type { BillingGateway } from "../ports.js";
import { verifyStripeSignature } from "./stripe-signature.js";

export type PaidPlan = Exclude<Plan, "FREE">;
export type BillingInterval = "monthly" | "yearly";
export type PriceMap = Partial<Record<PaidPlan, Partial<Record<BillingInterval, string>>>>;

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface StripeBillingGatewayOptions {
  readonly secretKey: string;
  readonly webhookSecret?: string | undefined;
  /** Identifiants de prix Stripe par plan et périodicité. */
  readonly prices: PriceMap;
  /** Stripe Tax activé sur le compte : TVA calculée et adresse collectée au Checkout. */
  readonly automaticTax?: boolean | undefined;
  /** Jours d'essai sans carte (0 = pas d'essai). Un seul essai par espace. */
  readonly trialDays?: number | undefined;
  readonly baseUrl?: string | undefined;
  readonly fetch?: FetchLike | undefined;
  readonly logger?: Pick<Console, "warn" | "info"> | undefined;
  readonly timeoutMs?: number | undefined;
  readonly idempotencyKey?: (() => string) | undefined;
  readonly now?: (() => Date) | undefined;
}

export class StripeError extends Error {
  override readonly name = "StripeError";
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export class WebhookSignatureError extends Error {
  override readonly name = "WebhookSignatureError";
  constructor() {
    super("Signature de webhook Stripe invalide");
  }
}

/** Statuts d'abonnement qui donnent accès au plan payant (impayé = délai de grâce Stripe). */
export const ACTIVE_STATUSES: ReadonlySet<string> = new Set(["active", "trialing", "past_due"]);

export interface WebhookOutcome {
  readonly type: string;
  readonly handled: boolean;
  /** Événement déjà traité (Stripe rejoue) ou plus ancien que l'état connu. */
  readonly skipped?: "duplicate" | "stale" | "other-subscription" | undefined;
  readonly workspaceId?: string | undefined;
  readonly plan?: Plan | undefined;
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (typeof v === "object" && v !== null ? (v as Json) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined);
const epoch = (v: unknown): Date | null => {
  const n = num(v);
  return n === undefined ? null : new Date(n * 1000);
};

/** Encode un objet (imbriqué) au format `application/x-www-form-urlencoded` de Stripe. */
export function encodeStripeForm(input: Json, prefix = ""): string {
  const parts: string[] = [];
  const walk = (value: unknown, key: string): void => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        walk(v, `${key}[${i}]`);
      });
    } else if (typeof value === "object") {
      for (const [k, v] of Object.entries(value as Json)) walk(v, key ? `${key}[${k}]` : k);
    } else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  walk(input, prefix);
  return parts.join("&");
}

/** État d'abonnement dérivé d'un objet `subscription` Stripe. */
interface SubscriptionState {
  readonly id: string | undefined;
  readonly status: string;
  readonly active: boolean;
  readonly plan: Plan | undefined;
  readonly interval: BillingInterval | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEndsAt: Date | null;
}

export class StripeBillingGateway implements BillingGateway {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly logger: Pick<Console, "warn" | "info">;
  private readonly trialDays: number;
  private readonly now: () => Date;

  constructor(
    private readonly db: DbExecutor,
    private readonly options: StripeBillingGatewayOptions,
  ) {
    this.baseUrl = (options.baseUrl ?? "https://api.stripe.com/v1").replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.logger = options.logger ?? console;
    this.trialDays = options.trialDays ?? PLAN_TRIAL_DAYS;
    this.now = options.now ?? (() => new Date());
  }

  // ── Port BillingGateway ─────────────────────────────────────────────────

  async currentPlan(workspaceId: WorkspaceId): Promise<Plan> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { plan: true },
      where: eq(workspaces.id, workspaceId),
    });
    return row?.plan ?? "FREE";
  }

  async hasActiveSubscription(workspaceId: WorkspaceId): Promise<boolean> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { plan: true, stripeSubscriptionId: true, subscriptionStatus: true },
      where: eq(workspaces.id, workspaceId),
    });
    if (!row?.stripeSubscriptionId) return false;
    return row.subscriptionStatus
      ? ACTIVE_STATUSES.has(row.subscriptionStatus)
      : row.plan !== "FREE";
  }

  async createCheckoutUrl(
    workspaceId: WorkspaceId,
    plan: PaidPlan,
    interval: BillingInterval,
    returnUrl: string,
  ): Promise<string | undefined> {
    const price = this.options.prices[plan]?.[interval];
    if (!price) return undefined;
    const ws = await this.db.query.workspaces.findFirst({ where: eq(workspaces.id, workspaceId) });
    if (!ws) return undefined;
    const customer = await this.ensureCustomer(ws.id, ws.ownerUserId, ws.stripeCustomerId);
    const trial = this.trialDays > 0 && !ws.trialUsedAt;
    const session = await this.post("/checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: ws.id,
      line_items: [{ price, quantity: 1 }],
      success_url: withParam(returnUrl, "checkout", "success"),
      cancel_url: withParam(returnUrl, "checkout", "cancel"),
      allow_promotion_codes: true,
      locale: "auto",
      metadata: { workspace_id: ws.id, plan },
      subscription_data: {
        metadata: { workspace_id: ws.id, plan },
        ...(trial
          ? {
              trial_period_days: this.trialDays,
              trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
            }
          : {}),
      },
      // Essai sans carte : Stripe la demandera à la fin de l'essai (sinon résiliation propre).
      ...(trial ? { payment_method_collection: "if_required" } : {}),
      ...(this.options.automaticTax
        ? {
            automatic_tax: { enabled: true },
            billing_address_collection: "auto",
            tax_id_collection: { enabled: true },
            customer_update: { address: "auto", name: "auto" },
          }
        : {}),
    });
    return str(session["url"]);
  }

  async createPortalUrl(workspaceId: WorkspaceId, returnUrl: string): Promise<string | undefined> {
    const ws = await this.db.query.workspaces.findFirst({
      columns: { stripeCustomerId: true },
      where: eq(workspaces.id, workspaceId),
    });
    if (!ws?.stripeCustomerId) return undefined;
    const session = await this.post("/billing_portal/sessions", {
      customer: ws.stripeCustomerId,
      return_url: returnUrl,
    });
    return str(session["url"]);
  }

  /**
   * Suppression de compte : résiliation immédiate de l'abonnement puis effacement du client Stripe
   * (RGPD). Une ressource déjà absente côté Stripe (404) n'est pas une erreur.
   */
  async releaseWorkspace(workspaceId: WorkspaceId): Promise<void> {
    const ws = await this.db.query.workspaces.findFirst({
      columns: { stripeCustomerId: true, stripeSubscriptionId: true },
      where: eq(workspaces.id, workspaceId),
    });
    if (!ws) return;
    if (ws.stripeSubscriptionId) {
      await this.delete(`/subscriptions/${encodeURIComponent(ws.stripeSubscriptionId)}`);
    }
    if (ws.stripeCustomerId) {
      await this.delete(`/customers/${encodeURIComponent(ws.stripeCustomerId)}`);
    }
    await this.db
      .update(workspaces)
      .set({
        plan: "FREE",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionInterval: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        trialEndsAt: null,
        updatedAt: this.now(),
      })
      .where(eq(workspaces.id, workspaceId));
    this.logger.info("[stripe] abonnement résilié et client effacé", { workspaceId });
  }

  // ── Webhooks ────────────────────────────────────────────────────────────

  /**
   * Traite un webhook brut : vérifie la signature, écarte les rejeux (`stripe_events`) et les
   * événements plus anciens que l'état connu, puis synchronise le plan et l'abonnement.
   * Lève `WebhookSignatureError` si la signature est invalide.
   */
  async handleWebhook(
    rawBody: string,
    signatureHeader: string | null | undefined,
  ): Promise<WebhookOutcome> {
    const secret = this.options.webhookSecret;
    if (!secret || !verifyStripeSignature(rawBody, signatureHeader, secret)) {
      throw new WebhookSignatureError();
    }
    const event = obj(JSON.parse(rawBody));
    const type = str(event["type"]) ?? "unknown";
    const eventId = str(event["id"]);
    const createdAt = epoch(event["created"]);
    const object = obj(obj(event["data"])["object"]);

    if (eventId) {
      const inserted = await this.db
        .insert(stripeEvents)
        .values({ id: eventId, type, createdAt: createdAt ?? this.now() })
        .onConflictDoNothing()
        .returning({ id: stripeEvents.id });
      if (inserted.length === 0) return { type, handled: false, skipped: "duplicate" };
    }

    switch (type) {
      case "checkout.session.completed":
        return { type, ...(await this.onCheckoutCompleted(object, createdAt)) };
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return {
          type,
          ...(await this.onSubscriptionChanged(object, type.endsWith("deleted"), createdAt)),
        };
      case "invoice.payment_failed":
        return { type, ...(await this.onPaymentFailed(object)) };
      default:
        return { type, handled: false };
    }
  }

  private async onCheckoutCompleted(session: Json, createdAt: Date | null) {
    const workspaceId =
      str(obj(session["metadata"])["workspace_id"]) ?? str(session["client_reference_id"]);
    if (!workspaceId) return { handled: false };
    const customerId = str(session["customer"]) ?? str(obj(session["customer"])["id"]);
    const subscriptionId = str(session["subscription"]) ?? str(obj(session["subscription"])["id"]);
    await this.db
      .update(workspaces)
      .set({
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
        updatedAt: this.now(),
      })
      .where(eq(workspaces.id, workspaceId));
    // La session ne porte pas le prix : on lit l'abonnement pour connaître le plan et l'état.
    if (subscriptionId) {
      const subscription = await this.get(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      return this.onSubscriptionChanged(
        { ...subscription, metadata: { workspace_id: workspaceId } },
        false,
        createdAt,
      );
    }
    const plan = this.planFromMetadata(session);
    if (plan) await this.setPlan(workspaceId, plan);
    return plan ? { handled: true, workspaceId, plan } : { handled: true, workspaceId };
  }

  private async onSubscriptionChanged(
    subscription: Json,
    deleted: boolean,
    createdAt: Date | null,
  ) {
    const customerId = str(subscription["customer"]) ?? str(obj(subscription["customer"])["id"]);
    const ws = await this.workspaceFor(subscription, customerId);
    if (!ws) {
      this.logger.warn("[stripe] abonnement sans espace de travail associé", { customerId });
      return { handled: false };
    }
    const state = this.subscriptionState(subscription, deleted);

    // Ordre : un événement plus ancien que le dernier appliqué ne doit pas revenir en arrière.
    if (createdAt && ws.billingSyncedAt && createdAt.getTime() < ws.billingSyncedAt.getTime()) {
      return { handled: false, skipped: "stale" as const, workspaceId: ws.id };
    }
    // Identité : la fin d'un ancien abonnement n'annule pas le nouveau (remplacement, réabonnement).
    if (
      ws.stripeSubscriptionId &&
      state.id &&
      state.id !== ws.stripeSubscriptionId &&
      !state.active &&
      ws.subscriptionStatus &&
      ACTIVE_STATUSES.has(ws.subscriptionStatus)
    ) {
      return { handled: false, skipped: "other-subscription" as const, workspaceId: ws.id };
    }

    const plan = state.active ? state.plan : "FREE";
    if (!plan) {
      // Prix inconnu : on garde l'accès (le client paie) et on alerte fort plutôt que de rétrograder.
      this.logger.warn("[stripe] prix inconnu : plan inchangé, vérifier STRIPE_PRICE_*", {
        workspaceId: ws.id,
        subscriptionId: state.id,
      });
      return { handled: false, workspaceId: ws.id };
    }
    await this.db
      .update(workspaces)
      .set({
        plan,
        stripeSubscriptionId: state.active ? (state.id ?? null) : null,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        subscriptionStatus: deleted ? "canceled" : state.status,
        subscriptionInterval: state.active ? state.interval : null,
        currentPeriodEnd: state.active ? state.currentPeriodEnd : null,
        cancelAtPeriodEnd: state.active ? state.cancelAtPeriodEnd : false,
        trialEndsAt: state.active ? state.trialEndsAt : null,
        ...(state.status === "trialing" && !ws.trialUsedAt ? { trialUsedAt: this.now() } : {}),
        ...(createdAt ? { billingSyncedAt: createdAt } : {}),
        updatedAt: this.now(),
      })
      .where(eq(workspaces.id, ws.id));
    this.logger.info("[stripe] plan synchronisé", {
      workspaceId: ws.id,
      plan,
      status: state.status,
    });
    return { handled: true, workspaceId: ws.id, plan };
  }

  /** Impayé : Stripe relance (dunning) ; l'accès reste ouvert pendant la grâce, l'état est visible. */
  private async onPaymentFailed(invoice: Json) {
    const customerId = str(invoice["customer"]) ?? str(obj(invoice["customer"])["id"]);
    const workspaceId = customerId ? await this.workspaceIdByCustomer(customerId) : undefined;
    if (!workspaceId) return { handled: false };
    await this.db
      .update(workspaces)
      .set({ subscriptionStatus: "past_due", updatedAt: this.now() })
      .where(eq(workspaces.id, workspaceId));
    this.logger.warn("[stripe] paiement échoué", { workspaceId });
    return { handled: true, workspaceId };
  }

  /** Purge des événements traités (idempotence) plus anciens que `olderThan`. */
  async purgeEvents(olderThan: Date): Promise<number> {
    const rows = await this.db
      .delete(stripeEvents)
      .where(lt(stripeEvents.processedAt, olderThan))
      .returning({ id: stripeEvents.id });
    return rows.length;
  }

  // ── Aides ───────────────────────────────────────────────────────────────

  /** Plan correspondant à un identifiant de prix Stripe. */
  planForPrice(priceId: string): Plan | undefined {
    for (const [plan, intervals] of Object.entries(this.options.prices) as [
      PaidPlan,
      PriceMap[PaidPlan],
    ][]) {
      if (intervals && Object.values(intervals).includes(priceId)) return plan;
    }
    return undefined;
  }

  private subscriptionState(subscription: Json, deleted: boolean): SubscriptionState {
    const status = deleted ? "canceled" : (str(subscription["status"]) ?? "canceled");
    const active = !deleted && ACTIVE_STATUSES.has(status);
    const items = obj(subscription["items"])["data"];
    const first = Array.isArray(items) ? obj(items[0]) : {};
    const recurring = str(obj(obj(first["price"])["recurring"])["interval"]);
    const interval: BillingInterval | null =
      recurring === "year" ? "yearly" : recurring === "month" ? "monthly" : null;
    return {
      id: str(subscription["id"]),
      status,
      active,
      plan: this.planFromSubscription(subscription),
      interval,
      // Selon la version d'API, la fin de période est sur l'abonnement ou sur son premier article.
      currentPeriodEnd:
        epoch(subscription["current_period_end"]) ?? epoch(first["current_period_end"]),
      cancelAtPeriodEnd: subscription["cancel_at_period_end"] === true,
      trialEndsAt: epoch(subscription["trial_end"]),
    };
  }

  private planFromSubscription(subscription: Json): Plan | undefined {
    const items = obj(subscription["items"])["data"];
    if (Array.isArray(items)) {
      for (const item of items) {
        const priceId = str(obj(obj(item)["price"])["id"]) ?? str(obj(item)["price"]);
        const plan = priceId ? this.planForPrice(priceId) : undefined;
        if (plan) return plan;
      }
    }
    return this.planFromMetadata(subscription);
  }

  private planFromMetadata(o: Json): Plan | undefined {
    const plan = str(obj(o["metadata"])["plan"]);
    return plan === "PREMIUM" || plan === "PRO" || plan === "BUSINESS" ? plan : undefined;
  }

  private async setPlan(workspaceId: string, plan: Plan): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ plan, updatedAt: this.now() })
      .where(eq(workspaces.id, workspaceId));
  }

  private async workspaceFor(
    subscription: Json,
    customerId: string | undefined,
  ): Promise<WorkspaceRow | undefined> {
    const byMetadata = str(obj(subscription["metadata"])["workspace_id"]);
    if (byMetadata) {
      const row = await this.db.query.workspaces.findFirst({
        where: eq(workspaces.id, byMetadata),
      });
      if (row) return row;
    }
    if (!customerId) return undefined;
    return this.db.query.workspaces.findFirst({
      where: eq(workspaces.stripeCustomerId, customerId),
    });
  }

  private async workspaceIdByCustomer(customerId: string): Promise<string | undefined> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { id: true },
      where: eq(workspaces.stripeCustomerId, customerId),
    });
    return row?.id;
  }

  /** Crée le client Stripe au premier passage (e-mail lu dans la table `user` de Better Auth). */
  private async ensureCustomer(
    workspaceId: string,
    ownerUserId: string,
    existing: string | null,
  ): Promise<string> {
    if (existing) return existing;
    const owner = await this.db.query.user.findFirst({
      columns: { email: true, name: true },
      where: eq(auth.user.id, ownerUserId),
    });
    const customer = await this.post("/customers", {
      ...(owner?.email ? { email: owner.email } : {}),
      ...(owner?.name ? { name: owner.name } : {}),
      metadata: { workspace_id: workspaceId },
    });
    const id = str(customer["id"]);
    if (!id) throw new StripeError(500, "Stripe : client créé sans identifiant");
    await this.db
      .update(workspaces)
      .set({ stripeCustomerId: id, updatedAt: this.now() })
      .where(eq(workspaces.id, workspaceId));
    return id;
  }

  private newIdempotencyKey(): string {
    return this.options.idempotencyKey ? this.options.idempotencyKey() : crypto.randomUUID();
  }

  private async post(path: string, body: Json): Promise<Json> {
    return this.request("POST", path, encodeStripeForm(body));
  }

  private async get(path: string): Promise<Json> {
    return this.request("GET", path);
  }

  /** DELETE tolérant : une ressource déjà supprimée (404) est un succès. */
  private async delete(path: string): Promise<void> {
    try {
      await this.request("DELETE", path);
    } catch (e) {
      if (e instanceof StripeError && e.status === 404) return;
      throw e;
    }
  }

  private async request(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: string,
  ): Promise<Json> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15_000);
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${this.options.secretKey}`,
          "content-type": "application/x-www-form-urlencoded",
          "stripe-version": "2025-08-27.basil",
          // Une clé par appel : un `fetch` rejoué (délai, coupure) ne crée jamais deux ressources.
          ...(method === "POST" ? { "idempotency-key": this.newIdempotencyKey() } : {}),
        },
        signal: controller.signal,
        ...(body !== undefined ? { body } : {}),
      });
      const json = obj(await response.json().catch(() => ({})));
      if (!response.ok) {
        const message = str(obj(json["error"])["message"]) ?? `Stripe : HTTP ${response.status}`;
        throw new StripeError(response.status, message, json["error"]);
      }
      return json;
    } finally {
      clearTimeout(timer);
    }
  }
}

function withParam(url: string, key: string, value: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set(key, value);
    return u.toString();
  } catch {
    return `${url}${url.includes("?") ? "&" : "?"}${key}=${value}`;
  }
}
