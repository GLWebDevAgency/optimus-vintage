/**
 * Limiteur de débit persistant (fenêtre fixe) : indispensable en serverless, où la mémoire
 * d'un processus ne survit pas d'une requête à l'autre. Une seule requête atomique par appel.
 */
import { lt, sql } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { rateLimits } from "../db/schema.js";

export interface RateLimitDecision {
  readonly allowed: boolean;
  /** Appels restants dans la fenêtre courante (0 si refusé). */
  readonly remaining: number;
  /** Fin de la fenêtre courante. */
  readonly resetAt: Date;
}

export interface RateLimiter {
  /** Enregistre un appel pour `key` et dit s'il est autorisé (`limit` appels par `windowSeconds`). */
  hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitDecision>;
}

export interface DrizzleRateLimiterOptions {
  /** Horloge injectable (tests). */
  readonly now?: (() => Date) | undefined;
}

export class DrizzleRateLimiter implements RateLimiter {
  private readonly now: () => Date;

  constructor(
    private readonly db: DbExecutor,
    options: DrizzleRateLimiterOptions = {},
  ) {
    this.now = options.now ?? (() => new Date());
  }

  async hit(key: string, limit: number, windowSeconds: number): Promise<RateLimitDecision> {
    if (!Number.isInteger(limit) || limit < 0)
      throw new RangeError("limit doit être un entier ≥ 0");
    if (!Number.isFinite(windowSeconds) || windowSeconds <= 0) {
      throw new RangeError("windowSeconds doit être > 0");
    }
    const now = this.now();
    const windowMs = Math.round(windowSeconds * 1000);
    // Une fenêtre commencée avant ce seuil est expirée : on la remet à zéro dans le même UPDATE.
    const expiredBefore = new Date(now.getTime() - windowMs);
    const nowSql = sql`${now.toISOString()}::timestamptz`;
    const expiredSql = sql`${expiredBefore.toISOString()}::timestamptz`;
    const isExpired = sql`${rateLimits.windowStart} <= ${expiredSql}`;

    const [row] = await this.db
      .insert(rateLimits)
      .values({ key, windowStart: now, count: 1 })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: {
          windowStart: sql`case when ${isExpired} then ${nowSql} else ${rateLimits.windowStart} end`,
          count: sql`case when ${isExpired} then 1 else ${rateLimits.count} + 1 end`,
        },
      })
      .returning({ windowStart: rateLimits.windowStart, count: rateLimits.count });
    if (!row) throw new Error("rate_limits : aucune ligne renvoyée");

    return {
      allowed: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      resetAt: new Date(row.windowStart.getTime() + windowMs),
    };
  }

  /**
   * Supprime les fenêtres commencées il y a plus de `maxWindowSeconds` (défaut 24 h) :
   * à appeler périodiquement (cron) pour garder la table petite. Renvoie le nombre de lignes.
   */
  async purgeExpired(maxWindowSeconds = 86_400): Promise<number> {
    const threshold = new Date(this.now().getTime() - Math.round(maxWindowSeconds * 1000));
    const deleted = await this.db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, threshold))
      .returning({ key: rateLimits.key });
    return deleted.length;
  }
}

/** Clé de limitation normalisée : `scope:identité` (ex. `login:ip:1.2.3.4`). */
export const rateLimitKey = (...parts: readonly string[]): string =>
  parts
    .map((p) =>
      p
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9:._@-]/g, "_"),
    )
    .join(":");
