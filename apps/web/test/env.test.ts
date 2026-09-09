import { describe, expect, it } from "vitest";
import { EnvValidationError, parseEnv } from "@/lib/env";

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
    const env = parseEnv({
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "x".repeat(40),
      BETTER_AUTH_URL: "https://chine.app/",
      DATABASE_URL: "postgres://user:pw@host/db",
      RESEND_API_KEY: "re_x",
    });
    expect(env.isProduction).toBe(true);
    expect(env.appOrigin).toBe("https://chine.app");
  });

  it("exige un service d'e-mail en production, sauf dérogation explicite", () => {
    const base = {
      NODE_ENV: "production",
      BETTER_AUTH_SECRET: "x".repeat(40),
      BETTER_AUTH_URL: "https://chine.app",
    };
    expect(() => parseEnv(base)).toThrow(/RESEND_API_KEY/);
    expect(parseEnv({ ...base, CHINE_ALLOW_NO_MAILER: "true" }).isProduction).toBe(true);
  });

  it("exige le secret de webhook dès que Stripe est configuré en production", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "production",
        BETTER_AUTH_SECRET: "x".repeat(40),
        NEXT_PUBLIC_APP_URL: "https://chine.app",
        RESEND_API_KEY: "re_x",
        STRIPE_SECRET_KEY: "sk_live_x",
      }),
    ).toThrow(/STRIPE_WEBHOOK_SECRET/);
  });

  it("refuse une URL invalide", () => {
    expect(() => parseEnv({ NODE_ENV: "development", NEXT_PUBLIC_APP_URL: "pas-une-url" })).toThrow(
      EnvValidationError,
    );
  });
});
