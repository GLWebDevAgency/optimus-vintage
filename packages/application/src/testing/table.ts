/** Table en mémoire : stocke les props (immutables) des agrégats, réhydratés à la lecture. */
export class InMemoryTable<K extends string, V> {
  protected rows = new Map<K, V>();

  snapshot(): Map<K, V> {
    return new Map(this.rows);
  }
  restore(snapshot: Map<K, V>): void {
    this.rows = new Map(snapshot);
  }
  clear(): void {
    this.rows.clear();
  }
  get size(): number {
    return this.rows.size;
  }
  values(): V[] {
    return [...this.rows.values()];
  }
}

export interface Snapshottable {
  snapshot(): Map<string, unknown>;
  restore(snapshot: Map<string, unknown>): void;
}

export const byDateDesc =
  <T>(pick: (t: T) => Date) =>
  (a: T, b: T): number =>
    pick(b).getTime() - pick(a).getTime();

export function paginate<T>(rows: readonly T[], limit?: number, offset?: number): T[] {
  const start = offset ?? 0;
  return rows.slice(start, limit !== undefined ? start + limit : undefined);
}

export const matchesSearch = (
  search: string | undefined,
  ...fields: readonly (string | undefined)[]
): boolean => {
  if (!search) return true;
  const needle = search.trim().toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
};
