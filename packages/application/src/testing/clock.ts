import type { WorkspaceId } from "@chine/domain";
import type { Clock, IdGenerator, SkuSequence } from "../ports/index.js";

/** Horloge fixe et pilotable depuis les tests. */
export class FixedClock implements Clock {
  #now: Date;
  constructor(now: Date = new Date("2026-09-08T10:00:00.000Z")) {
    this.#now = now;
  }
  now(): Date {
    return new Date(this.#now);
  }
  set(d: Date): void {
    this.#now = new Date(d);
  }
  advanceDays(days: number): void {
    const d = new Date(this.#now);
    d.setDate(d.getDate() + days);
    this.#now = d;
  }
  advanceMs(ms: number): void {
    this.#now = new Date(this.#now.getTime() + ms);
  }
}

/** Identifiants séquentiels lisibles : `id-1`, `id-2`, … */
export class SequentialIds implements IdGenerator {
  #n = 0;
  constructor(private readonly prefix = "id") {}
  next(): string {
    this.#n += 1;
    return `${this.prefix}-${this.#n}`;
  }
}

export class InMemorySkuSequence implements SkuSequence {
  #counters = new Map<WorkspaceId, number>();
  async next(workspaceId: WorkspaceId): Promise<number> {
    const n = (this.#counters.get(workspaceId) ?? 0) + 1;
    this.#counters.set(workspaceId, n);
    return n;
  }
  current(workspaceId: WorkspaceId): number {
    return this.#counters.get(workspaceId) ?? 0;
  }
}
