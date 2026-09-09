import type { ItemStatus, Platform, WorkspaceId } from "@chine/domain";
import { items, sales, workspaces } from "@chine/infrastructure";
import { and, count, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { Container } from "@/lib/container";

/**
 * Lectures que les ports applicatifs n'exposent pas encore (préférences d'espace, comptages
 * paginés, résumés de pièces). Toutes sont scopées par `workspace_id` : rien ne sort d'un espace.
 */
type Db = Container["database"]["db"];

/* ───────────── Préférences d'espace ───────────── */

export interface WorkspacePreferences {
  readonly dormantThresholdDays: number;
  readonly monthlyGoalMinor: number | null;
}

export async function readWorkspacePreferences(
  db: Db,
  workspaceId: WorkspaceId,
): Promise<WorkspacePreferences> {
  const row = await db.query.workspaces.findFirst({
    columns: { dormantThresholdDays: true, monthlyGoalMinor: true },
    where: eq(workspaces.id, workspaceId),
  });
  return {
    dormantThresholdDays: row?.dormantThresholdDays ?? 30,
    monthlyGoalMinor: row?.monthlyGoalMinor ?? null,
  };
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "none";
export interface WorkspaceBilling {
  readonly status: SubscriptionStatus;
  readonly interval: "monthly" | "yearly" | null;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEndsAt: Date | null;
  readonly hasCustomer: boolean;
}

const normaliseStatus = (raw: string | null, hasSubscription: boolean): SubscriptionStatus => {
  if (raw === "trialing" || raw === "active" || raw === "past_due") return raw;
  if (raw === "canceled" || raw === "unpaid" || raw === "incomplete_expired") return "canceled";
  return hasSubscription ? "active" : "none";
};

/** État d'abonnement tenu à jour par les webhooks Stripe (colonnes hors agrégat). */
export async function readWorkspaceBilling(
  db: Db,
  workspaceId: WorkspaceId,
): Promise<WorkspaceBilling> {
  const row = await db.query.workspaces.findFirst({
    columns: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      subscriptionStatus: true,
      subscriptionInterval: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      trialEndsAt: true,
    },
    where: eq(workspaces.id, workspaceId),
  });
  const interval = row?.subscriptionInterval;
  return {
    status: normaliseStatus(row?.subscriptionStatus ?? null, Boolean(row?.stripeSubscriptionId)),
    interval: interval === "monthly" || interval === "yearly" ? interval : null,
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: row?.cancelAtPeriodEnd ?? false,
    trialEndsAt: row?.trialEndsAt ?? null,
    hasCustomer: Boolean(row?.stripeCustomerId),
  };
}

export async function saveWorkspacePreferences(
  db: Db,
  workspaceId: WorkspaceId,
  patch: Partial<WorkspacePreferences>,
): Promise<void> {
  const set: Partial<{ dormantThresholdDays: number; monthlyGoalMinor: number | null }> = {};
  if (patch.dormantThresholdDays !== undefined)
    set.dormantThresholdDays = patch.dormantThresholdDays;
  if (patch.monthlyGoalMinor !== undefined) set.monthlyGoalMinor = patch.monthlyGoalMinor;
  if (Object.keys(set).length === 0) return;
  await db
    .update(workspaces)
    .set({ ...set, updatedAt: new Date() })
    .where(eq(workspaces.id, workspaceId));
}

/* ───────────── Résumés de pièces (listes de ventes, tableau de bord) ───────────── */

export interface ItemSummaryRow {
  readonly id: string;
  readonly sku: string;
  readonly title: string;
  readonly brand: string | null;
  readonly status: ItemStatus;
  readonly coverKey: string | null;
}

export async function itemSummariesByIds(
  db: Db,
  workspaceId: WorkspaceId,
  ids: readonly string[],
): Promise<Map<string, ItemSummaryRow>> {
  const out = new Map<string, ItemSummaryRow>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) return out;
  const rows = await db
    .select({
      id: items.id,
      sku: items.sku,
      title: items.title,
      brand: items.brand,
      status: items.status,
      photos: items.photos,
    })
    .from(items)
    .where(and(eq(items.workspaceId, workspaceId), inArray(items.id, unique)));
  for (const r of rows) {
    out.set(r.id, {
      id: r.id,
      sku: r.sku,
      title: r.title,
      brand: r.brand,
      status: r.status,
      coverKey: r.photos[0]?.key ?? null,
    });
  }
  return out;
}

/* ───────────── Comptages ───────────── */

/** Nombre de pièces par source, pour les sources demandées. */
export async function itemCountsBySource(
  db: Db,
  workspaceId: WorkspaceId,
  sourceIds: readonly string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (sourceIds.length === 0) return out;
  const rows = await db
    .select({ sourceId: items.sourceId, n: count() })
    .from(items)
    .where(and(eq(items.workspaceId, workspaceId), inArray(items.sourceId, [...sourceIds])))
    .groupBy(items.sourceId);
  for (const r of rows) out.set(r.sourceId, r.n);
  return out;
}

export interface SaleCountFilter {
  readonly from?: string;
  readonly to?: string;
  readonly platform?: Platform;
  readonly sourceId?: string;
  readonly itemId?: string;
}

/** Total des ventes correspondant au filtre (même sémantique que `SaleRepository.list`). */
export async function countSales(
  db: Db,
  workspaceId: WorkspaceId,
  filter: SaleCountFilter,
): Promise<number> {
  const conditions = [eq(sales.workspaceId, workspaceId)];
  if (filter.from) conditions.push(gte(sales.soldAt, filter.from));
  if (filter.to) conditions.push(lte(sales.soldAt, filter.to));
  if (filter.platform) conditions.push(eq(sales.platform, filter.platform));
  if (filter.sourceId) conditions.push(eq(sales.sourceId, filter.sourceId));
  if (filter.itemId) conditions.push(eq(sales.itemId, filter.itemId));
  const [row] = await db
    .select({ n: count() })
    .from(sales)
    .where(and(...conditions));
  return row?.n ?? 0;
}

/* ───────────── Santé ───────────── */

/** `SELECT 1` borné dans le temps : `latencyMs`, ou une erreur si la base ne répond pas. */
export async function pingDatabase(db: Db, timeoutMs: number): Promise<number> {
  const startedAt = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`La base n'a pas répondu en ${timeoutMs} ms`)),
      timeoutMs,
    );
  });
  try {
    await Promise.race([db.execute(sql`select 1`), timeout]);
    return Math.round(performance.now() - startedAt);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
