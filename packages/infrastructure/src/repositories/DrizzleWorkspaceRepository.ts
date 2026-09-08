import {
  asUserId,
  asWorkspaceId,
  type FeeSchedule,
  type MemberRole,
  type Plan,
  type Platform,
  type TargetMargin,
  type UserId,
  Workspace,
  type WorkspaceId,
  type WorkspaceProps,
} from "@chine/domain";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type WorkspaceRow, workspaceMembers, workspaces } from "../db/schema.js";
import type { WorkspaceRepository } from "../ports.js";

export function workspaceToDomain(row: WorkspaceRow): Workspace {
  const targetMargin: TargetMargin =
    row.targetMarginKind === "PERCENT"
      ? { kind: "PERCENT", value: row.targetMarginValue }
      : { kind: "AMOUNT_MINOR", value: row.targetMarginValue };
  const props: WorkspaceProps = {
    id: asWorkspaceId(row.id),
    ownerId: asUserId(row.ownerUserId),
    name: row.name,
    currency: row.currency,
    locale: row.locale,
    targetMargin,
    plan: row.plan,
    skuPrefix: row.skuPrefix,
    createdAt: row.createdAt,
  };
  return Workspace.rehydrate(props);
}

/** Colonnes pilotées par l'agrégat (les compteurs et champs Stripe sont gérés à part). */
function workspaceToRow(ws: Workspace) {
  const p = ws.toProps();
  return {
    ownerUserId: p.ownerId as string,
    name: p.name,
    currency: p.currency,
    locale: p.locale,
    targetMarginKind: p.targetMargin.kind,
    targetMarginValue: Math.round(p.targetMargin.value),
    plan: p.plan,
    skuPrefix: p.skuPrefix,
  };
}

export class DrizzleWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly db: DbExecutor) {}

  async byId(id: WorkspaceId): Promise<Workspace | undefined> {
    const row = await this.db.query.workspaces.findFirst({ where: eq(workspaces.id, id) });
    return row ? workspaceToDomain(row) : undefined;
  }

  async byOwner(ownerId: UserId): Promise<Workspace | undefined> {
    const row = await this.db.query.workspaces.findFirst({
      where: eq(workspaces.ownerUserId, ownerId),
      orderBy: [desc(workspaces.createdAt)],
    });
    return row ? workspaceToDomain(row) : undefined;
  }

  async forUser(userId: UserId): Promise<readonly Workspace[]> {
    const memberships = this.db
      .select({ id: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, userId));
    const rows = await this.db
      .select()
      .from(workspaces)
      .where(or(eq(workspaces.ownerUserId, userId), inArray(workspaces.id, memberships)))
      .orderBy(workspaces.createdAt);
    return rows.map(workspaceToDomain);
  }

  async save(ws: Workspace): Promise<void> {
    const p = ws.toProps();
    const values = workspaceToRow(ws);
    await this.db
      .insert(workspaces)
      .values({ id: p.id as string, createdAt: p.createdAt, ...values })
      .onConflictDoUpdate({ target: workspaces.id, set: { ...values, updatedAt: new Date() } });
    // Le propriétaire est toujours membre OWNER (idempotent).
    await this.db
      .insert(workspaceMembers)
      .values({ workspaceId: p.id as string, userId: p.ownerId as string, role: "OWNER" })
      .onConflictDoUpdate({
        target: [workspaceMembers.workspaceId, workspaceMembers.userId],
        set: { role: "OWNER" },
      });
  }

  async feeOverrides(id: WorkspaceId): Promise<Partial<Record<Platform, FeeSchedule>>> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { feeOverrides: true },
      where: eq(workspaces.id, id),
    });
    return (row?.feeOverrides ?? {}) as Partial<Record<Platform, FeeSchedule>>;
  }

  async saveFeeOverrides(
    id: WorkspaceId,
    overrides: Partial<Record<Platform, FeeSchedule>>,
  ): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ feeOverrides: { ...overrides }, updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }

  // ── Extensions hors port (membres, plan, objectif) ──────────────────────

  async addMember(id: WorkspaceId, userId: UserId, role: MemberRole): Promise<void> {
    await this.db
      .insert(workspaceMembers)
      .values({ workspaceId: id as string, userId: userId as string, role })
      .onConflictDoUpdate({
        target: [workspaceMembers.workspaceId, workspaceMembers.userId],
        set: { role },
      });
  }

  async removeMember(id: WorkspaceId, userId: UserId): Promise<void> {
    await this.db
      .delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)));
  }

  async members(id: WorkspaceId): Promise<ReadonlyArray<{ userId: UserId; role: MemberRole }>> {
    const rows = await this.db
      .select({ userId: workspaceMembers.userId, role: workspaceMembers.role })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, id));
    return rows.map((r) => ({ userId: asUserId(r.userId), role: r.role }));
  }

  /** Rôle d'un utilisateur dans un espace (`undefined` s'il n'y a pas accès). */
  async roleOf(id: WorkspaceId, userId: UserId): Promise<MemberRole | undefined> {
    const row = await this.db.query.workspaceMembers.findFirst({
      where: and(eq(workspaceMembers.workspaceId, id), eq(workspaceMembers.userId, userId)),
    });
    if (row) return row.role;
    const ws = await this.db.query.workspaces.findFirst({
      columns: { ownerUserId: true },
      where: eq(workspaces.id, id),
    });
    return ws?.ownerUserId === userId ? "OWNER" : undefined;
  }

  async setPlan(id: WorkspaceId, plan: Plan): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ plan, updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }

  async monthlyGoalMinor(id: WorkspaceId): Promise<number | undefined> {
    const row = await this.db.query.workspaces.findFirst({
      columns: { monthlyGoalMinor: true },
      where: eq(workspaces.id, id),
    });
    return row?.monthlyGoalMinor ?? undefined;
  }

  async saveMonthlyGoalMinor(id: WorkspaceId, minor: number | undefined): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ monthlyGoalMinor: minor ?? null, updatedAt: new Date() })
      .where(eq(workspaces.id, id));
  }
}
