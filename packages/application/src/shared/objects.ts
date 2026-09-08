type OmitUndefined<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] } & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

/**
 * Retire les clés valant `undefined`. Indispensable avec `exactOptionalPropertyTypes` pour passer
 * des champs facultatifs d'une commande vers un constructeur du domaine.
 */
export function omitUndefined<T extends object>(o: T): OmitUndefined<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v;
  return out as OmitUndefined<T>;
}
