import { z } from "zod";

/**
 * Variables d'environnement de l'app web, validées une seule fois par processus.
 *
 * - En production, `BETTER_AUTH_SECRET` (≥ 32 caractères) et une origine publique sont
 *   obligatoires : le processus refuse de servir une requête tant que ce n'est pas corrigé.
 * - En développement et en test, un secret de repli est utilisé (journalisé une fois).
 *
 * Aucune valeur n'est journalisée : seuls les noms de variables en défaut apparaissent.
 */

const NodeEnv = z.enum(["development", "production", "test"]).default("development");
const Url = z.url({ protocol: /^https?$/ });
const optionalUrl = z.preprocess((v) => (v === "" ? undefined : v), Url.optional());
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const EnvSchema = z
  .object({
    NODE_ENV: NodeEnv,
    BETTER_AUTH_SECRET: optionalString,
    BETTER_AUTH_URL: optionalUrl,
    NEXT_PUBLIC_APP_URL: optionalUrl,
    DATABASE_URL: optionalString,
    CHINE_DATA_DIR: optionalString,
    RESEND_API_KEY: optionalString,
    MAIL_FROM: optionalString,
    R2_ACCOUNT_ID: optionalString,
    R2_PUBLIC_BASE_URL: optionalUrl,
    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== "production") return;
    if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_SECRET"],
        message: "obligatoire en production, 32 caractères minimum",
      });
    }
    if (!env.BETTER_AUTH_URL && !env.NEXT_PUBLIC_APP_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["BETTER_AUTH_URL"],
        message: "BETTER_AUTH_URL ou NEXT_PUBLIC_APP_URL est obligatoire en production",
      });
    }
    if (env.DATABASE_URL && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "doit être une URL postgres://",
      });
    }
    if (env.STRIPE_SECRET_KEY && !env.STRIPE_WEBHOOK_SECRET) {
      ctx.addIssue({
        code: "custom",
        path: ["STRIPE_WEBHOOK_SECRET"],
        message: "obligatoire dès que STRIPE_SECRET_KEY est défini (webhooks signés)",
      });
    }
  });

/** Secret de repli hors production : jamais utilisé quand NODE_ENV=production. */
const DEV_FALLBACK_SECRET = "chine-dev-secret-not-for-production-0123456789";

export interface AppEnv extends z.infer<typeof EnvSchema> {
  readonly isProduction: boolean;
  /** Secret de session effectif (repli en dev/test). */
  readonly authSecret: string;
  /** Origine publique de l'app (`https://chine.app`), sans slash final ; `undefined` en dev sans config. */
  readonly appOrigin: string | undefined;
}

export class EnvValidationError extends Error {
  override readonly name = "EnvValidationError";
  constructor(readonly problems: readonly string[]) {
    super(`Configuration invalide :\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
}

/** Valide un objet d'environnement (pur ; `getEnv()` mémorise le résultat pour `process.env`). */
export function parseEnv(source: Readonly<Record<string, string | undefined>>): AppEnv {
  const parsed = EnvSchema.safeParse(source);
  if (!parsed.success) {
    throw new EnvValidationError(
      parsed.error.issues.map((i) => `${i.path.join(".") || "env"} : ${i.message}`),
    );
  }
  const env = parsed.data;
  const origin = env.BETTER_AUTH_URL ?? env.NEXT_PUBLIC_APP_URL;
  return {
    ...env,
    isProduction: env.NODE_ENV === "production",
    authSecret: env.BETTER_AUTH_SECRET ?? DEV_FALLBACK_SECRET,
    appOrigin: origin ? new URL(origin).origin : undefined,
  };
}

let cached: AppEnv | undefined;

/** Environnement validé du processus ; lève `EnvValidationError` (message lisible) sinon. */
export function getEnv(): AppEnv {
  cached ??= parseEnv(process.env);
  return cached;
}

/** Réinitialise le cache (tests). */
export function resetEnvForTests(): void {
  cached = undefined;
}
