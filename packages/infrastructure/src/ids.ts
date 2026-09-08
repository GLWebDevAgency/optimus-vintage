import { randomFillSync } from "node:crypto";
import type { IdGenerator } from "./ports.js";

/**
 * Générateur d'UUID v7 (RFC 9562) : 48 bits de temps Unix en ms, puis 12 bits de séquence
 * monotone, puis 62 bits aléatoires. Triable chronologiquement, donc idéal en clé primaire.
 */
export class UuidV7Generator implements IdGenerator {
  private lastMs = -1;
  private seq = 0;

  constructor(private readonly now: () => number = Date.now) {}

  next(): string {
    let ms = this.now();
    if (ms <= this.lastMs) {
      // Même milliseconde (ou horloge reculée) : on incrémente la séquence pour rester monotone.
      ms = this.lastMs;
      this.seq += 1;
      if (this.seq > 0x0fff) {
        this.seq = 0;
        ms += 1;
      }
    } else {
      this.seq = randomInt12();
    }
    this.lastMs = ms;

    const bytes = new Uint8Array(16);
    randomFillSync(bytes, 6);
    bytes[0] = (ms / 2 ** 40) & 0xff;
    bytes[1] = (ms / 2 ** 32) & 0xff;
    bytes[2] = (ms / 2 ** 24) & 0xff;
    bytes[3] = (ms / 2 ** 16) & 0xff;
    bytes[4] = (ms / 2 ** 8) & 0xff;
    bytes[5] = ms & 0xff;
    bytes[6] = 0x70 | (this.seq >> 8); // version 7 + 4 bits hauts de la séquence
    bytes[7] = this.seq & 0xff;
    bytes[8] = (0x80 | ((bytes[8] ?? 0) & 0x3f)) & 0xff; // variante RFC 4122 (10xx)
    return format(bytes);
  }
}

/** Séquence initiale aléatoire sur 11 bits (laisse de la place pour incrémenter). */
function randomInt12(): number {
  const b = new Uint8Array(2);
  randomFillSync(b);
  return (((b[0] ?? 0) << 8) | (b[1] ?? 0)) & 0x07ff;
}

function format(b: Uint8Array): string {
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const isUuid = (s: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

/** Extrait l'horodatage (ms) d'un UUID v7. */
export function uuidV7Timestamp(id: string): number | undefined {
  if (!isUuid(id) || id[14] !== "7") return undefined;
  return Number.parseInt(id.slice(0, 8) + id.slice(9, 13), 16);
}
