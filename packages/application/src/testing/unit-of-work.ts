import type { TransactionalRepositories, UnitOfWork } from "../ports/index.js";
import type { Snapshottable } from "./table.js";

/**
 * Unité de travail en mémoire : exécute le bloc avec les mêmes repos et, si le bloc lève,
 * restaure l'état précédent des tables (rollback fidèle à une base SQL).
 */
export class InMemoryUnitOfWork implements UnitOfWork {
  constructor(
    private readonly repos: TransactionalRepositories,
    private readonly tables: readonly Snapshottable[],
  ) {}

  async run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    const snapshots = this.tables.map((t) => t.snapshot());
    try {
      return await fn(this.repos);
    } catch (e) {
      this.tables.forEach((t, i) => {
        const s = snapshots[i];
        if (s) t.restore(s);
      });
      throw e;
    }
  }
}
