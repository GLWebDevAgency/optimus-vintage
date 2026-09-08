import type { DomainEvent } from "../events/events.js";

/** Racine d'agrégat : porte ses événements jusqu'à ce que l'application les publie. */
export abstract class AggregateRoot<Id extends string> {
  #events: DomainEvent[] = [];
  protected constructor(readonly id: Id) {}

  protected record(event: DomainEvent): void {
    this.#events.push(event);
  }

  /** Retire et renvoie les événements enregistrés depuis la dernière collecte. */
  pullEvents(): readonly DomainEvent[] {
    const out = this.#events;
    this.#events = [];
    return out;
  }
}

/** Date calendaire sans heure (achat, vente), en ISO `YYYY-MM-DD`. */
export type IsoDate = `${number}-${number}-${number}`;

export function toIsoDate(d: Date): IsoDate {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}` as IsoDate;
}

export function isIsoDate(s: string): s is IsoDate {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
