import { CATEGORIES, CONDITIONS, ERAS, Money, PLATFORMS } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  parseAppraisalBody,
  parseMoney,
  serializeAppraisalBody,
} from "../src/ai/appraisal-codec.js";
import { AppraiserError, parseJsonLoosely } from "../src/ai/core.js";
import { FakeAppraiser } from "../src/ai/FakeAppraiser.js";
import { GeminiAppraiser } from "../src/ai/GeminiAppraiser.js";
import { createAppraiser } from "../src/ai/index.js";
import { fakeFetch, hangingFetch, jsonResponse, request, validOutput } from "./ai-fixtures.js";

describe("FakeAppraiser", () => {
  it("renvoie une expertise complète et cohérente avec le domaine", async () => {
    const d = await new FakeAppraiser().appraise(request({ wantListingCopy: true }));
    expect(d.provider).toBe("fake");
    expect(CATEGORIES).toContain(d.identification.category);
    expect(CONDITIONS).toContain(d.identification.condition);
    expect(ERAS).toContain(d.identification.era);
    expect(d.price.low.minor).toBeLessThanOrEqual(d.price.mid.minor);
    expect(d.price.mid.minor).toBeLessThanOrEqual(d.price.high.minor);
    expect(d.price.perPlatform.every((p) => PLATFORMS.includes(p.platform))).toBe(true);
    expect(d.listingCopy?.title).toContain("Lacoste");
    expect(d.listingCopy?.hashtags.length).toBeGreaterThan(3);
  });

  it("respecte la devise, la langue et les indices", async () => {
    const d = await new FakeAppraiser().appraise(
      request({
        currency: "USD",
        locale: "en",
        hints: { brand: "Nike", category: "jacket", purchasePriceMinor: 1000 },
        wantListingCopy: true,
      }),
    );
    expect(d.price.mid.currency).toBe("USD");
    expect(d.identification.brand).toBe("Nike");
    expect(d.identification.category).toBe("JACKET");
    expect(d.advice.action).toBe("STRONG_BUY");
    expect(d.listingCopy?.description).toMatch(/Authentic/);
    const pass = await new FakeAppraiser().appraise(
      request({ hints: { purchasePriceMinor: 9000 } }),
    );
    expect(pass.advice.action).toBe("PASS");
    expect(pass.listingCopy).toBeNull();
  });
});

describe("codec d'expertise", () => {
  it("parse des montants sous toutes les formes", () => {
    expect(parseMoney(24.5, "EUR")?.minor).toBe(2450);
    expect(parseMoney("24,50 €", "EUR")?.minor).toBe(2450);
    expect(parseMoney({ minor: 1999, currency: "USD" }, "EUR")?.toJSON()).toEqual({
      minor: 1999,
      currency: "USD",
    });
    expect(parseMoney({ amount: 12 }, "GBP")?.minor).toBe(1200);
    expect(parseMoney(null, "EUR")).toBeUndefined();
    expect(parseMoney("n/a", "EUR")).toBeUndefined();
  });

  it("normalise une réponse approximative sans planter", () => {
    const body = parseAppraisalBody(
      {
        identification: {
          brand: "null",
          category: "track suit",
          era: "90s",
          condition: "very good",
          brandConfidence: 85,
          materials: "coton",
        },
        price: {
          low: 50,
          mid: 40,
          high: 30,
          confidence: "0.7",
          perPlatform: [{ platform: "vinted", price: "45", daysToSell: 7.6 }, { platform: "X" }],
        },
        market: { demand: "high", trend: "up", rarity: 150 },
        advice: { action: "buy", maxBuyPrice: 12, risk: 0.2, reasons: ["ok", 3] },
        listingCopy: { title: "T", description: "D", hashtags: ["vintage", "#90s"] },
      },
      "EUR",
    );
    expect(body.identification.brand).toBeNull();
    expect(body.identification.category).toBe("OTHER");
    expect(body.identification.era).toBe("UNKNOWN");
    expect(body.identification.condition).toBe("VERY_GOOD");
    expect(body.identification.brandConfidence).toBe(0.85);
    expect(body.identification.materials).toEqual([]);
    expect(body.price.low.minor).toBeLessThanOrEqual(body.price.mid.minor);
    expect(body.price.high.minor).toBeGreaterThanOrEqual(body.price.mid.minor);
    expect(body.price.perPlatform).toEqual([
      { platform: "VINTED", price: Money.of(45, "EUR"), daysToSell: 8 },
    ]);
    expect(body.market.trend).toBe("STABLE");
    expect(body.market.rarity).toBe(1);
    expect(body.advice.action).toBe("BUY");
    expect(body.advice.reasons).toEqual(["ok"]);
    expect(body.listingCopy?.hashtags).toEqual(["#vintage", "#90s"]);
  });

  it("sérialise puis reparse à l'identique", async () => {
    const d = await new FakeAppraiser().appraise(request({ wantListingCopy: true }));
    const json = JSON.parse(JSON.stringify(serializeAppraisalBody(d)));
    const back = parseAppraisalBody(json, "EUR");
    expect(back).toEqual({
      identification: d.identification,
      price: d.price,
      market: d.market,
      advice: d.advice,
      listingCopy: d.listingCopy,
    });
  });
});

