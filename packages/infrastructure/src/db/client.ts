/**
 * Client base de données : Postgres (`pg.Pool`) quand `DATABASE_URL` est défini,
 * sinon PGlite (Postgres embarqué, persisté sur disque) — zéro configuration en dev.
 * Les deux drivers partagent le même schéma Drizzle et les mêmes migrations SQL.
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as authSchema from "./auth-schema.js";
import * as schema from "./schema.js";

export const fullSchema = { ...schema, ...authSchema };
export type FullSchema = typeof fullSchema;

/**
 * Exécuteur Drizzle indépendant du driver : une base (`db`) ou une transaction (`tx`).
 * Les repositories ne dépendent que de ce type.
 */
export type DbExecutor = PgDatabase<PgQueryResultHKT, FullSchema>;

export type DatabaseDriver = "pg" | "pglite";

export interface DatabaseConfig {
  /** URL Postgres ; vide → PGlite. */
  readonly databaseUrl?: string | undefined;
  /** Dossier de données (PGlite) ; défaut `.data`. */
  readonly dataDir?: string | undefined;
  /** PGlite entièrement en mémoire (tests). */
  readonly inMemory?: boolean | undefined;
  /** Journalise les requêtes SQL. */
  readonly logger?: boolean | undefined;
}

export interface Database {
  readonly db: DbExecutor;
  readonly driver: DatabaseDriver;
  /** Applique les migrations SQL de `drizzle/` (idempotent). */
  migrate(): Promise<void>;
  close(): Promise<void>;
}

/**
 * Dossier des migrations générées par drizzle-kit.
 * Résolu depuis `src/` comme depuis `dist/` ; si le module a été empaqueté (bundler qui réécrit
 * `import.meta.url`), on retombe sur les emplacements connus du monorepo.
 */
export const migrationsFolder = resolveMigrationsFolder();

function resolveMigrationsFolder(): string {
  const candidates: string[] = [];
  try {
    candidates.push(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle"));
  } catch {
    // import.meta.url indisponible ou réécrit : on passe aux candidats suivants.
  }
  const cwd = process.cwd();
  const fromEnv = process.env["CHINE_MIGRATIONS_DIR"]?.trim();
  if (fromEnv) candidates.unshift(path.resolve(cwd, fromEnv));
  candidates.push(
    path.join(cwd, "node_modules/@chine/infrastructure/drizzle"),
    path.resolve(cwd, "../../packages/infrastructure/drizzle"),
    path.join(cwd, "packages/infrastructure/drizzle"),
  );
  for (const c of candidates) if (existsSync(path.join(c, "meta/_journal.json"))) return c;
  throw new Error(`Dossier de migrations introuvable (candidats : ${candidates.join(", ")})`);
}

const wantsSsl = (url: string): boolean => {
  try {
    const u = new URL(url);
    const mode = u.searchParams.get("sslmode") ?? u.searchParams.get("ssl");
    return mode === "require" || mode === "true" || mode === "verify-full" || mode === "verify-ca";
  } catch {
    return false;
  }
};

async function createPgDatabase(url: string, logger: boolean): Promise<Database> {
  const { default: pg } = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { migrate } = await import("drizzle-orm/node-postgres/migrator");
  const pool = new pg.Pool({
    connectionString: url,
    max: 10,
    ...(wantsSsl(url) ? { ssl: { rejectUnauthorized: false } } : {}),
  });
  const db = drizzle({ client: pool, schema: fullSchema, logger });
  return {
    db,
    driver: "pg",
    migrate: () => migrate(db, { migrationsFolder }),
    close: () => pool.end(),
  };
}

async function createPgliteDatabase(
  dataDir: string | undefined,
  inMemory: boolean,
  logger: boolean,
): Promise<Database> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  let client: InstanceType<typeof PGlite>;
  if (inMemory) {
    client = new PGlite();
  } else {
    const dir = path.resolve(dataDir ?? ".data", "pglite");
    mkdirSync(dir, { recursive: true });
    client = new PGlite(dir);
  }
  await client.waitReady;
  const db = drizzle({ client, schema: fullSchema, logger });
  return {
    db,
    driver: "pglite",
    migrate: () => migrate(db, { migrationsFolder }),
    close: () => client.close(),
  };
}

/** Crée une connexion selon la configuration (sans singleton). */
export function createDatabase(config: DatabaseConfig = {}): Promise<Database> {
  const logger = config.logger ?? false;
  const url = config.databaseUrl?.trim();
  if (url && !config.inMemory) return createPgDatabase(url, logger);
  return createPgliteDatabase(config.dataDir, config.inMemory ?? false, logger);
}

type Env = Readonly<Record<string, string | undefined>>;
const read = (env: Env, key: string): string | undefined => env[key];

/** Configuration lue depuis l'environnement (`DATABASE_URL`, `CHINE_DATA_DIR`). */
export function databaseConfigFromEnv(env: Env = process.env): DatabaseConfig {
  return {
    databaseUrl: read(env, "DATABASE_URL"),
    dataDir: read(env, "CHINE_DATA_DIR"),
    logger: read(env, "CHINE_SQL_LOG") === "true",
  };
}

// ── Singleton processus (survit au HMR de Next.js via globalThis) ─────────
const GLOBAL_KEY = Symbol.for("chine.infrastructure.database");
type GlobalStore = { [GLOBAL_KEY]?: Promise<Database> };

/** Base partagée par le processus, créée paresseusement à partir de l'environnement. */
export function getDatabase(env: Env = process.env): Promise<Database> {
  const store = globalThis as unknown as GlobalStore;
  let current = store[GLOBAL_KEY];
  if (!current) {
    current = createDatabase(databaseConfigFromEnv(env));
    store[GLOBAL_KEY] = current;
  }
  return current;
}

/** Ferme et oublie le singleton (tests, arrêt propre). */
export async function resetDatabase(): Promise<void> {
  const store = globalThis as unknown as GlobalStore;
  const current = store[GLOBAL_KEY];
  delete store[GLOBAL_KEY];
  if (current) await (await current).close();
}
