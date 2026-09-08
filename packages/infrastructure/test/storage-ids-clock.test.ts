import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { asWorkspaceId } from "@chine/domain";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FixedClock, SystemClock } from "../src/clock.js";
import { isUuid, UuidV7Generator, uuidV7Timestamp } from "../src/ids.js";
import { createPhotoStorage, isSafeKey } from "../src/storage/index.js";
import { LocalPhotoStorage } from "../src/storage/LocalPhotoStorage.js";

describe("LocalPhotoStorage", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "chine-uploads-"));
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it("cible d'upload proxifiée, écriture, lecture, URL publique, suppression", async () => {
    const storage = new LocalPhotoStorage({ dataDir: dir });
    const ws = asWorkspaceId("11111111-1111-7111-8111-111111111111");
    const target = await storage.createUploadTarget(ws, "image/webp");
    expect(target.method).toBe("PUT");
    expect(target.key).toMatch(new RegExp(`^${ws}/[0-9a-f-]{36}\\.webp$`));
    expect(target.uploadUrl).toBe(`/api/v1/photos/upload/${target.key}`);
    expect(target.headers).toEqual({ "Content-Type": "image/webp" });

    const bytes = new Uint8Array([82, 73, 70, 70, 0, 1, 2, 3]);
    await storage.put(target.key, bytes, "image/webp");
    const read = await storage.read(target.key);
    expect(read?.mimeType).toBe("image/webp");
    expect(Array.from(read?.bytes ?? [])).toEqual(Array.from(bytes));
    expect(storage.publicUrl(target.key)).toBe(`/api/v1/photos/${target.key}`);

    await storage.delete(target.key);
    expect(await storage.read(target.key)).toBeUndefined();
  });

  it("refuse les clés dangereuses et les types inconnus", async () => {
    const storage = new LocalPhotoStorage({ dataDir: dir });
    await expect(storage.put("../etc/passwd", new Uint8Array(), "image/png")).rejects.toThrow(
      /Clé/,
    );
    expect(() => storage.publicUrl("/abs/path.png")).toThrow();
    expect(isSafeKey("ws/photo.jpg")).toBe(true);
    expect(isSafeKey("ws/../photo.jpg")).toBe(false);
    await expect(
      storage.createUploadTarget(asWorkspaceId("ws"), "application/pdf"),
    ).rejects.toThrow(/pris en charge/);
  });
});

describe("createPhotoStorage", () => {
  it("local par défaut, R2 quand tout est configuré", () => {
    expect(createPhotoStorage({}).publicUrl("a/b.jpg")).toBe("/api/v1/photos/a/b.jpg");
    const r2 = createPhotoStorage({
      R2_ACCOUNT_ID: "acc",
      R2_ACCESS_KEY_ID: "k",
      R2_SECRET_ACCESS_KEY: "s",
      R2_BUCKET: "chine-photos",
      R2_PUBLIC_BASE_URL: "https://photos.chine.app/",
    });
    expect(r2.publicUrl("a/b.jpg")).toBe("https://photos.chine.app/a/b.jpg");
    expect(
      createPhotoStorage({ STORAGE_DRIVER: "local", R2_ACCOUNT_ID: "acc" }).publicUrl("x.png"),
    ).toBe("/api/v1/photos/x.png");
    expect(() => createPhotoStorage({ STORAGE_DRIVER: "r2" })).toThrow();
  });
});

describe("UuidV7Generator", () => {
  it("produit des UUID v7 valides, uniques et triables", () => {
    const gen = new UuidV7Generator();
    const ids = Array.from({ length: 2000 }, () => gen.next());
    expect(ids.every(isUuid)).toBe(true);
    expect(ids.every((id) => id[14] === "7")).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });

  it("encode l'horodatage", () => {
    const at = Date.parse("2026-09-08T10:00:00.000Z");
    const gen = new UuidV7Generator(() => at);
    const id = gen.next();
    expect(uuidV7Timestamp(id)).toBe(at);
    expect(uuidV7Timestamp("not-a-uuid")).toBeUndefined();
    // Même milliseconde : la séquence garantit l'ordre.
    const next = gen.next();
    expect(next > id).toBe(true);
  });
});

describe("horloges", () => {
  it("SystemClock renvoie l'heure courante, FixedClock est pilotable", () => {
    const before = Date.now();
    expect(new SystemClock().now().getTime()).toBeGreaterThanOrEqual(before);
    const fixed = new FixedClock(new Date("2026-01-01T00:00:00Z"));
    fixed.advance(60_000);
    expect(fixed.now().toISOString()).toBe("2026-01-01T00:01:00.000Z");
  });
});
