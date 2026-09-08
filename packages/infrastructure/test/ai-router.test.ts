import { describe, expect, it } from "vitest";
import { type AppraiserAttempt, AppraiserRouter } from "../src/ai/AppraiserRouter.js";
import { AppraiserError, type AppraiserErrorCode } from "../src/ai/core.js";
import { FakeAppraiser } from "../src/ai/FakeAppraiser.js";
import { createAppraiser, describeAppraiser, resolveAppraiserPlan } from "../src/ai/index.js";
import type { AppraisalDraft, AppraisalRequest, Appraiser } from "../src/ports.js";
import { request } from "./ai-fixtures.js";

/** Fournisseur de test : échoue avec un code donné, ou répond comme le faux expert. */
function stub(
  name: string,
  behaviour: AppraiserErrorCode | "ok" | "hang" | "crash",
  options: { retryable?: boolean; model?: string } = {},
): Appraiser & { model: string; calls: number } {
  const fake = new FakeAppraiser();
  return {
    name,
    model: options.model ?? `${name}-model`,
    calls: 0,
    async appraise(req: AppraisalRequest): Promise<AppraisalDraft> {
      this.calls += 1;
      if (behaviour === "ok") return { ...(await fake.appraise(req)), provider: name };
      if (behaviour === "hang") return new Promise<never>(() => undefined);
      if (behaviour === "crash") throw new Error("bug inattendu");
      throw new AppraiserError(behaviour, `${name} : ${behaviour}`, {
        retryable: options.retryable,
        provider: name,
      });
    },
  };
}

describe("AppraiserRouter", () => {
  it("s'arrête au premier succès et journalise la tentative", async () => {
    const attempts: AppraiserAttempt[] = [];
    const first = stub("anthropic", "ok");
    const second = stub("gemini", "ok");
    const router = new AppraiserRouter({
      providers: [first, second],
      onAttempt: (a) => attempts.push(a),
    });
    const d = await router.appraise(request());
    expect(d.provider).toBe("anthropic");
    expect(second.calls).toBe(0);
    expect(router.name).toBe("router(anthropic,gemini)");
    expect(attempts).toEqual([
      expect.objectContaining({ provider: "anthropic", model: "anthropic-model", ok: true }),
    ]);
  });

  it("bascule dans l'ordre sur délai, quota, refus et sortie hors schéma", async () => {
    const attempts: AppraiserAttempt[] = [];
    const router = new AppraiserRouter({
      providers: [
        stub("anthropic", "TIMEOUT"),
        stub("gemini", "RATE_LIMITED"),
        stub("openai", "REFUSED"),
        stub("mistral", "INVALID_OUTPUT"),
        stub("fake", "ok"),
      ],
      onAttempt: (a) => attempts.push(a),
    });
    const d = await router.appraise(request());
    expect(d.provider).toBe("fake");
    expect(attempts.map((a) => [a.provider, a.ok, a.code])).toEqual([
      ["anthropic", false, "TIMEOUT"],
      ["gemini", false, "RATE_LIMITED"],
      ["openai", false, "REFUSED"],
      ["mistral", false, "INVALID_OUTPUT"],
      ["fake", true, undefined],
    ]);
  });

  it("bascule aussi sur une panne amont réessayable ou une exception inattendue", async () => {
    const router = new AppraiserRouter({
      providers: [
        stub("a", "UPSTREAM_ERROR", { retryable: true }),
        stub("b", "crash"),
        stub("c", "ok"),
      ],
    });
    await expect(router.appraise(request())).resolves.toMatchObject({ provider: "c" });
  });

  it("interrompt la chaîne sur une erreur non réessayable (clé invalide) en joignant les tentatives", async () => {
    const last = stub("gemini", "ok");
    const router = new AppraiserRouter({
      providers: [stub("anthropic", "UPSTREAM_ERROR", { retryable: false }), last],
    });
    const err = await router.appraise(request()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppraiserError);
    expect(err).toMatchObject({ code: "UPSTREAM_ERROR", retryable: false, provider: "anthropic" });
    expect((err as AppraiserError).details?.["attempts"]).toHaveLength(1);
    expect(last.calls).toBe(0);
  });

  it("lève UPSTREAM_ERROR avec les causes quand tous échouent", async () => {
    const router = new AppraiserRouter({
      providers: [stub("anthropic", "TIMEOUT"), stub("gemini", "INVALID_OUTPUT")],
    });
    const err = await router.appraise(request()).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppraiserError);
    const typed = err as AppraiserError;
    expect(typed.code).toBe("UPSTREAM_ERROR");
    expect(typed.message).toContain("anthropic=TIMEOUT");
    expect(typed.message).toContain("gemini=INVALID_OUTPUT");
    expect(typed.details?.["attempts"]).toEqual([
      expect.objectContaining({ provider: "anthropic", code: "TIMEOUT" }),
      expect.objectContaining({ provider: "gemini", code: "INVALID_OUTPUT" }),
    ]);
  });

  it("applique le délai par tentative et passe au suivant", async () => {
    const attempts: AppraiserAttempt[] = [];
    const router = new AppraiserRouter({
      providers: [stub("anthropic", "hang"), stub("gemini", "ok")],
      timeoutMs: 30,
      onAttempt: (a) => attempts.push(a),
    });
    await expect(router.appraise(request())).resolves.toMatchObject({ provider: "gemini" });
    expect(attempts[0]).toMatchObject({ provider: "anthropic", ok: false, code: "TIMEOUT" });
  });

  it("lève NOT_CONFIGURED sans fournisseur et décrit sa chaîne", async () => {
    const empty = new AppraiserRouter({ providers: [] });
    expect(empty.describe()).toEqual({ chain: [], fake: false });
    await expect(empty.appraise(request())).rejects.toMatchObject({ code: "NOT_CONFIGURED" });

    const router = new AppraiserRouter({
      providers: [stub("anthropic", "ok", { model: "claude-fable-5-1" }), new FakeAppraiser()],
    });
    expect(router.describe()).toEqual({
      chain: [
        { provider: "anthropic", model: "claude-fable-5-1" },
        { provider: "fake", model: "fake-lacoste-v1" },
      ],
      fake: true,
    });
  });

  it("ne laisse pas un journal défaillant faire échouer l'expertise", async () => {
    const router = new AppraiserRouter({
      providers: [stub("a", "ok")],
      onAttempt: () => {
        throw new Error("logger cassé");
      },
    });
    await expect(router.appraise(request())).resolves.toMatchObject({ provider: "a" });
  });
});

