import {
  type AggregateRoot,
  type DomainError,
  type DomainEvent,
  err,
  ok,
  type Result,
} from "@chine/domain";
import type { AppDependencies, TransactionalRepositories } from "../ports/index.js";

/** Collecte les événements des agrégats sauvegardés ; publiés seulement après commit. */
export class EventBuffer {
  #events: DomainEvent[] = [];
  collect(...aggregates: readonly AggregateRoot<string>[]): void {
    for (const a of aggregates) this.#events.push(...a.pullEvents());
  }
  drain(): readonly DomainEvent[] {
    const out = this.#events;
    this.#events = [];
    return out;
  }
}

/** Interrompt la transaction avec une erreur métier (rollback garanti par le `throw`). */
class Abort {
  constructor(readonly error: DomainError) {}
}

export type TxWork<T> = (
  repos: TransactionalRepositories,
  events: EventBuffer,
) => Promise<Result<T, DomainError>>;

/**
 * Exécute un bloc dans l'unité de travail : un `err` renvoyé annule la transaction,
 * un `ok` la valide puis publie les événements collectés.
 */
export async function transact<T>(
  deps: Pick<AppDependencies, "uow" | "events">,
  work: TxWork<T>,
): Promise<Result<T, DomainError>> {
  const buffer = new EventBuffer();
  try {
    const value = await deps.uow.run(async (repos) => {
      const r = await work(repos, buffer);
      if (!r.ok) throw new Abort(r.error);
      return r.value;
    });
    await deps.events.publish(buffer.drain());
    return ok(value);
  } catch (e) {
    if (e instanceof Abort) return err(e.error);
    throw e;
  }
}
