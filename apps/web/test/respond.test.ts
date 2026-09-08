import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiFailure, fail, ok, statusFor } from "@/lib/api/respond";

describe("respond", () => {
  it("enveloppe les succès dans { data }", async () => {
    const res = ok({ status: "ok" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { status: "ok" } });
  });

  it("mappe les codes métier vers les statuts HTTP", () => {
    expect(statusFor("NOT_FOUND")).toBe(404);
    expect(statusFor("FORBIDDEN")).toBe(403);
    expect(statusFor("QUOTA_EXCEEDED")).toBe(402);
    expect(statusFor("FEATURE_LOCKED")).toBe(402);
    expect(statusFor("VALIDATION_FAILED")).toBe(400);
    expect(statusFor("INVALID_TRANSITION")).toBe(409);
    expect(statusFor("WHATEVER")).toBe(500);
  });

  it("sérialise une erreur { code, message, details }", async () => {
    const res = fail(new ApiFailure("NOT_FOUND", "Pièce introuvable.", { id: "x" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({
      error: { code: "NOT_FOUND", message: "Pièce introuvable.", details: { id: "x" } },
    });
  });

  it("convertit une ZodError en 400 VALIDATION_FAILED", async () => {
    const parsed = z.object({ price: z.number() }).safeParse({ price: "x" });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const res = fail(parsed.error);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string; details: unknown } };
    expect(body.error.code).toBe("VALIDATION_FAILED");
    expect(body.error.details).toBeDefined();
  });

  it("ne fuit jamais une erreur inconnue", async () => {
    const res = fail(new Error("secret stack"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "Erreur interne." },
    });
  });
});
