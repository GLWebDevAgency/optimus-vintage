/**
 * Clés d'idempotence des mutations : la file hors ligne rejoue une requête dont la réponse s'est
 * perdue ; le serveur doit renvoyer la même réponse sans refaire l'écriture.
 * Une ligne par (espace, clé) : insérée avant le traitement (réservation), complétée après.
 */
import { and, eq, lt } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { idempotencyKeys } from "../db/schema.js";

export type IdempotencyBegin =
  | { readonly state: "new" }
  | { readonly state: "in-flight" }
  | { readonly state: "replay"; readonly status: number; readonly body: unknown };

export interface IdempotencyStore {
  /** Réserve la clé ; `replay` renvoie la réponse mémorisée, `in-flight` signale un doublon simultané. */
  begin(workspaceId: string, key: string, method: string, path: string): Promise<IdempotencyBegin>;
  /** Mémorise la réponse (statut + corps JSON) de la requête d'origine. */
  complete(workspaceId: string, key: string, status: number, body: unknown): Promise<void>;
  /** Libère la clé si la requête d'origine a échoué (5xx) : un rejeu pourra réessayer. */
  abandon(workspaceId: string, key: string): Promise<void>;
  /** Supprime les clés plus anciennes que `olderThan` ; renvoie le nombre de lignes effacées. */
  purge(olderThan: Date): Promise<number>;
}

/** Format attendu d'une clé : UUID (généré côté client par la file hors ligne). */
export const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class DrizzleIdempotencyStore implements IdempotencyStore {
  constructor(
    private readonly db: DbExecutor,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async begin(
    workspaceId: string,
    key: string,
    method: string,
    path: string,
  ): Promise<IdempotencyBegin> {
    const inserted = await this.db
      .insert(idempotencyKeys)
      .values({ workspaceId, key, method, path, createdAt: this.now() })
      .onConflictDoNothing()
      .returning({ key: idempotencyKeys.key });
    if (inserted.length > 0) return { state: "new" };
    const row = await this.db.query.idempotencyKeys.findFirst({
      where: and(eq(idempotencyKeys.workspaceId, workspaceId), eq(idempotencyKeys.key, key)),
    });
    if (!row || row.status === null) return { state: "in-flight" };
    return { state: "replay", status: row.status, body: row.body };
  }

  async complete(workspaceId: string, key: string, status: number, body: unknown): Promise<void> {
    await this.db
      .update(idempotencyKeys)
      .set({ status, body })
      .where(and(eq(idempotencyKeys.workspaceId, workspaceId), eq(idempotencyKeys.key, key)));
  }

  async abandon(workspaceId: string, key: string): Promise<void> {
    await this.db
      .delete(idempotencyKeys)
      .where(and(eq(idempotencyKeys.workspaceId, workspaceId), eq(idempotencyKeys.key, key)));
  }

  async purge(olderThan: Date): Promise<number> {
    const rows = await this.db
      .delete(idempotencyKeys)
      .where(lt(idempotencyKeys.createdAt, olderThan))
      .returning({ key: idempotencyKeys.key });
    return rows.length;
  }
}
