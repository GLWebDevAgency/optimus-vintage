import { describe, expect, it } from "vitest";
import { AnthropicAppraiser } from "../src/ai/AnthropicAppraiser.js";
import { AppraiserError } from "../src/ai/core.js";
import { fakeFetch, hangingFetch, jsonResponse, request, validOutput } from "./ai-fixtures.js";

const message = (over: Record<string, unknown> = {}) =>
  jsonResponse({
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: "claude-fable-5-1",
    content: [{ type: "text", text: JSON.stringify(validOutput()) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 20 },
    ...over,
  });

const apiError = (status: number, type: string, headers: Record<string, string> = {}) =>
  jsonResponse({ type: "error", error: { type, message: `${status}` } }, status, headers);

describe("AnthropicAppraiser", () => {
  it("envoie image + prompt en sortie structurée et convertit la réponse", async () => {
    const { fetch, calls } = fakeFetch([message()]);
    const appraiser = new AnthropicAppraiser({ apiKey: "sk-test", fetch, effort: "medium" });
    const d = await appraiser.appraise(
      request({ wantListingCopy: true, currency: "EUR", locale: "en" }),
    );

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toMatch(/^https:\/\/api\.anthropic\.com\/v1\/messages/);
    expect(call?.headers["x-api-key"]).toBe("sk-test");
    expect(call?.headers["anthropic-beta"]).toContain("server-side-fallback-2026-07-01");
    expect(call?.body).toMatchObject({
      model: "claude-sonnet-5",
      max_tokens: 16000,
      fallbacks: "default",
      output_config: { effort: "medium", format: { type: "json_schema" } },
    });
    expect(call?.body["thinking"]).toBeUndefined();
    expect(call?.body["temperature"]).toBeUndefined();
    const messages = call?.body["messages"] as Array<{ role: string; content: unknown[] }>;
    expect(messages).toHaveLength(1);
    expect(messages[0]?.content[0]).toEqual({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: "AA==" },
    });
    expect(String(call?.body["system"])).toContain("in English");

    expect(d.provider).toBe("anthropic");
    expect(d.model).toBe("claude-fable-5-1");
    expect(d.tokens).toEqual({ input: 10, output: 20 });
    expect(d.credits).toBe(1);
    expect(d.price.mid.minor).toBe(4550);
    expect(d.price.mid.currency).toBe("EUR");
    expect(d.identification.category).toBe("TRACKSUIT");
    expect(d.listingCopy?.title).toContain("Lacoste");
    expect(d.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("enregistre le modèle réellement servi (repli côté serveur) et gère JPY", async () => {
    const { fetch } = fakeFetch([message({ model: "claude-opus-5" })]);
    const d = await new AnthropicAppraiser({ apiKey: "k", fetch }).appraise(
      request({ currency: "JPY" }),
    );
    expect(d.model).toBe("claude-opus-5");
    expect(d.price.mid.minor).toBe(46);
    expect(d.listingCopy).toBeNull();
  });

  it("traduit un refus en REFUSED (non réessayable)", async () => {
    const { fetch } = fakeFetch([
      message({
        content: [],
        stop_reason: "refusal",
        stop_details: { type: "refusal", category: "cyber", explanation: "…" },
      }),
    ]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch }).appraise(request()),
    ).rejects.toMatchObject({
      code: "REFUSED",
      retryable: false,
      details: { category: "cyber" },
    });
  });

  it("traduit une sortie tronquée ou hors schéma en INVALID_OUTPUT", async () => {
    const truncated = fakeFetch([message({ stop_reason: "max_tokens" })]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch: truncated.fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "INVALID_OUTPUT" });

    const bad = fakeFetch([message({ content: [{ type: "text", text: '{"price":{}}' }] })]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch: bad.fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "INVALID_OUTPUT", retryable: false });

    const notJson = fakeFetch([message({ content: [{ type: "text", text: "nope" }] })]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch: notJson.fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "INVALID_OUTPUT" });
  });

  it("traduit 429 en RATE_LIMITED après la relance unique du SDK", async () => {
    const { fetch, calls } = fakeFetch([
      apiError(429, "rate_limit_error", { "retry-after-ms": "1" }),
      apiError(429, "rate_limit_error", { "retry-after-ms": "1" }),
    ]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "RATE_LIMITED", retryable: true });
    expect(calls).toHaveLength(2);
  });

  it("traduit 401 / 400 en UPSTREAM_ERROR non réessayable", async () => {
    const auth = fakeFetch([apiError(401, "authentication_error")]);
    await expect(
      new AnthropicAppraiser({ apiKey: "bad", fetch: auth.fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "UPSTREAM_ERROR", retryable: false });
    const bad = fakeFetch([apiError(400, "invalid_request_error")]);
    const err = await new AnthropicAppraiser({ apiKey: "k", fetch: bad.fetch })
      .appraise(request())
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppraiserError);
    expect((err as AppraiserError).details?.["status"]).toBe(400);
  });

  it("traduit 529 (surcharge) en UPSTREAM_ERROR réessayable", async () => {
    const { fetch } = fakeFetch([
      apiError(529, "overloaded_error", { "retry-after-ms": "1" }),
      apiError(529, "overloaded_error", { "retry-after-ms": "1" }),
    ]);
    await expect(
      new AnthropicAppraiser({ apiKey: "k", fetch }).appraise(request()),
    ).rejects.toMatchObject({ code: "UPSTREAM_ERROR", retryable: true });
  });

  it("lève TIMEOUT quand le transport ne répond pas", async () => {
    const appraiser = new AnthropicAppraiser({ apiKey: "k", fetch: hangingFetch, timeoutMs: 40 });
    await expect(appraiser.appraise(request())).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
      provider: "anthropic",
    });
  });
});
