import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DrizzleRateLimiter, rateLimitKey } from "../src/security/rate-limit.js";
import { type TestDb, testDb } from "./helpers.js";

describe("DrizzleRateLimiter", () => {
  let t: TestDb;
  let current = new Date("2026-09-08T10:00:00.000Z");
  const now = () => current;
  beforeAll(async () => {
    t = await testDb();
  });
  afterAll(() => t.close());

  it("autorise jusqu'à la limite, refuse ensuite, puis réinitialise à l'expiration", async () => {
    const limiter = new DrizzleRateLimiter(t.database.db, { now });
    const key = rateLimitKey("login", "ip", "1.2.3.4");
    const first = await limiter.hit(key, 3, 60);
    expect(first).toEqual({
      allowed: true,
      remaining: 2,
      resetAt: new Date("2026-09-08T10:01:00.000Z"),
    });
    expect((await limiter.hit(key, 3, 60)).remaining).toBe(1);
    expect((await limiter.hit(key, 3, 60)).remaining).toBe(0);
    const fourth = await limiter.hit(key, 3, 60);
    expect(fourth.allowed).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.resetAt).toEqual(first.resetAt);

    current = new Date("2026-09-08T10:00:59.000Z");
    expect((await limiter.hit(key, 3, 60)).allowed).toBe(false);

    current = new Date("2026-09-08T10:01:00.000Z");
    const reset = await limiter.hit(key, 3, 60);
    expect(reset).toEqual({
      allowed: true,
      remaining: 2,
      resetAt: new Date("2026-09-08T10:02:00.000Z"),
    });
  });

  it("clés indépendantes et appels concurrents comptés exactement", async () => {
    const limiter = new DrizzleRateLimiter(t.database.db, { now });
    const results = await Promise.all(
      Array.from({ length: 20 }, () => limiter.hit("burst", 10, 60)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(10);
    expect(results.filter((r) => !r.allowed)).toHaveLength(10);
    expect((await limiter.hit("autre", 10, 60)).remaining).toBe(9);
    expect((await limiter.hit("zero", 0, 60)).allowed).toBe(false);
    await expect(limiter.hit("x", -1, 60)).rejects.toBeInstanceOf(RangeError);
    await expect(limiter.hit("x", 1, 0)).rejects.toBeInstanceOf(RangeError);
  });

  it("purgeExpired supprime les vieilles fenêtres seulement", async () => {
    const limiter = new DrizzleRateLimiter(t.database.db, { now });
    current = new Date("2026-09-08T10:05:00.000Z");
    await limiter.hit("recent", 5, 60);
    current = new Date("2026-09-10T10:05:00.000Z");
    const purged = await limiter.purgeExpired(86_400);
    expect(purged).toBeGreaterThanOrEqual(4); // login…, burst, autre, zero, x n'existe pas
    await limiter.hit("recent", 5, 60);
    expect(await limiter.purgeExpired(86_400)).toBe(0);
    expect(rateLimitKey("Login", " IP ", "1.2.3.4/x")).toBe("login:ip:1.2.3.4_x");
  });
});
