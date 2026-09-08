import { createAppDependencies, type InfrastructureDependencies } from "@chine/infrastructure";
import { getEnv } from "@/lib/env";
import { describeError, log } from "@/lib/log";

/**
 * Racine de composition de l'app web : une seule instance des dépendances d'infrastructure
 * par processus (base, repositories, stockage, IA, facturation, limiteur, cycle de vie).
 *
 * La promesse est mémorisée sur `globalThis` pour survivre au rechargement à chaud de Next.js
 * en développement (un module rechargé ne rouvre pas la base). Rien n'est ouvert à l'import :
 * la première requête déclenche la construction, ce qui laisse `next build` évaluer les routes
 * sans base de données.
 */
export type Container = InfrastructureDependencies;

const GLOBAL_KEY = Symbol.for("chine.web.container");
type Store = { [GLOBAL_KEY]?: Promise<Container> };
const store = globalThis as unknown as Store;

async function build(): Promise<Container> {
  const env = getEnv();
  const deps = await createAppDependencies(process.env);
  log.info("conteneur initialisé", {
    database: deps.database.driver,
    appraiser: deps.appraiser.name,
    storage: deps.photos.constructor.name,
    billing: deps.stripe ? "stripe" : "none",
    production: env.isProduction,
  });
  return deps;
}

/** Dépendances du processus, construites à la première demande. */
export function getContainer(): Promise<Container> {
  let current = store[GLOBAL_KEY];
  if (!current) {
    current = build().catch((e: unknown) => {
      // Une construction ratée ne doit pas être mémorisée : la requête suivante réessaie.
      delete store[GLOBAL_KEY];
      log.error("échec d'initialisation du conteneur", describeError(e));
      throw e;
    });
    store[GLOBAL_KEY] = current;
  }
  return current;
}

/** Vrai si le conteneur a déjà été construit (utilisé par /api/ready). */
export function isContainerReady(): boolean {
  return store[GLOBAL_KEY] !== undefined;
}

/**
 * Point d'injection pour les tests : remplace le conteneur par des dépendances isolées
 * (`createIsolatedAppDependencies` sur PGlite en mémoire). `undefined` rétablit le comportement normal.
 */
export function setContainerForTests(deps: Container | undefined): void {
  if (deps) store[GLOBAL_KEY] = Promise.resolve(deps);
  else delete store[GLOBAL_KEY];
}
