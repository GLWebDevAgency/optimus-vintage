import {
  type Appraisal,
  type AppraisalId,
  asAppraisalId,
  asItemId,
  asWorkspaceId,
  type Currency,
  type ItemId,
  isCurrency,
  type WorkspaceId,
} from "@chine/domain";
import { and, count, desc, eq, gte } from "drizzle-orm";
import { parseAppraisalBody, serializeAppraisalBody } from "../ai/appraisal-codec.js";
import type { DbExecutor } from "../db/client.js";
import { type AppraisalRow, appraisals } from "../db/schema.js";
import type { AppraisalRepository } from "../ports.js";
import { compact } from "./mapping.js";

/** La devise est celle de l'estimation médiane (stockée dans le payload). */
function payloadCurrency(payload: Record<string, unknown>): Currency {
  const price = payload["price"];
  if (typeof price === "object" && price !== null) {
    const mid = (price as Record<string, unknown>)["mid"];
    if (typeof mid === "object" && mid !== null) {
      const c = (mid as Record<string, unknown>)["currency"];
      if (typeof c === "string" && isCurrency(c)) return c;
    }
  }
  return "EUR";
}

export function appraisalToDomain(row: AppraisalRow): Appraisal {
  const body = parseAppraisalBody(row.payload, payloadCurrency(row.payload));
  return compact<Appraisal>({
    id: asAppraisalId(row.id),
    workspaceId: asWorkspaceId(row.workspaceId),
    itemId: row.itemId === null ? undefined : asItemId(row.itemId),
    provider: row.provider,
    model: row.model,
    createdAt: row.createdAt,
    latencyMs: row.latencyMs,
    ...body,
  });
}

export function appraisalToRow(a: Appraisal) {
  return {
    id: a.id as string,
    workspaceId: a.workspaceId as string,
    itemId: a.itemId === undefined ? null : (a.itemId as string),
    provider: a.provider,
    model: a.model,
    latencyMs: Math.max(0, Math.round(a.latencyMs)),
    payload: serializeAppraisalBody(a),
    createdAt: a.createdAt,
  };
}

export class DrizzleAppraisalRepository implements AppraisalRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(workspaceId: WorkspaceId, id: AppraisalId): Promise<Appraisal | undefined> {
    const row = await this.db.query.appraisals.findFirst({
      where: and(eq(appraisals.workspaceId, workspaceId), eq(appraisals.id, id)),
    });
    return row ? appraisalToDomain(row) : undefined;
  }

  async save(appraisal: Appraisal): Promise<void> {
    const { id, workspaceId, createdAt, ...rest } = appraisalToRow(appraisal);
    await this.db
      .insert(appraisals)
      .values({ id, workspaceId, createdAt, ...rest })
      .onConflictDoUpdate({ target: appraisals.id, set: rest });
  }

  async countSince(workspaceId: WorkspaceId, since: Date): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(appraisals)
      .where(and(eq(appraisals.workspaceId, workspaceId), gte(appraisals.createdAt, since)));
    return row?.n ?? 0;
  }

  async latestForItem(workspaceId: WorkspaceId, itemId: ItemId): Promise<Appraisal | undefined> {
    const row = await this.db.query.appraisals.findFirst({
      where: and(eq(appraisals.workspaceId, workspaceId), eq(appraisals.itemId, itemId)),
      orderBy: [desc(appraisals.createdAt)],
    });
    return row ? appraisalToDomain(row) : undefined;
  }

  /** Historique d'un espace, du plus récent au plus ancien. */
  async list(workspaceId: WorkspaceId, limit = 50): Promise<readonly Appraisal[]> {
    const rows = await this.db
      .select()
      .from(appraisals)
      .where(eq(appraisals.workspaceId, workspaceId))
      .orderBy(desc(appraisals.createdAt))
      .limit(Math.min(500, Math.max(1, limit)));
    return rows.map(appraisalToDomain);
  }
}
