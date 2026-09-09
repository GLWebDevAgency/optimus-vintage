/**
 * Racine de composition : assemble base, repositories, unité de travail, outbox, IA,
 * stockage, facturation, horloge et identifiants à partir de l'environnement.
 */
import { type AppraiserRouter, createAppraiser } from "./ai/index.js";
import { createBillingGateway, StripeBillingGateway } from "./billing/index.js";
import { SystemClock } from "./clock.js";
import { createDatabase, type Database, databaseConfigFromEnv, getDatabase } from "./db/client.js";
import { OutboxEventPublisher } from "./events/OutboxEventPublisher.js";
import { OutboxRelay } from "./events/OutboxRelay.js";
import { UuidV7Generator } from "./ids.js";
import { DataLifecycle } from "./lifecycle/DataLifecycle.js";
import type { AppDependencies } from "./ports.js";
import {
  createRepositories,
  type DrizzleRepositories,
  DrizzleUnitOfWork,
} from "./repositories/index.js";
import { DrizzleIdempotencyStore } from "./security/idempotency.js";
import { DrizzleRateLimiter } from "./security/rate-limit.js";
import { createPhotoStorage } from "./storage/index.js";

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key]?.trim() || undefined;

export interface InfrastructureDependencies
  extends Omit<AppDependencies, keyof DrizzleRepositories>,
    DrizzleRepositories {
  readonly database: Database;
  /** Routeur d'experts IA (chaîne de fournisseurs) : `describe()` alimente `/api/health`. */
  readonly appraiser: AppraiserRouter;
  readonly outbox: OutboxEventPublisher;
  readonly outboxRelay: OutboxRelay;
  /** Limiteur de débit persistant (hors port applicatif : utilisé par la couche HTTP). */
  readonly rateLimiter: DrizzleRateLimiter;
  /** Rejeu idempotent des mutations (`X-Outbox-Id`). */
  readonly idempotency: DrizzleIdempotencyStore;
  /** Export / effacement RGPD. */
  readonly lifecycle: DataLifecycle;
  /** Présent uniquement quand Stripe est configuré (traitement des webhooks). */
  readonly stripe: StripeBillingGateway | undefined;
}

export interface CompositionOptions {
  /** Base déjà créée (tests) ; sinon singleton `getDatabase(env)`. */
  readonly database?: Database | undefined;
  /**
   * Applique les migrations au démarrage. Défaut : oui pour PGlite (dev), non pour Postgres
   * (sauf `CHINE_AUTO_MIGRATE=true`) — en prod on migre explicitement via `db:migrate`.
   */
  readonly migrate?: boolean | undefined;
}

export async function createAppDependencies(
  env: Env = process.env,
  options: CompositionOptions = {},
): Promise<InfrastructureDependencies> {
  const database = options.database ?? (await getDatabase(env));
  const shouldMigrate =
    options.migrate ?? (database.driver === "pglite" || read(env, "CHINE_AUTO_MIGRATE") === "true");
  if (shouldMigrate) await database.migrate();

  const { db } = database;
  const ids = new UuidV7Generator();
  const repos = createRepositories(db);
  const outbox = new OutboxEventPublisher(db, ids);
  const billing = createBillingGateway(db, env);

  return {
    ...repos,
    database,
    clock: new SystemClock(),
    ids,
    uow: new DrizzleUnitOfWork(db),
    events: outbox,
    outbox,
    outboxRelay: new OutboxRelay(outbox),
    rateLimiter: new DrizzleRateLimiter(db),
    idempotency: new DrizzleIdempotencyStore(db),
    lifecycle: new DataLifecycle(db),
    appraiser: createAppraiser(env),
    photos: createPhotoStorage(env),
    billing,
    stripe: billing instanceof StripeBillingGateway ? billing : undefined,
  };
}

/** Variante sans singleton : base neuve (utile pour des scripts ou des tests d'intégration). */
export async function createIsolatedAppDependencies(
  env: Env = process.env,
  options: Omit<CompositionOptions, "database"> & { inMemory?: boolean } = {},
): Promise<InfrastructureDependencies> {
  const database = await createDatabase({
    ...databaseConfigFromEnv(env),
    inMemory: options.inMemory,
  });
  return createAppDependencies(env, { database, migrate: options.migrate ?? true });
}

// ── Singleton processus (Next.js : une seule composition par processus) ───
const GLOBAL_KEY = Symbol.for("chine.infrastructure.dependencies");
type GlobalStore = { [GLOBAL_KEY]?: Promise<InfrastructureDependencies> };

export function getAppDependencies(env: Env = process.env): Promise<InfrastructureDependencies> {
  const store = globalThis as unknown as GlobalStore;
  let current = store[GLOBAL_KEY];
  if (!current) {
    current = createAppDependencies(env);
    store[GLOBAL_KEY] = current;
  }
  return current;
}

export function resetAppDependencies(): void {
  const store = globalThis as unknown as GlobalStore;
  delete store[GLOBAL_KEY];
}