describe("createAppraiser / describeAppraiser", () => {
  it("`auto` retient les fournisseurs configurés dans l'ordre, puis le faux hors production", () => {
    expect(describeAppraiser({})).toEqual({
      chain: [{ provider: "fake", model: "fake-lacoste-v1" }],
      fake: true,
    });
    const all = describeAppraiser({
      OPENAI_API_KEY: "o",
      OPENAI_MODEL: "gpt-6-astra",
      GEMINI_API_KEY: "g",
      ANTHROPIC_API_KEY: "a",
      ANTHROPIC_MODEL: "claude-opus-5",
    });
    expect(all.chain.map((c) => c.provider)).toEqual(["anthropic", "gemini", "openai", "fake"]);
    expect(all.chain[0]?.model).toBe("claude-opus-5");
    expect(all.chain[1]?.model).toBe("gemini-2.5-flash");
    expect(all.chain[2]?.model).toBe("gpt-6-astra");
  });

  it("ignore OpenAI sans OPENAI_MODEL en mode auto et l'exige en mode explicite", () => {
    expect(describeAppraiser({ OPENAI_API_KEY: "o" }).chain.map((c) => c.provider)).toEqual([
      "fake",
    ]);
    expect(() => describeAppraiser({ OPENAI_API_KEY: "o", APPRAISER_DRIVER: "openai" })).toThrow(
      /OPENAI_MODEL/,
    );
  });

  it("refuse le faux en production sauf s'il est nommé explicitement", () => {
    const prod = { NODE_ENV: "production" };
    expect(describeAppraiser(prod)).toEqual({ chain: [], fake: false });
    expect(describeAppraiser({ ...prod, GEMINI_API_KEY: "g" }).chain).toEqual([
      { provider: "gemini", model: "gemini-2.5-flash" },
    ]);
    expect(describeAppraiser({ ...prod, APPRAISER_DRIVER: "fake" }).fake).toBe(true);
    expect(describeAppraiser({ ...prod, APPRAISER_DRIVER: "auto,fake" }).fake).toBe(true);
    const router = createAppraiser(prod);
    expect(router.name).toBe("router()");
  });

  it("respecte une liste explicite, dédoublonnée, et lève sans clé ou sur un nom inconnu", () => {
    const env = {
      ANTHROPIC_API_KEY: "a",
      GEMINI_API_KEY: "g",
      APPRAISER_DRIVER: "gemini, anthropic ,gemini",
    };
    const router = createAppraiser(env);
    expect(router.name).toBe("router(gemini,anthropic)");
    expect(router.describe().chain.map((c) => c.provider)).toEqual(["gemini", "anthropic"]);
    expect(() => createAppraiser({ APPRAISER_DRIVER: "gemini" })).toThrow(
      expect.objectContaining({ code: "NOT_CONFIGURED" }),
    );
    expect(() => createAppraiser({ APPRAISER_DRIVER: "mistral" })).toThrow(/inconnu/);
  });

  it("lit le délai et l'effort depuis l'environnement, avec des défauts sûrs", () => {
    expect(resolveAppraiserPlan({ APPRAISER_TIMEOUT_MS: "12000" }).timeoutMs).toBe(12000);
    expect(resolveAppraiserPlan({ APPRAISER_TIMEOUT_MS: "abc" }).timeoutMs).toBe(45000);
    const router = createAppraiser({ ANTHROPIC_API_KEY: "a", ANTHROPIC_EFFORT: "xhigh" });
    const anthropic = router.providers[0] as { effort?: string };
    expect(anthropic.effort).toBe("xhigh");
    const fallback = createAppraiser({ ANTHROPIC_API_KEY: "a", ANTHROPIC_EFFORT: "turbo" });
    expect((fallback.providers[0] as { effort?: string }).effort).toBe("low");
  });

  it("injecte le transport dans toute la chaîne", async () => {
    let calls = 0;
    const router = createAppraiser(
      { GEMINI_API_KEY: "g", APPRAISER_DRIVER: "gemini,fake", APPRAISER_TIMEOUT_MS: "500" },
      {
        fetch: async () => {
          calls += 1;
          return new Response("boom", { status: 503 });
        },
      },
    );
    const d = await router.appraise(request());
    expect(calls).toBe(1);
    expect(d.provider).toBe("fake");
  });
});
