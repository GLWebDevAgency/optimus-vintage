/** Utilitaires de mapping ligne SQL ↔ domaine. */
import { type Currency, type IsoDate, Money } from "@chine/domain";

/**
 * Retire les clés `undefined` : avec `exactOptionalPropertyTypes`, un `Props` du domaine
 * n'accepte pas `brand: undefined`, il faut omettre la clé.
 */
export function compact<T extends object>(input: { [K in keyof T]: T[K] | undefined }): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) if (v !== undefined) out[k] = v;
  return out as T;
}

export const money = (minor: number, currency: Currency): Money => Money.ofMinor(minor, currency);
export const moneyOrUndefined = (minor: number | null, currency: Currency): Money | undefined =>
  minor === null ? undefined : Money.ofMinor(minor, currency);
export const minorOrNull = (m: Money | undefined): number | null => (m ? m.minor : null);

/** Une colonne `date` (mode string) est déjà au format `YYYY-MM-DD`. */
export const isoDate = (s: string): IsoDate => s.slice(0, 10) as IsoDate;

/** `null` SQL → `undefined` domaine. */
export const orUndefined = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
/** `undefined` domaine → `null` SQL. */
export const orNull = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

/** Échappe `%`, `_` et `\` pour un motif ILIKE construit depuis une saisie utilisateur. */
export const likePattern = (search: string): string =>
  `%${search.trim().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/** Borne la pagination : limite 1..500, décalage ≥ 0. */
export const page = (limit: number | undefined, offset: number | undefined) => ({
  limit: Math.min(500, Math.max(1, Math.trunc(limit ?? 100))),
  offset: Math.max(0, Math.trunc(offset ?? 0)),
});

/** Copie mutable d'un tableau readonly (Drizzle attend des tableaux mutables en jsonb). */
export const mutable = <T>(xs: readonly T[]): T[] => [...xs];
