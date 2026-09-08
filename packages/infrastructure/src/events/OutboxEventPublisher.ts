/**
 * Publication des événements de domaine via une boîte d'envoi transactionnelle (outbox) :
 * les événements sont écrits en base dans la même transaction que l'agrégat, puis relayés
 * plus tard (analytics, e-mails, webhooks) par un relais qui marque `published_at`.
 */
import type { DomainEvent } from "@chine/domain";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import type { DbExecutor } from "../db/client.js";
import { type OutboxEventRow, outboxEvents } from "../db/schema.js";
import { UuidV7Generator } from "../ids.js";
import type { EventPublisher, IdGenerator } from "../ports.js";

/** Sérialise un événement : `Money.toJSON()` et `Date` → ISO, via JSON. */
export function eventPayload(event: DomainEvent): Record<string, unknown> {
  const { type: _type, workspaceId: _ws, occurredAt: _at, ...rest } = event;
  return JSON.parse(JSON.stringify(rest)) as Record<string, unknown>;
}

export class OutboxEventPublisher implements EventPublisher {
  constructor(
    private readonly db: DbExecutor,
    private readonly ids: IdGenerator = new UuidV7Generator(),
  ) {}

  async publish(events: readonly DomainEvent[]): Promise<void> {
    if (events.length === 0) return;
    await this.db.insert(outboxEvents).values(
      events.map((e) => ({
        id: this.ids.next(),
        workspaceId: e.workspaceId as string,
        type: e.type,
        payload: eventPayload(e),
        occurredAt: e.occurredAt,
      })),
    );
  }

  /** Événements non encore relayés (et sous `maxAttempts` échecs), du plus ancien au plus récent. */
  async pending(limit = 100, maxAttempts?: number): Promise<readonly OutboxEventRow[]> {
    const where =
      maxAttempts === undefined
        ? isNull(outboxEvents.publishedAt)
        : and(isNull(outboxEvents.publishedAt), lt(outboxEvents.attempts, maxAttempts));
    return this.db
      .select()
      .from(outboxEvents)
      .where(where)
      .orderBy(asc(outboxEvents.occurredAt), asc(outboxEvents.id))
      .limit(Math.min(1000, Math.max(1, limit)));
  }

  async markPublished(ids: readonly string[], at: Date = new Date()): Promise<void> {
    if (ids.length === 0) return;
    await this.db
      .update(outboxEvents)
      .set({ publishedAt: at, attempts: sql`${outboxEvents.attempts} + 1` })
      .where(inArray(outboxEvents.id, [...ids]));
  }

  async markFailed(id: string): Promise<void> {
    await this.db
      .update(outboxEvents)
      .set({ attempts: sql`${outboxEvents.attempts} + 1` })
      .where(eq(outboxEvents.id, id));
  }
}
