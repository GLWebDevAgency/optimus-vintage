import { assertInvariant, DomainError } from "../shared/result.js";
import { CURRENCY_SYMBOL, type Currency, isCurrency, MINOR_UNITS } from "./currency.js";

export class CurrencyMismatch extends DomainError {
  override readonly name = "CurrencyMismatch";
  constructor(a: Currency, b: Currency) {
    super("CURRENCY_MISMATCH", `Devises incompatibles : ${a} et ${b}`, { a, b });
  }
}

/**
 * Money — Value Object immuable en unités mineures entières (centimes).
 * Jamais de flottant pour un montant : toute l'arithmétique est entière.
 */
export class Money {
  private constructor(
    readonly minor: number,
    readonly currency: Currency,
  ) {
    Object.freeze(this);
  }

  /** Depuis des unités mineures (ex. 2000 → 20,00 €). */
  static ofMinor(minor: number, currency: Currency): Money {
    assertInvariant(Number.isSafeInteger(minor), "Money.minor doit être un entier", { minor });
    return new Money(minor, currency);
  }

  /** Depuis une valeur décimale (20.5 → 2050). Arrondi au demi-centime supérieur. */
  static of(amount: number, currency: Currency): Money {
    assertInvariant(Number.isFinite(amount), "Money.of: montant non fini", { amount });
    const factor = 10 ** MINOR_UNITS[currency];
    return new Money(Math.round(amount * factor), currency);
  }

  /** Depuis une saisie utilisateur : "12,50" | "12.5" | " 12 " | "1 234,00". */
  static parse(input: string, currency: Currency): Money | undefined {
    const cleaned = input.replace(/\s| /g, "").replace(",", ".");
    if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return undefined;
    return Money.of(Number(cleaned), currency);
  }

  static zero(currency: Currency): Money {
    return new Money(0, currency);
  }

  static isMoneyLike(v: unknown): v is { minor: number; currency: string } {
    return typeof v === "object" && v !== null && "minor" in v && "currency" in v;
  }

  static fromJSON(v: { minor: number; currency: string }): Money {
    assertInvariant(isCurrency(v.currency), "Devise inconnue", { currency: v.currency });
    return Money.ofMinor(v.minor, v.currency);
  }

  get amount(): number {
    return this.minor / 10 ** MINOR_UNITS[this.currency];
  }
  get isZero(): boolean {
    return this.minor === 0;
  }
  get isNegative(): boolean {
    return this.minor < 0;
  }
  get isPositive(): boolean {
    return this.minor > 0;
  }

  private same(other: Money): void {
    if (other.currency !== this.currency) throw new CurrencyMismatch(this.currency, other.currency);
  }

  add(other: Money): Money {
    this.same(other);
    return new Money(this.minor + other.minor, this.currency);
  }
  subtract(other: Money): Money {
    this.same(other);
    return new Money(this.minor - other.minor, this.currency);
  }
  negate(): Money {
    return new Money(-this.minor, this.currency);
  }
  abs(): Money {
    return new Money(Math.abs(this.minor), this.currency);
  }
  /** Multiplication par un ratio, arrondi au plus proche (demi-centime vers le haut). */
  multiply(ratio: number): Money {
    assertInvariant(Number.isFinite(ratio), "Money.multiply: ratio non fini", { ratio });
    return new Money(Math.round(this.minor * ratio), this.currency);
  }
  /** Pourcentage : 15 → 15 % du montant. */
  percent(pct: number): Money {
    return this.multiply(pct / 100);
  }
  /** Division entière avec arrondi au plus proche. */
  divide(divisor: number): Money {
    assertInvariant(divisor !== 0 && Number.isFinite(divisor), "Money.divide: diviseur invalide", {
      divisor,
    });
    return new Money(Math.round(this.minor / divisor), this.currency);
  }
  max(other: Money): Money {
    this.same(other);
    return this.minor >= other.minor ? this : other;
  }
  min(other: Money): Money {
    this.same(other);
    return this.minor <= other.minor ? this : other;
  }

  /**
   * Répartition exacte en `parts` montants : la somme des parts vaut exactement `this`.
   * Les centimes restants vont aux premières parts (algorithme de Fowler).
   */
  allocate(parts: number): Money[] {
    assertInvariant(Number.isInteger(parts) && parts > 0, "Money.allocate: parts doit être > 0", {
      parts,
    });
    const base = Math.trunc(this.minor / parts);
    let remainder = this.minor - base * parts;
    const sign = Math.sign(remainder);
    const out: Money[] = [];
    for (let i = 0; i < parts; i++) {
      let minor = base;
      if (remainder !== 0) {
        minor += sign;
        remainder -= sign;
      }
      out.push(new Money(minor, this.currency));
    }
    return out;
  }

  /** Répartition proportionnelle à des poids (ex. kg par pièce), somme exacte. */
  allocateByWeights(weights: readonly number[]): Money[] {
    assertInvariant(weights.length > 0, "Money.allocateByWeights: poids vides");
    const total = weights.reduce((s, w) => s + w, 0);
    assertInvariant(
      total > 0 && weights.every((w) => w >= 0),
      "Money.allocateByWeights: poids invalides",
    );
    let allocated = 0;
    const out = weights.map((w) => {
      const minor = Math.floor((this.minor * w) / total);
      allocated += minor;
      return minor;
    });
    let remainder = this.minor - allocated;
    for (let i = 0; remainder > 0 && i < out.length; i++) {
      out[i] = (out[i] ?? 0) + 1;
      remainder--;
    }
    return out.map((m) => new Money(m, this.currency));
  }

  compare(other: Money): -1 | 0 | 1 {
    this.same(other);
    return this.minor < other.minor ? -1 : this.minor > other.minor ? 1 : 0;
  }
  equals(other: Money): boolean {
    return other.currency === this.currency && other.minor === this.minor;
  }
  greaterThan(other: Money): boolean {
    return this.compare(other) === 1;
  }
  lessThan(other: Money): boolean {
    return this.compare(other) === -1;
  }

  /** Ratio this/other (ex. ROI). `undefined` si other est nul. */
  ratioTo(other: Money): number | undefined {
    this.same(other);
    if (other.minor === 0) return undefined;
    return this.minor / other.minor;
  }

  /** "20,00" (sans symbole), pour les reçus et exports. */
  toDecimalString(locale = "fr-FR"): string {
    const digits = MINOR_UNITS[this.currency];
    return this.amount.toLocaleString(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  /** "20,00 €" — formatage local avec symbole. */
  format(locale = "fr-FR", opts: { compact?: boolean } = {}): string {
    const digits = MINOR_UNITS[this.currency];
    try {
      return this.amount.toLocaleString(locale, {
        style: "currency",
        currency: this.currency,
        minimumFractionDigits: opts.compact ? 0 : digits,
        maximumFractionDigits: digits,
      });
    } catch {
      return `${this.toDecimalString(locale)} ${CURRENCY_SYMBOL[this.currency]}`;
    }
  }

  toJSON(): { minor: number; currency: Currency } {
    return { minor: this.minor, currency: this.currency };
  }
  toString(): string {
    return `${this.toDecimalString()} ${this.currency}`;
  }
}

export const sumMoney = (items: readonly Money[], currency: Currency): Money =>
  items.reduce((acc, m) => acc.add(m), Money.zero(currency));
