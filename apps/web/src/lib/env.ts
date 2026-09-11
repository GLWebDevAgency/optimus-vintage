import { z } from "zod";

/**
 * Variables d'environnement de l'app web, validées une seule fois par processus.
 *
 * - En production, `BETTER_AUTH_SECRET` (≥ 32 caractères), une origine publique et
 *   `DATABASE_URL` sont obligatoires : le processus refuse de servir une requête tant que
 *   ce n'est pas corrigé.
 * - En développement et en test, un secret de repli est utilisé (journalisé une fois) et la
 *   base embarquée PGlite fait office de base de données.
 * - La cohérence du stockage de photos (`STORAGE_DRIVER=r2` ⇒ les cinq variables `R2_*`) est
 *   vérifiée dans tous les environnements, avant que le conteneur n'échoue au démarrage.
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
const optionalEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.enum(values).optional(),
  );

/** Les cinq variables exigées par le pilote de stockage R2, dans l'ordre de la documentation. */
const R2_VARIABLES = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
] as const;

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
    /** `auto` (défaut) choisit R2 dès qu'il est complètement configuré, sinon le disque local. */
    STORAGE_DRIVER: optionalEnum(["auto", "r2", "local"]),
    R2_ACCOUNT_ID: optionalString,
    R2_ACCESS_KEY_ID: optionalString,
    R2_SECRET_ACCESS_KEY: optionalString,
    R2_BUCKET: optionalString,
    R2_PUBLIC_BASE_URL: optionalUrl,
    STRIPE_SECRET_KEY: optionalString,
    STRIPE_WEBHOOK_SECRET: optionalString,
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error", "silent"]).optional(),
    /** `true` pour tolérer une production sans e-mails (recette) : mot de passe oublié indisponible. */
    CHINE_ALLOW_NO_MAILER: optionalString,
    /**
     * `true` pour tolérer une production sans `DATABASE_URL` : la base embarquée PGlite est alors
     * écrite dans `CHINE_DATA_DIR`. Réservé aux builds de production jetables (e2e, démo locale) ;
     * sur un hébergeur au disque éphémère, toutes les données sont perdues au redéploiement.
     */
    CHINE_ALLOW_EMBEDDED_DB: optionalString,
  })
  .superRefine((env, ctx) => {
    // Cohérence du stockage : valable dans tous les environnements, car `createPhotoStorage`
    // échoue au démarrage du conteneur avec un message générique qui ne nomme rien.
    if (env.STORAGE_DRIVER === "r2") {
      for (const nom of R2_VARIABLES) {
        if (!env[nom]) {
          ctx.addIssue({
            code: "custom",
            path: [nom],
            message: "obligatoire quand STORAGE_DRIVER=r2",
          });
        }
      }
    }
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
    if (!env.DATABASE_URL && env.CHINE_ALLOW_EMBEDDED_DB !== "true") {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message:
          "obligatoire en production : sans elle la base embarquée PGlite est écrite sur un disque éphémère et perdue au redéploiement ; CHINE_ALLOW_EMBEDDED_DB=true pour passer outre",
      });
    }
    if (env.DATABASE_URL && !/^postgres(ql)?:\/\//.test(env.DATABASE_URL)) {
      ctx.addIssue({
        code: "custom",
        path: ["DATABASE_URL"],
        message: "doit être une URL postgres://",
      });
    }
    if (!env.RESEND_API_KEY && env.CHINE_ALLOW_NO_MAILER !== "true") {
      ctx.addIssue({
        code: "custom",
        path: ["RESEND_API_KEY"],
        message:
          "obligatoire en production (mot de passe oublié, vérification d'e-mail) ; CHINE_ALLOW_NO_MAILER=true pour passer outre",
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
