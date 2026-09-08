import {
  type FeeSchedule,
  type Platform,
  type UserId,
  Workspace,
  type WorkspaceId,
  type WorkspaceProps,
} from "@chine/domain";
import type { WorkspaceRepository } from "../ports/index.js";
import { InMemoryTable } from "./table.js";

export class InMemoryWorkspaceRepository
  extends InMemoryTable<WorkspaceId, WorkspaceProps>
  implements WorkspaceRepository
{
  #overrides = new Map<WorkspaceId, Partial<Record<Platform, FeeSchedule>>>();

  async byId(id: WorkspaceId): Promise<Workspace | undefined> {
    const p = this.rows.get(id);
    return p ? Workspace.rehydrate(p) : undefined;
  }
  async byOwner(ownerId: UserId): Promise<Workspace | undefined> {
    const p = this.values().find((w) => w.ownerId === ownerId);
    return p ? Workspace.rehydrate(p) : undefined;
  }
  async forUser(userId: UserId): Promise<readonly Workspace[]> {
    return this.values()
      .filter((w) => w.ownerId === userId)
      .map((p) => Workspace.rehydrate(p));
  }
  async save(ws: Workspace): Promise<void> {
    this.rows.set(ws.id, ws.toProps());
  }
  async feeOverrides(id: WorkspaceId): Promise<Partial<Record<Platform, FeeSchedule>>> {
    return { ...(this.#overrides.get(id) ?? {}) };
  }
  async saveFeeOverrides(
    id: WorkspaceId,
    overrides: Partial<Record<Platform, FeeSchedule>>,
  ): Promise<void> {
    this.#overrides.set(id, { ...overrides });
  }
}
