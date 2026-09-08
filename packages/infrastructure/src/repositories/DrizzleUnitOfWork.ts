import type { DbExecutor } from "../db/client.js";
import type { TransactionalRepositories, UnitOfWork } from "../ports.js";
import { DrizzleAppraisalRepository } from "./DrizzleAppraisalRepository.js";
import { DrizzleItemRepository } from "./DrizzleItemRepository.js";
import { DrizzleListingRepository } from "./DrizzleListingRepository.js";
import { DrizzlePurchaseSourceRepository } from "./DrizzlePurchaseSourceRepository.js";
import { DrizzleSaleRepository } from "./DrizzleSaleRepository.js";
import { DrizzleSkuSequence } from "./DrizzleSkuSequence.js";
import { DrizzleWorkspaceRepository } from "./DrizzleWorkspaceRepository.js";

/** Ensemble des repositories Drizzle, typés concrètement (méthodes hors port accessibles). */
export interface DrizzleRepositories extends TransactionalRepositories {
  readonly workspaces: DrizzleWorkspaceRepository;
  readonly sources: DrizzlePurchaseSourceRepository;
  readonly items: DrizzleItemRepository;
  readonly listings: DrizzleListingRepository;
  readonly sales: DrizzleSaleRepository;
  readonly appraisals: DrizzleAppraisalRepository;
  readonly skuSequence: DrizzleSkuSequence;
}

/** Lie tous les repositories à un exécuteur (base ou transaction). */
export function createRepositories(db: DbExecutor): DrizzleRepositories {
  return {
    workspaces: new DrizzleWorkspaceRepository(db),
    sources: new DrizzlePurchaseSourceRepository(db),
    items: new DrizzleItemRepository(db),
    listings: new DrizzleListingRepository(db),
    sales: new DrizzleSaleRepository(db),
    appraisals: new DrizzleAppraisalRepository(db),
    skuSequence: new DrizzleSkuSequence(db),
  };
}

/**
 * Unité de travail : tout le bloc s'exécute dans une transaction Postgres (PGlite inclus).
 * Une exception annule tout ; la valeur de retour est renvoyée après commit.
 */
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly db: DbExecutor) {}

  run<T>(fn: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    return this.db.transaction((tx) => fn(createRepositories(tx)));
  }
}
