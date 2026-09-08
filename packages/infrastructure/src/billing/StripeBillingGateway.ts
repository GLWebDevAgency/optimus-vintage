/**
 * Facturation Stripe via l'API REST (`fetch`, sans SDK) : Checkout pour souscrire,
 * Customer Portal pour gérer, webhooks signés pour synchroniser `workspaces.plan`.
 */
import type { Plan, WorkspaceId } from "@chine/domain";
import { eq } from "drizzle-orm";
import * as auth from "../db/auth-schema.js";
import type { DbExecutor } from "../db/client.js";
import { workspaces } from "../db/schema.js";
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
  readonly baseUrl?: string | undefined;
  readonly fetch?: FetchLike | undefined;
  readonly logger?: Pick<Console, "warn" | "info"> | undefined;
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

/** Statuts d'abonnement qui donnent accès au plan payant. */
const ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (typeof v === "object" && v !== null ? (v as Json) : {});
const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);

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

export class StripeBillingGateway implements BillingGateway {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly logger: Pick<Console, "warn" | "info">;

  constructor(
    private readonly db: DbExecutor,
    private readonly options: StripeBillingGatewayOptions,
  ) {
    this.baseUrl = (options.baseUrl ?? "https://api.stripe.com/v1").replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    this.logger = options.logger ?? console;
  }

  // ── Port BillingGateway ─────────────────────────────────────────────────

  async currentPlan(workspaceId: WorkspaceId): Promise<Plan> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { plan: true },
      where: eq(workspaces.id, workspaceId),
    });
    return row?.plan ?? "FREE";
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
    const session = await this.post("/checkout/sessions", {
      mode: "subscription",
      customer,
      client_reference_id: ws.id,
      line_items: [{ price, quantity: 1 }],
      success_url: withParam(returnUrl, "checkout", "success"),
      cancel_url: withParam(returnUrl, "checkout", "cancel"),
      allow_promotion_codes: true,
      metadata: { workspace_id: ws.id, plan },
      subscription_data: { metadata: { workspace_id: ws.id, plan } },
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

  // ── Webhooks ────────────────────────────────────────────────────────────

  /**
   * Traite un webhook brut : vérifie la signature, puis synchronise le plan.
   * Renvoie ce qui a été fait pour journalisation ; lève `WebhookSignatureError` si invalide.
   */
  async handleWebhook(
    rawBody: string,
    signatureHeader: string | null | undefined,
  ): Promise<{ type: string; handled: boolean; workspaceId?: string; plan?: Plan }> {
    const secret = this.options.webhookSecret;
    if (!secret || !verifyStripeSignature(rawBody, signatureHeader, secret)) {
      throw new WebhookSignatureError();
    }
    const event = obj(JSON.parse(rawBody));
    const type = str(event["type"]) ?? "unknown";
    const object = obj(obj(event["data"])["object"]);

    switch (type) {
      case "checkout.session.completed":
        return { type, ...(await this.onCheckoutCompleted(object)) };
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        return { type, ...(await this.onSubscriptionChanged(object, type.endsWith("deleted"))) };
      default:
        return { type, handled: false };
    }
  }

  private async onCheckoutCompleted(session: Json) {
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
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));
    // La session ne porte pas le prix : on lit l'abonnement pour connaître le plan.
    if (subscriptionId) {
      const subscription = await this.get(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
      return this.onSubscriptionChanged(
        { ...subscription, metadata: { workspace_id: workspaceId } },
        false,
      );
    }
    const plan = this.planFromMetadata(session);
    if (plan) await this.setPlan(workspaceId, plan);
    return plan ? { handled: true, workspaceId, plan } : { handled: true, workspaceId };
  }

  private async onSubscriptionChanged(subscription: Json, deleted: boolean) {
    const customerId = str(subscription["customer"]) ?? str(obj(subscription["customer"])["id"]);
    const workspaceId =
      str(obj(subscription["metadata"])["workspace_id"]) ??
      (customerId ? await this.workspaceIdByCustomer(customerId) : undefined);
    if (!workspaceId) {
      this.logger.warn("[stripe] abonnement sans espace de travail associé", { customerId });
      return { handled: false };
    }
    const status = str(subscription["status"]) ?? "canceled";
    const active = !deleted && ACTIVE_STATUSES.has(status);
    const plan = active ? this.planFromSubscription(subscription) : "FREE";
    if (!plan) {
      this.logger.warn("[stripe] prix inconnu, plan inchangé", { workspaceId });
      return { handled: false, workspaceId };
    }
    await this.db
      .update(workspaces)
      .set({
        plan,
        stripeSubscriptionId: active ? (str(subscription["id"]) ?? null) : null,
        ...(customerId ? { stripeCustomerId: customerId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId));
    this.logger.info("[stripe] plan synchronisé", { workspaceId, plan, status });
    return { handled: true, workspaceId, plan };
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
      .set({ plan, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
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
      .set({ stripeCustomerId: id, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId));
    return id;
  }

  private async post(path: string, body: Json): Promise<Json> {
    return this.request("POST", path, encodeStripeForm(body));
  }

  private async get(path: string): Promise<Json> {
    return this.request("GET", path);
  }

  private async request(method: "GET" | "POST", path: string, body?: string): Promise<Json> {
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.options.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
        "stripe-version": "2025-08-27.basil",
      },
      ...(body !== undefined ? { body } : {}),
    });
    const json = obj(await response.json().catch(() => ({})));
    if (!response.ok) {
      const message = str(obj(json["error"])["message"]) ?? `Stripe : HTTP ${response.status}`;
      throw new StripeError(response.status, message, json["error"]);
    }
    return json;
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
