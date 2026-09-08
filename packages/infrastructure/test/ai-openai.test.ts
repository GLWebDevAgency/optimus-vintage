import { describe, expect, it } from "vitest";
import { OpenAIAppraiser } from "../src/ai/OpenAIAppraiser.js";
import { fakeFetch, hangingFetch, jsonResponse, request, validOutput } from "./ai-fixtures.js";

const responses = (over: Record<string, unknown> = {}) =>
  jsonResponse({
    id: "resp_1",
    object: "response",
    status: "completed",
    model: "gpt-6-astra-2026-09",
    output: [
      { type: "reasoning", summary: [] },
      {
        type: "message",
        role: "assistant",
        content: [{ type: "output_text", text: JSON.stringify(validOutput()) }],
      },
    ],
    ...over,
  });

const make = (
  fetch: ConstructorParameters<typeof OpenAIAppraiser>[0]["fetch"],
  timeoutMs?: number,
) => new OpenAIAppraiser({ apiKey: "sk-openai", model: "gpt-6-astra", fetch, timeoutMs });

describe("OpenAIAppraiser", () => {
  it("exige un modèle explicite", () => {
    expect(() => new OpenAIAppraiser({ apiKey: "k", model: "  " })).toThrow(
      expect.objectContaining({ code: "NOT_CONFIGURED" }),
    );
  });

  it("appelle l'API Responses avec image, schéma strict et convertit la réponse", async () => {
    const { fetch, calls } = fakeFetch([responses()]);
    const d = await make(fetch).appraise(request({ wantListingCopy: true, locale: "de" }));

    const call = calls[0];
    expect(call?.url).toBe("https://api.openai.com/v1/responses");
    expect(call?.headers["authorization"]).toBe("Bearer sk-openai");
    expect(call?.body).toMatchObject({
      model: "gpt-6-astra",
      max_output_tokens: expect.any(Number),
      text: { format: { type: "json_schema", name: "appraisal", strict: true } },
    });
    const input = call?.body["input"] as Array<{
      role: string;
      content: Array<Record<string, unknown>>;
    }>;
    expect(input[0]?.content[0]).toEqual({
      type: "input_image",
      image_url: "data:image/jpeg;base64,AA==",
      detail: "high",
    });
    expect(input[0]?.content[1]).toMatchObject({ type: "input_text" });
    expect(String(call?.body["instructions"])).toContain("in German");
    const text = call?.body["text"] as { format: { schema: Record<string, unknown> } } | undefined;
    expect(text?.format.schema["additionalProperties"]).toBe(false);

    expect(d.provider).toBe("openai");
    expect(d.model).toBe("gpt-6-astra-2026-09");
    expect(d.price.mid.minor).toBe(4550);
    expect(d.price.high.minor).toBe(6500);
    expect(d.advice.maxBuyPrice?.minor).toBe(1800);
    expect(d.listingCopy?.title).toContain("Lacoste");
  });

  it("lit `output_text` quand il est présent et respecte JPY", async () => {
    const { fetch } = fakeFetch([
      responses({ output: [], output_text: JSON.stringify(validOutput()) }),
    ]);
    const d = await make(fetch).appraise(request({ currency: "JPY" }));
    expect(d.price.mid.minor).toBe(46);
    expect(d.price.perPlatform[1]?.price.minor).toBe(59);
    expect(d.listingCopy).toBeNull();
  });

  it("traduit un refus (partie `refusal` ou filtre de contenu) en REFUSED", async () => {
    const refusal = fakeFetch([
      responses({
        output: [{ type: "message", content: [{ type: "refusal", refusal: "Je ne peux pas." }] }],
      }),
    ]);
    await expect(make(refusal.fetch).appraise(request())).rejects.toMatchObject({
      code: "REFUSED",
      retryable: false,
    });
    const filtered = fakeFetch([
      responses({ status: "incomplete", incomplete_details: { reason: "content_filter" } }),
    ]);
    await expect(make(filtered.fetch).appraise(request())).rejects.toMatchObject({
      code: "REFUSED",
    });
  });

  it("traduit une réponse incomplète ou hors schéma en INVALID_OUTPUT", async () => {
    const truncated = fakeFetch([
      responses({ status: "incomplete", incomplete_details: { reason: "max_output_tokens" } }),
    ]);
    await expect(make(truncated.fetch).appraise(request())).rejects.toMatchObject({
      code: "INVALID_OUTPUT",
      details: { reason: "max_output_tokens" },
    });
    const bad = fakeFetch([
      responses({ output: [{ type: "message", content: [{ type: "output_text", text: "{}" }] }] }),
    ]);
    await expect(make(bad.fetch).appraise(request())).rejects.toMatchObject({
      code: "INVALID_OUTPUT",
    });
    const empty = fakeFetch([responses({ output: [] })]);
    await expect(make(empty.fetch).appraise(request())).rejects.toMatchObject({
      code: "INVALID_OUTPUT",
    });
  });

  it("traduit 429 en RATE_LIMITED, 401/400 en UPSTREAM_ERROR non réessayable, 5xx réessayable", async () => {
    const limited = fakeFetch([jsonResponse({ error: { message: "slow down" } }, 429)]);
    await expect(make(limited.fetch).appraise(request())).rejects.toMatchObject({
      code: "RATE_LIMITED",
      retryable: true,
    });
    const auth = fakeFetch([jsonResponse({ error: { message: "bad key" } }, 401)]);
    await expect(make(auth.fetch).appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: false,
      details: { status: 401 },
    });
    const bad = fakeFetch([jsonResponse({ error: { message: "bad schema" } }, 400)]);
    await expect(make(bad.fetch).appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: false,
    });
    const down = fakeFetch([new Response("gateway", { status: 502 })]);
    await expect(make(down.fetch).appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
  });

  it("traduit une panne réseau en UPSTREAM_ERROR réessayable et un blocage en TIMEOUT", async () => {
    const network = make(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(network.appraise(request())).rejects.toMatchObject({
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
    await expect(make(hangingFetch, 30).appraise(request())).rejects.toMatchObject({
      code: "TIMEOUT",
      provider: "openai",
    });
  });
});
