import { CATEGORIES, PLATFORMS } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  APPRAISAL_JSON_SCHEMA,
  AppraisalOutputSchema,
  AppraiserError,
  buildPrompt,
  parseAppraisalOutput,
  toAppraiserError,
  toDraft,
  toGeminiSchema,
  withTimeout,
} from "../src/ai/core.js";
import { request, validOutput } from "./ai-fixtures.js";

type Schema = Record<string, unknown>;
const prop = (schema: Schema, ...path: string[]): Schema =>
  path.reduce<Schema>((s, key) => (s["properties"] as Record<string, Schema>)[key] ?? {}, schema);

describe("schéma de sortie", () => {
  it("accepte une sortie conforme et rejette les énumérations inconnues", () => {
    expect(AppraisalOutputSchema.safeParse(validOutput()).success).toBe(true);
    const bad = AppraisalOutputSchema.safeParse({
      ...validOutput(),
      market: { ...validOutput().market, demand: "ENORME" },
    });
    expect(bad.success).toBe(false);
  });

  it("exporte un JSON Schema strict (tout requis, sans propriété additionnelle)", () => {
    expect(APPRAISAL_JSON_SCHEMA["$schema"]).toBeUndefined();
    expect(APPRAISAL_JSON_SCHEMA["additionalProperties"]).toBe(false);
    expect(APPRAISAL_JSON_SCHEMA["required"]).toEqual([
      "identification",
      "price",
      "market",
      "advice",
      "listingCopy",
    ]);
    expect(prop(APPRAISAL_JSON_SCHEMA, "identification", "category")["enum"]).toEqual([
      ...CATEGORIES,
    ]);
    expect(prop(APPRAISAL_JSON_SCHEMA, "identification", "brand")["type"]).toEqual([
      "string",
      "null",
    ]);
    expect(prop(APPRAISAL_JSON_SCHEMA, "price", "retailNew")["anyOf"]).toEqual([
      expect.objectContaining({ type: "number" }),
      { type: "null" },
    ]);
    const platform = prop(
      prop(APPRAISAL_JSON_SCHEMA, "price", "perPlatform")["items"] as Schema,
      "platform",
    );
    expect(platform["enum"]).toEqual([...PLATFORMS]);
  });

  it("se convertit en sous-ensemble OpenAPI pour Gemini (types majuscules, nullable)", () => {
    const gemini = toGeminiSchema(APPRAISAL_JSON_SCHEMA);
    expect(gemini["type"]).toBe("OBJECT");
    expect(gemini["additionalProperties"]).toBeUndefined();
    expect(prop(gemini, "identification", "brand")).toMatchObject({
      type: "STRING",
      nullable: true,
    });
    expect(prop(gemini, "listingCopy")).toMatchObject({ type: "OBJECT", nullable: true });
    expect(prop(gemini, "listingCopy")["required"]).toEqual(["title", "description", "hashtags"]);
    expect(prop(gemini, "price", "perPlatform")["type"]).toBe("ARRAY");
    expect((prop(gemini, "price", "perPlatform")["items"] as Schema)["type"]).toBe("OBJECT");
    expect(JSON.stringify(gemini)).not.toMatch(/anyOf|\$schema|minimum/);
  });
});

