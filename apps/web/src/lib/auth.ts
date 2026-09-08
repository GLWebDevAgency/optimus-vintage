import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

/**
 * Better Auth — configuration serveur.
 *
 * L'instance est construite paresseusement : importer ce module n'ouvre aucune connexion
 * (indispensable pour `next build`, qui évalue les routes sans base de données).
 *
 * TODO(lead): wire drizzleAdapter(getDatabase().db, { provider: "pg", schema: authSchema })
 *   import { drizzleAdapter } from "better-auth/adapters/drizzle";
 *   import { getDatabase } from "@chine/infrastructure/db";
 *   import * as authSchema from "@chine/infrastructure/auth-schema";
 *   → remplacer `resolveDatabase()` ci-dessous.
 *
 * Tant que l'adaptateur n'est pas branché, Better Auth retombe sur son adaptateur mémoire :
 * les comptes vivent le temps du processus (suffisant pour le dev et les tests e2e).
 */
type BetterAuthOptions = NonNullable<Parameters<typeof betterAuth>[0]>;
type DatabaseOption = BetterAuthOptions["database"];

function resolveDatabase(): DatabaseOption | undefined {
  // TODO(lead): return drizzleAdapter(getDatabase().db, { provider: "pg", schema: authSchema });
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] Aucune base de données branchée : adaptateur mémoire (les sessions ne survivent pas au redémarrage).",
    );
  }
  return undefined;
}

function buildAuth() {
  const options = {
    appName: "Chiné",
    database: resolveDatabase(),
    baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
    },
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    advanced: {
      database: { generateId: "uuid" },
    },
    user: {
      additionalFields: {
        // Espace de travail courant (rempli par la couche application à l'inscription).
        // TODO(lead): brancher la création du Workspace sur le hook `databaseHooks.user.create.after`.
      },
    },
    plugins: [nextCookies()],
  } satisfies BetterAuthOptions;
  return betterAuth(options);
}

export type Auth = ReturnType<typeof buildAuth>;

let instance: Auth | undefined;

/** Instance Better Auth, construite au premier appel. */
export function getAuth(): Auth {
  instance ??= buildAuth();
  return instance;
}

/**
 * Accès « statique » à l'instance : `auth.api.getSession(...)`, `auth.handler(...)`.
 * Chaque accès de propriété déclenche l'initialisation paresseuse.
 */
export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const real = getAuth() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(real) : value;
  },
});

export type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;
