import type { Clock } from "./ports.js";

/** Horloge système. */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Horloge figée (tests, rejeu). */
export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return new Date(this.current.getTime());
  }
  set(date: Date): void {
    this.current = date;
  }
  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