describe("GeminiAppraiser", () => {
  const geminiReply = (text: string, extra: Record<string, unknown> = {}) =>
    jsonResponse({
      candidates: [{ content: { parts: [{ text }] }, finishReason: "STOP" }],
      modelVersion: "gemini-2.5-flash-001",
      ...extra,
    });

  it("appelle l'API REST avec le schéma dérivé et convertit la réponse JSON", async () => {
    const { fetch, calls } = fakeFetch([
      geminiReply(`\`\`\`json\n${JSON.stringify(validOutput())}\n\`\`\``),
    ]);
    const appraiser = new GeminiAppraiser({ apiKey: "k", model: "gemini-2.5-flash", fetch });
    const d = await appraiser.appraise(
      request({ wantListingCopy: true, hints: { brand: "Lacoste" } }),
    );
    const call = calls[0];
    expect(call?.url).toBe(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    expect(call?.headers["x-goog-api-key"]).toBe("k");
    const body = call?.body as {
      generationConfig: { responseMimeType: string; responseSchema: { type: string } };
      contents: Array<{ parts: Array<{ inlineData?: { mimeType: string } }> }>;
      systemInstruction: { parts: Array<{ text: string }> };
    };
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("OBJECT");
    expect(body.contents[0]?.parts[1]?.inlineData?.mimeType).toBe("image/jpeg");
    expect(body.systemInstruction.parts[0]?.text).toContain("French");
    expect(d.provider).toBe("gemini");
    expect(d.model).toBe("gemini-2.5-flash-001");
    expect(d.price.mid.minor).toBe(4550);
    expect(d.price.retailNew?.minor).toBe(15000);
    expect(d.advice.maxBuyPrice?.minor).toBe(1800);
    expect(d.listingCopy?.title).toContain("Lacoste");
  });

  it("convertit correctement une devise sans décimales (JPY)", async () => {
    const { fetch } = fakeFetch([geminiReply(JSON.stringify(validOutput()))]);
    const d = await new GeminiAppraiser({ apiKey: "k", fetch }).appraise(
      request({ currency: "JPY" }),
    );
    expect(d.price.mid.minor).toBe(46);
    expect(d.model).toBe("gemini-2.5-flash-001");
  });

  it("remonte des erreurs typées : 429, 5xx, 4xx, JSON invalide, hors schéma", async () => {
    const limited = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => new Response("nope", { status: 429 }),
    });
    await expect(limited.appraise(request())).rejects.toMatchObject({
      name: "AppraiserError",
      code: "RATE_LIMITED",
      retryable: true,
    });
    const down = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => new Response("nope", { status: 503 }),
    });
    await expect(down.appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
    const forbidden = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => new Response("nope", { status: 403 }),
    });
    await expect(forbidden.appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: false,
    });
    const bad = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => geminiReply("not json at all"),
    });
    await expect(bad.appraise(request())).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
    const partial = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => geminiReply(JSON.stringify({ identification: {} })),
    });
    await expect(partial.appraise(request())).rejects.toBeInstanceOf(AppraiserError);
    expect(parseJsonLoosely('Voici : {"a":1} merci')).toEqual({ a: 1 });
  });

  it("traduit un blocage de sécurité en REFUSED et une troncature en INVALID_OUTPUT", async () => {
    const blocked = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => jsonResponse({ promptFeedback: { blockReason: "SAFETY" } }),
    });
    await expect(blocked.appraise(request())).rejects.toMatchObject({
      code: "REFUSED",
      retryable: false,
    });
    const safety = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () => jsonResponse({ candidates: [{ finishReason: "SAFETY" }] }),
    });
    await expect(safety.appraise(request())).rejects.toMatchObject({ code: "REFUSED" });
    const truncated = new GeminiAppraiser({
      apiKey: "k",
      fetch: async () =>
        jsonResponse({
          candidates: [
            { content: { parts: [{ text: '{"identification":' }] }, finishReason: "MAX_TOKENS" },
          ],
        }),
    });
    await expect(truncated.appraise(request())).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
  });

  it("lève TIMEOUT quand l'API ne répond pas dans le délai", async () => {
    const slow = new GeminiAppraiser({ apiKey: "k", fetch: hangingFetch, timeoutMs: 30 });
    await expect(slow.appraise(request())).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
      provider: "gemini",
    });
  });
});

describe("createAppraiser", () => {
  it("choisit le faux sans clé et Gemini avec, derrière un routeur", () => {
    expect(createAppraiser({}).name).toBe("router(fake)");
    expect(createAppraiser({ GEMINI_API_KEY: "x" }).name).toBe("router(gemini,fake)");
    expect(createAppraiser({ GEMINI_API_KEY: "x", APPRAISER_DRIVER: "fake" }).name).toBe(
      "router(fake)",
    );
    expect(() => createAppraiser({ APPRAISER_DRIVER: "gemini" })).toThrow();
  });
});