describe("toDraft", () => {
  it("convertit les montants décimaux en unités mineures (EUR)", () => {
    const d = toDraft(validOutput(), {
      provider: "test",
      model: "m",
      latencyMs: 12.6,
      currency: "EUR",
    });
    expect(d.provider).toBe("test");
    expect(d.model).toBe("m");
    expect(d.latencyMs).toBe(13);
    expect(d.price.mid.minor).toBe(4550);
    expect(d.price.retailNew?.minor).toBe(15000);
    expect(d.advice.maxBuyPrice?.minor).toBe(1800);
    expect(d.price.perPlatform[0]?.price.minor).toBe(4900);
    expect(d.listingCopy?.hashtags).toEqual(["#lacoste", "#vintage"]);
  });

  it("respecte les devises sans décimales (JPY)", () => {
    const d = toDraft(validOutput(), {
      provider: "test",
      model: "m",
      latencyMs: 1,
      currency: "JPY",
    });
    expect(d.price.mid.currency).toBe("JPY");
    expect(d.price.mid.minor).toBe(46);
    expect(d.price.low.minor).toBe(35);
    expect(d.price.retailNew?.minor).toBe(150);
  });

  it("supprime l'annonce quand elle n'a pas été demandée", () => {
    const d = toDraft(validOutput(), {
      provider: "t",
      model: "m",
      latencyMs: 0,
      currency: "EUR",
      wantListingCopy: false,
    });
    expect(d.listingCopy).toBeNull();
  });
});

describe("parseAppraisalOutput", () => {
  it("lève INVALID_OUTPUT (non réessayable) avec le détail des écarts", () => {
    try {
      parseAppraisalOutput({ identification: {} }, "openai");
      expect.fail("devait lever");
    } catch (e) {
      expect(e).toBeInstanceOf(AppraiserError);
      const err = e as AppraiserError;
      expect(err.code).toBe("INVALID_OUTPUT");
      expect(err.retryable).toBe(false);
      expect(err.provider).toBe("openai");
      expect(Array.isArray(err.details?.["issues"])).toBe(true);
    }
  });
});

describe("AppraiserError", () => {
  it("déduit `retryable` du code et reste sérialisable", () => {
    expect(new AppraiserError("TIMEOUT", "t").retryable).toBe(true);
    expect(new AppraiserError("RATE_LIMITED", "r").retryable).toBe(true);
    expect(new AppraiserError("REFUSED", "r").retryable).toBe(false);
    expect(new AppraiserError("UPSTREAM_ERROR", "u", { retryable: true }).retryable).toBe(true);
    const json = new AppraiserError("NOT_CONFIGURED", "n", { provider: "x" }).toJSON();
    expect(json).toMatchObject({ name: "AppraiserError", code: "NOT_CONFIGURED", provider: "x" });
    const wrapped = toAppraiserError(new Error("boom"), "gemini");
    expect(wrapped).toMatchObject({ code: "UPSTREAM_ERROR", retryable: true, provider: "gemini" });
    expect(wrapped.cause).toBeInstanceOf(Error);
  });
});

describe("withTimeout", () => {
  it("annule le signal et lève TIMEOUT quand le délai expire", async () => {
    let aborted = false;
    const slow = (signal: AbortSignal) =>
      new Promise<never>((_, reject) => {
        signal.addEventListener("abort", () => {
          aborted = true;
          reject(new Error("aborted"));
        });
      });
    await expect(withTimeout(slow, 20, "gemini")).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
      provider: "gemini",
    });
    expect(aborted).toBe(true);
  });

  it("laisse passer un résultat rapide et les erreurs typées", async () => {
    await expect(withTimeout(async () => 42, 1000, "x")).resolves.toBe(42);
    await expect(
      withTimeout(
        async () => {
          throw new AppraiserError("REFUSED", "non");
        },
        1000,
        "x",
      ),
    ).rejects.toMatchObject({ code: "REFUSED" });
  });
});

describe("buildPrompt", () => {
  it("localise la langue, la devise, les indices et l'annonce", () => {
    const fr = buildPrompt(request({ wantListingCopy: true, hints: { brand: "Nike" } }));
    expect(fr.system).toContain("in French");
    expect(fr.system).toContain("EUR");
    expect(fr.user).toContain("Nike");
    expect(fr.user).toContain("listingCopy: a catchy title");
    const de = buildPrompt(request({ locale: "de", currency: "CHF" }));
    expect(de.system).toContain("in German");
    expect(de.system).toContain("CHF");
    expect(de.user).toContain("Set listingCopy to null");
    expect(buildPrompt(request({ locale: "en" })).system).toContain("in English");
  });
});
