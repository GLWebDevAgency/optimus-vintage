import { EnsureWorkspaceForUser } from "@chine/application";
import { asUserId } from "@chine/domain";
import { rateLimitKey } from "@chine/infrastructure";
import { authSchema } from "@chine/infrastructure/auth-schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { type Container, getContainer } from "@/lib/container";
import { type AppEnv, getEnv } from "@/lib/env";
import { describeError, log, warnOnce } from "@/lib/log";
import { createMailer, type Mailer, resetPasswordEmail, verificationEmail } from "@/lib/mail";

/**
 * Better Auth — configuration serveur.
 *
 * - Persistance : adaptateur Drizzle sur la base du conteneur (tables `user`, `session`,
 *   `account`, `verification` de `@chine/infrastructure`).
 * - E-mails : vérification d'adresse et mot de passe oublié via le `Mailer` (Resend, ou console
 *   hors production). Sans mailer en production, ces flux sont désactivés et journalisés une fois.
 * - Limitation de débit : le limiteur persistant du conteneur (`rate_limits`), 10 tentatives
 *   par 15 min et par IP sur connexion / inscription.
 * - Cookies : `Secure` en production, `SameSite=Lax`, `HttpOnly`.
 * - À la création d'un utilisateur, son espace de travail est créé immédiatement.
 */
export interface CreateAuthOptions {
  readonly deps: Container;
  readonly env: AppEnv;
  readonly mailer?: Mailer | undefined;
  /** Plugin `nextCookies` (pose les cookies depuis les Server Actions) ; désactivé hors Next (seed). */
  readonly nextCookies?: boolean;
}

/** Nom d'espace proposé à l'inscription. */
export const workspaceNameFor = (userName: string | null | undefined): string | undefined => {
  const name = userName?.trim();
  return name ? `Friperie de ${name}` : undefined;
};

const FIFTEEN_MINUTES = 15 * 60;

export function createAuth({
  deps,
  env,
  mailer,
  nextCookies: withCookies = true,
}: CreateAuthOptions) {
  const isProd = env.isProduction;
  if (isProd && !mailer) {
    warnOnce(
      "auth:no-mailer",
      "Production sans mailer : vérification d'e-mail désactivée, mot de passe oublié indisponible.",
    );
  }

  return betterAuth({
    appName: "Chiné",
    database: drizzleAdapter(deps.database.db, { provider: "pg", schema: authSchema }),
    baseURL: env.appOrigin,
    secret: env.authSecret,
    trustedOrigins: env.appOrigin ? [env.appOrigin] : [],
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      autoSignIn: true,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: mailer
        ? async ({ user, url }) => {
            await mailer.send(resetPasswordEmail(user.email, url));
          }
        : undefined,
    },
    emailVerification: mailer
      ? {
          sendOnSignUp: true,
          autoSignInAfterVerification: true,
          expiresIn: 60 * 60,
          sendVerificationEmail: async ({ user, url }) => {
            await mailer.send(verificationEmail(user.email, url));
          },
        }
      : undefined,
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: FIFTEEN_MINUTES, max: 10 },
        "/sign-up/email": { window: FIFTEEN_MINUTES, max: 10 },
        "/request-password-reset": { window: FIFTEEN_MINUTES, max: 5 },
        "/reset-password": { window: FIFTEEN_MINUTES, max: 5 },
        "/send-verification-email": { window: FIFTEEN_MINUTES, max: 5 },
      },
      customStorage: {
        consume: async (key, rule) => {
          const decision = await deps.rateLimiter.hit(
            rateLimitKey("auth", key),
            rule.max,
            rule.window,
          );
          const retryAfter = Math.max(
            1,
            Math.ceil((decision.resetAt.getTime() - Date.now()) / 1000),
          );
          return { allowed: decision.allowed, retryAfter: decision.allowed ? null : retryAfter };
        },
      },
    },
    advanced: {
      database: { generateId: "uuid" },
      useSecureCookies: isProd,
      defaultCookieAttributes: { sameSite: "lax", httpOnly: true, secure: isProd, path: "/" },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const result = await new EnsureWorkspaceForUser(deps).execute({
              userId: asUserId(user.id),
              name: workspaceNameFor(user.name),
            });
            if (!result.ok) {
              log.error("création de l'espace de travail impossible", {
                userId: user.id,
                code: result.error.code,
              });
            }
          },
        },
      },
    },
    plugins: withCookies ? [nextCookies()] : [],
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type Session = NonNullable<Awaited<ReturnType<Auth["api"]["getSession"]>>>;

// ── Singleton processus (survit au HMR via globalThis) ─────────────────────
const GLOBAL_KEY = Symbol.for("chine.web.auth");
type Store = { [GLOBAL_KEY]?: Promise<Auth> };
const store = globalThis as unknown as Store;

/** Instance Better Auth du processus, construite à la première demande (après le conteneur). */
export function getAuth(): Promise<Auth> {
  let current = store[GLOBAL_KEY];
  if (!current) {
    current = (async () => {
      const env = getEnv();
      const deps = await getContainer();
      return createAuth({ deps, env, mailer: createMailer(env) });
    })().catch((e: unknown) => {
      delete store[GLOBAL_KEY];
      log.error("échec d'initialisation de Better Auth", describeError(e));
      throw e;
    });
    store[GLOBAL_KEY] = current;
  }
  return current;
}

/** Remplace l'instance (tests) ; `undefined` rétablit la construction paresseuse. */
export function setAuthForTests(instance: Auth | undefined): void {
  if (instance) store[GLOBAL_KEY] = Promise.resolve(instance);
  else delete store[GLOBAL_KEY];
}

type AnyFn = (...args: unknown[]) => unknown;

/**
 * Accès « statique » : `auth.api.getSession(...)`, `auth.handler(request)`.
 * Chaque appel attend l'instance réelle : l'import du module reste sans effet de bord.
 */
export const auth: Pick<Auth, "api" | "handler"> = {
  api: new Proxy({} as Auth["api"], {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const real = await getAuth();
        const fn = (real.api as unknown as Record<PropertyKey, AnyFn>)[prop];
        if (typeof fn !== "function") throw new TypeError(`auth.api.${String(prop)} n'existe pas`);
        return fn.apply(real.api, args);
      };
    },
  }),
  handler: async (request: Request) => (await getAuth()).handler(request),
};
