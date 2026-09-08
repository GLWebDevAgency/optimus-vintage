/**
 * Relais d'outbox : lit les événements non publiés, les remet à un gestionnaire (analytics,
 * e-mails, webhooks…), puis marque chacun publié ou en échec (`attempts` incrémenté).
 * Un événement qui échoue est retenté au passage suivant, jusqu'à `maxAttempts`.
 */
import type { OutboxEventRow } from "../db/schema.js";
import type { OutboxEventPublisher } from "./OutboxEventPublisher.js";

export type OutboxHandler = (event: OutboxEventRow) => Promise<void>;

export interface OutboxRelayOptions {
  /** Au-delà, l'événement n'est plus proposé au relais (défaut 10). */
  readonly maxAttempts?: number | undefined;
  readonly logger?: Pick<Console, "warn"> | undefined;
  readonly now?: (() => Date) | undefined;
}

export interface RelayReport {
  readonly processed: number;
  readonly published: number;
  readonly failed: number;
  readonly failures: ReadonlyArray<{ id: string; type: string; error: string }>;
}

export class OutboxRelay {
  private readonly maxAttempts: number;
  private readonly logger: Pick<Console, "warn">;
  private readonly now: () => Date;

  constructor(
    private readonly outbox: OutboxEventPublisher,
    options: OutboxRelayOptions = {},
  ) {
    this.maxAttempts = options.maxAttempts ?? 10;
    this.logger = options.logger ?? console;
    this.now = options.now ?? (() => new Date());
  }

  /** Traite au plus `batch` événements, dans l'ordre d'occurrence. */
  async relayPending(handler: OutboxHandler, batch = 100): Promise<RelayReport> {
    const pending = await this.outbox.pending(batch, this.maxAttempts);
    let published = 0;
    const failures: Array<{ id: string; type: string; error: string }> = [];
    for (const event of pending) {
      try {
        await handler(event);
        await this.outbox.markPublished([event.id], this.now());
        published += 1;
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        failures.push({ id: event.id, type: event.type, error });
        this.logger.warn("[outbox] échec de relais", { id: event.id, type: event.type, error });
        await this.outbox.markFailed(event.id);
      }
    }
    return { processed: pending.length, published, failed: failures.length, failures };
  }

  /** Boucle jusqu'à épuisement (ou `maxBatches`), utile pour un cron. */
  async drain(handler: OutboxHandler, batch = 100, maxBatches = 50): Promise<RelayReport> {
    let processed = 0;
    let published = 0;
    const failures: Array<{ id: string; type: string; error: string }> = [];
    for (let i = 0; i < maxBatches; i++) {
      const report = await this.relayPending(handler, batch);
      processed += report.processed;
      published += report.published;
      failures.push(...report.failures);
      // Tout ce qui reste a échoué dans ce passage : on s'arrête pour ne pas boucler.
      if (report.processed < batch || report.published === 0) break;
    }
    return { processed, published, failed: failures.length, failures };
  }
}
