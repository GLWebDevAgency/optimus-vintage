import type { ItemDto, UploadTargetDto } from "@chine/contract";
import { asUserId, asWorkspaceId } from "@chine/domain";
import { authSchema, LocalPhotoStorage } from "@chine/infrastructure";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GET as exportAccount } from "@/app/api/v1/account/export/route";
import { DELETE as deleteAccount } from "@/app/api/v1/account/route";
import { POST as createItem } from "@/app/api/v1/items/route";
import { PUT as uploadPhoto } from "@/app/api/v1/photos/upload/[...key]/route";
import { POST as prepareUpload } from "@/app/api/v1/uploads/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, eur } from "../helpers/http";

type D<T> = { data: T };

/** Plus petit PNG valide (1×1, transparent). */
const PNG_1x1 = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64",
  ),
);

describe("compte : export et suppression RGPD", () => {
  let app: TestApp;
  let photoKey: string;

  beforeAll(async () => {
    app = await createTestApp();
    const target = await api<D<UploadTargetDto>>(prepareUpload, "POST", "/api/v1/uploads", {
      body: { mimeType: "image/png" },
    });
    photoKey = target.data.key;
    const up = await api(uploadPhoto, "PUT", target.data.uploadUrl, {
      params: { key: photoKey.split("/") },
      rawBody: PNG_1x1,
    });
    expect(up.status).toBe(200);
    const item = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: {
        mode: "quickCapture",
        pricePaid: eur(1_000),
        supplierKind: "FLEA_MARKET",
        photoKeys: [photoKey],
        title: "Chemise Ralph Lauren",
      },
    });
    expect(item.status).toBe(201);
  });
  afterAll(() => app.close());

  it("l'export contient la pièce et la source, en téléchargement", async () => {
    const res = await api<D<{ items: unknown[]; sources: unknown[] }>>(
      exportAccount,
      "GET",
      "/api/v1/account/export",
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(res.data.items).toHaveLength(1);
    expect(res.data.sources).toHaveLength(1);
  });

  it("exige le mot de confirmation exact", async () => {
    const res = await api(deleteAccount, "DELETE", "/api/v1/account", {
      body: { confirm: "supprimer" },
    });
    expect(res.status).toBe(400);
    expect(await app.deps.workspaces.byOwner(asUserId(app.user.id))).toBeDefined();
  });

  it("supprime l'espace, les photos, l'utilisateur et ses sessions", async () => {
    const res = await api<D<{ userId: string; deleted: true; deletedWorkspaceIds: string[] }>>(
      deleteAccount,
      "DELETE",
      "/api/v1/account",
      { body: { confirm: "SUPPRIMER" } },
    );
    expect(res.status).toBe(200);
    expect(res.data.deleted).toBe(true);
    expect(res.data.deletedWorkspaceIds).toEqual([app.workspaceId]);

    const { deps } = app;
    expect(await deps.workspaces.byId(asWorkspaceId(app.workspaceId))).toBeUndefined();
    expect(await deps.items.count(asWorkspaceId(app.workspaceId))).toBe(0);
    expect(await deps.sources.list(asWorkspaceId(app.workspaceId))).toHaveLength(0);
    expect(
      await deps.database.db
        .select()
        .from(authSchema.user)
        .where(eq(authSchema.user.id, app.user.id)),
    ).toHaveLength(0);
    expect(
      await deps.database.db
        .select()
        .from(authSchema.session)
        .where(eq(authSchema.session.userId, app.user.id)),
    ).toHaveLength(0);
    if (!(deps.photos instanceof LocalPhotoStorage)) throw new Error("stockage local attendu");
    expect(await deps.photos.read(photoKey)).toBeUndefined();
  });

  it("après suppression, la session résiduelle recrée un espace vide plutôt que d'échouer", async () => {
    // La session simulée subsiste : l'API repart d'un espace neuf (aucune donnée restaurée).
    const res = await api<D<{ items: unknown[] }>>(exportAccount, "GET", "/api/v1/account/export");
    expect(res.status).toBe(200);
    expect(res.data.items).toHaveLength(0);
  });
});
