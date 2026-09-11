import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "@/lib/env";

/** Production minimale valide : chaque test n'en fait varier que ce qu'il mesure. */
const PROD_BASE = {
  NODE_ENV: "production",
  BETTER_AUTH_SECRET: "x".repeat(40),
  BETTER_AUTH_URL: "https://chine.app",
  DATABASE_URL: "postgres://user:pw@host/db",
  RESEND_API_KEY: "re_x",
} as const;

describe("env", () => {
  it("accepte un environnement de développement vide (secret de repli)", () => {
    const env = parseEnv({ NODE_ENV: "development" });
    expect(env.isProduction).toBe(false);
    expect(env.authSecret.length).toBeGreaterThanOrEqual(32);
    expect(env.appOrigin).toBeUndefined();
  });

  it("refuse la production sans secret ni origine, avec un message lisible", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(EnvValidationError);
    try {
      parseEnv({ NODE_ENV: "production", BETTER_AUTH_SECRET: "court" });
    } catch (e) {
      const err = e as EnvValidationError;
      expect(err.problems.join("\n")).toContain("BETTER_AUTH_SECRET");
      expect(err.problems.join("\n")).toContain("BETTER_AUTH_URL");
      expect(err.message).not.toContain("court");
    }
  });

  it("valide une production correcte et normalise l'origine", () => {
    const env = parseEnv({ ...PROD_BASE, BETTER_AUTH_URL: "https://chine.app/" });
    expect(env.isProduction).toBe(true);
    expect(env.appOrigin).toBe("https://chine.app");
  });

  it("exige un service d'e-mail en production, sauf dérogation explicite", () => {
    const { RESEND_API_KEY: _omis, ...base } = PROD_BASE;
    expect(() => parseEnv(base)).toThrow(/RESEND_API_KEY/);
    expect(parseEnv({ ...base, CHINE_ALLOW_NO_MAILER: "true" }).isProduction).toBe(true);
  });

  it("exige DATABASE_URL en production, sauf dérogation explicite", () => {
    const { DATABASE_URL: _omis, ...base } = PROD_BASE;
    expect(() => parseEnv(base)).toThrow(/DATABASE_URL/);
    expect(parseEnv({ ...base, CHINE_ALLOW_EMBEDDED_DB: "true" }).isProduction).toBe(true);
    // La dérogation n'est levée que par la valeur exacte "true".
    expect(() => parseEnv({ ...base, CHINE_ALLOW_EMBEDDED_DB: "1" })).toThrow(/DATABASE_URL/);
  });

  it("n'exige pas DATABASE_URL hors production (PGlite embarquée)", () => {
    expect(parseEnv({ NODE_ENV: "development" }).DATABASE_URL).toBeUndefined();
    expect(parseEnv({ NODE_ENV: "test" }).DATABASE_URL).toBeUndefined();
  });

  it("refuse une DATABASE_URL qui n'est pas une URL postgres, sans révéler sa valeur", () => {
    const secret = "mysql://root:mot-de-passe-secret@host/db";
    try {
      parseEnv({ ...PROD_BASE, DATABASE_URL: secret });
      expect.unreachable("la validation aurait dû échouer");
    } catch (e) {
      const err = e as EnvValidationError;
      expect(err.message).toContain("DATABASE_URL");
      expect(err.message).not.toContain("mot-de-passe-secret");
      expect(err.message).not.toContain(secret);
    }
  });

  it("exige le secret de webhook dès que Stripe est configuré en production", () => {
    expect(() => parseEnv({ ...PROD_BASE, STRIPE_SECRET_KEY: "sk_live_x" })).toThrow(
      /STRIPE_WEBHOOK_SECRET/,
    );
  });

  it("expose les cinq variables R2 du schéma", () => {
    const env = parseEnv({
      NODE_ENV: "development",
      STORAGE_DRIVER: "r2",
      R2_ACCOUNT_ID: "acc",
      R2_ACCESS_KEY_ID: "key",
      R2_SECRET_ACCESS_KEY: "secret",
      R2_BUCKET: "chine-photos",
      R2_PUBLIC_BASE_URL: "https://cdn.chine.app",
    });
    expect(env.STORAGE_DRIVER).toBe("r2");
    expect(env.R2_ACCESS_KEY_ID).toBe("key");
    expect(env.R2_SECRET_ACCESS_KEY).toBe("secret");
    expect(env.R2_BUCKET).toBe("chine-photos");
  });

  it("exige les cinq variables R2 quand STORAGE_DRIVER=r2, en les nommant toutes", () => {
    try {
      parseEnv({ NODE_ENV: "development", STORAGE_DRIVER: "r2", R2_ACCOUNT_ID: "acc" });
      expect.unreachable("la validation aurait dû échouer");
    } catch (e) {
      const err = e as EnvValidationError;
      const texte = err.problems.join("\n");
      expect(texte).toContain("R2_ACCESS_KEY_ID");
      expect(texte).toContain("R2_SECRET_ACCESS_KEY");
      expect(texte).toContain("R2_BUCKET");
      expect(texte).toContain("R2_PUBLIC_BASE_URL");
      // Déjà renseignée : elle ne doit pas être signalée, ni sa valeur apparaître.
      expect(texte).not.toContain("R2_ACCOUNT_ID :");
      expect(texte).not.toContain("acc");
    }
  });

  it("ne nomme que la variable R2 manquante, jamais la valeur des autres", () => {
    try {
      parseEnv({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "x".repeat(40),
        BETTER_AUTH_URL: "https://chine.app",
        DATABASE_URL: "postgres://user:pw@host/db",
        RESEND_API_KEY: "re_x",
        STORAGE_DRIVER: "r2",
        R2_ACCOUNT_ID: "acc",
        R2_ACCESS_KEY_ID: "key",
        R2_SECRET_ACCESS_KEY: "cle-secrete-a-ne-jamais-journaliser",
        R2_PUBLIC_BASE_URL: "https://cdn.chine.app",
      });
      expect.unreachable("la validation aurait dû échouer");
    } catch (e) {
      const err = e as EnvValidationError;
      expect(err.problems).toEqual(["R2_BUCKET : obligatoire quand STORAGE_DRIVER=r2"]);
      expect(err.message).not.toContain("cle-secrete-a-ne-jamais-journaliser");
    }
  });

  it("laisse passer STORAGE_DRIVER=local ou absent sans configuration R2", () => {
    expect(parseEnv({ NODE_ENV: "development", STORAGE_DRIVER: "local" }).STORAGE_DRIVER).toBe(
      "local",
    );
    expect(parseEnv({ NODE_ENV: "development" }).STORAGE_DRIVER).toBeUndefined();
    expect(parseEnv({ ...PROD_BASE, STORAGE_DRIVER: "auto" }).isProduction).toBe(true);
  });

  it("refuse un STORAGE_DRIVER inconnu sans révéler sa valeur", () => {
    try {
      parseEnv({ NODE_ENV: "development", STORAGE_DRIVER: "s3-maison" });
      expect.unreachable("la validation aurait dû échouer");
    } catch (e) {
      const err = e as EnvValidationError;
      expect(err.message).toContain("STORAGE_DRIVER");
      expect(err.message).not.toContain("s3-maison");
    }
  });

  it("refuse une URL invalide", () => {
    expect(() => parseEnv({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "pas-une-url" })).toThrow(
      EnvValidationError,
    );
  });
});
