import type { WorkspaceId } from "@chine/domain";
import { eq, sql } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { workspaces } from "../db/schema.js";
import type { SkuSequence } from "../ports.js";

export class WorkspaceNotFound extends Error {
  override readonly name = "WorkspaceNotFound";
  constructor(readonly workspaceId: string) {
    super(`Espace de travail introuvable : ${workspaceId}`);
  }
}

/**
 * Compteur de SKU sûr en concurrence : un seul `UPDATE … RETURNING` atomique,
 * verrouillé ligne par ligne par Postgres. Pas de lecture-puis-écriture.
 */
export class DrizzleSkuSequence implements SkuSequence {
  constructor(private readonly db: DbExecutor) {}

  async next(workspaceId: WorkspaceId): Promise<number> {
    const [row] = await this.db
      .update(workspaces)
      .set({ skuCounter: sql`${workspaces.skuCounter} + 1` })
      .where(eq(workspaces.id, workspaceId))
      .returning({ counter: workspaces.skuCounter });
    if (!row) throw new WorkspaceNotFound(workspaceId);
    return row.counter;
  }

  /** Aligne le compteur sur une valeur au moins égale à `minimum` (import, réparation). */
  async ensureAtLeast(workspaceId: WorkspaceId, minimum: number): Promise<void> {
    await this.db
      .update(workspaces)
      .set({ skuCounter: sql`greatest(${workspaces.skuCounter}, ${Math.trunc(minimum)})` })
      .where(eq(workspaces.id, workspaceId));
  }
}
