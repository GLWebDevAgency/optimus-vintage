import type { ItemDto, UploadTargetDto } from "@chine/contract";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DELETE as removePhoto } from "@/app/api/v1/items/[id]/photos/[photoId]/route";
import { PUT as reorderPhotos } from "@/app/api/v1/items/[id]/photos/order/route";
import { POST as addPhoto } from "@/app/api/v1/items/[id]/photos/route";
import { POST as createItem } from "@/app/api/v1/items/route";
import { GET as readPhoto } from "@/app/api/v1/photos/[...key]/route";
import { PUT as uploadPhoto } from "@/app/api/v1/photos/upload/[...key]/route";
import { POST as prepareUpload } from "@/app/api/v1/uploads/route";
import { createTestApp, type TestApp } from "../helpers/app";
import { api, eur, ORIGIN } from "../helpers/http";

type D<T> = { data: T };
type Uploaded = { key: string; url: string; width: number; height: number; bytes: number };

async function jpeg(width: number, height: number): Promise<Uint8Array> {
  const buf = await sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 40, b: 60 } },
  })
    .jpeg({ quality: 90 })
    .withExifMerge({ IFD0: { Artist: "Test", ImageDescription: "gps" } })
    .toBuffer();
  return new Uint8Array(buf);
}

describe("photos : upload local normalisé, lecture, rattachement", () => {
  let app: TestApp;
  let target: UploadTargetDto;
  let itemId: string;

  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(() => app.close());

  it("prépare un upload local : clé .webp de l'espace, URL absolues", async () => {
    const res = await api<D<UploadTargetDto>>(prepareUpload, "POST", "/api/v1/uploads", {
      body: { mimeType: "image/jpeg", purpose: "item-photo" },
    });
    expect(res.status).toBe(201);
    target = res.data;
    expect(target.key.startsWith(`${app.workspaceId}/`)).toBe(true);
    expect(target.key.endsWith(".webp")).toBe(true);
    expect(target.method).toBe("PUT");
    expect(target.uploadUrl).toBe(`${ORIGIN}/api/v1/photos/upload/${target.key}`);
    expect(target.publicUrl).toBe(`${ORIGIN}/api/v1/photos/${target.key}`);
    expect(target.headers?.["Content-Type"]).toBe("image/jpeg");
  });

  it("refuse un fichier qui n'est pas une image (415) et un fichier vide (400)", async () => {
    const params = { key: target.key.split("/") };
    const text = await api(uploadPhoto, "PUT", target.uploadUrl, {
      params,
      rawBody: "ceci n'est pas une image, juste du texte assez long",
      headers: { "content-type": "image/jpeg" },
    });
    expect(text.status).toBe(415);
    expect(text.error?.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    const empty = await api(uploadPhoto, "PUT", target.uploadUrl, {
      params,
      rawBody: new Uint8Array(0),
    });
    expect(empty.status).toBe(400);
  });

  it("refuse une clé d'un autre espace (400) et un corps trop lourd (413)", async () => {
    const foreign = ["00000000-0000-7000-8000-000000000000", "photo.webp"];
    const res = await api(uploadPhoto, "PUT", `/api/v1/photos/upload/${foreign.join("/")}`, {
      params: { key: foreign },
      rawBody: await jpeg(8, 8),
    });
    expect(res.status).toBe(400);
    const huge = await api(uploadPhoto, "PUT", target.uploadUrl, {
      params: { key: target.key.split("/") },
      rawBody: await jpeg(8, 8),
      headers: { "content-length": String(20 * 1024 * 1024) },
    });
    expect(huge.status).toBe(413);
  });

  it("stocke une vraie photo : orientée, sans EXIF, 2048 px max, WebP", async () => {
    const res = await api<D<Uploaded>, { key: string[] }>(uploadPhoto, "PUT", target.uploadUrl, {
      params: { key: target.key.split("/") },
      rawBody: await jpeg(3000, 1500),
      headers: { "content-type": "image/jpeg" },
    });
    expect(res.status).toBe(200);
    expect(res.data).toMatchObject({ key: target.key, width: 2048, height: 1024 });
    expect(res.data.url).toBe(target.publicUrl);

    const read = await readPhoto(new Request(`${ORIGIN}/api/v1/photos/${target.key}`) as never, {
      params: Promise.resolve({ key: target.key.split("/") }),
    });
    expect(read.status).toBe(200);
    expect(read.headers.get("Content-Type")).toBe("image/webp");
    expect(read.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    const bytes = Buffer.from(await read.arrayBuffer());
    const meta = await sharp(bytes).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(2048);
    expect(meta.exif).toBeUndefined();
  });

  it("404 pour une clé inconnue ou mal formée", async () => {
    const unknown = await readPhoto(new Request(`${ORIGIN}/api/v1/photos/a/b.webp`) as never, {
      params: Promise.resolve({ key: ["a", "b.webp"] }),
    });
    expect(unknown.status).toBe(404);
    const traversal = await readPhoto(new Request(`${ORIGIN}/api/v1/photos/x`) as never, {
      params: Promise.resolve({ key: ["..", "..", "etc", "passwd"] }),
    });
    expect(traversal.status).toBe(404);
  });

  it("rattache la photo à une pièce, la réordonne, puis la retire (fichier supprimé)", async () => {
    const created = await api<D<ItemDto>>(createItem, "POST", "/api/v1/items", {
      body: {
        mode: "quickCapture",
        pricePaid: eur(500),
        supplierKind: "THRIFT_STORE",
        photoKeys: [target.key],
        title: "Veste en jean",
      },
    });
    expect(created.status).toBe(201);
    itemId = created.data.id;
    expect(created.data.photos).toHaveLength(1);
    expect(created.data.photoUrls[0]).toBe(target.publicUrl);

    const second = await api<D<UploadTargetDto>>(prepareUpload, "POST", "/api/v1/uploads", {
      body: { mimeType: "image/png" },
    });
    await api(uploadPhoto, "PUT", second.data.uploadUrl, {
      params: { key: second.data.key.split("/") },
      rawBody: await jpeg(64, 64),
    });
    const added = await api<D<ItemDto>, { id: string }>(
      addPhoto,
      "POST",
      `/api/v1/items/${itemId}/photos`,
      {
        params: { id: itemId },
        body: { key: second.data.key, width: 64, height: 64 },
      },
    );
    expect(added.status).toBe(201);
    expect(added.data.photos).toHaveLength(2);

    const [first, last] = added.data.photos;
    if (!first || !last) throw new Error("deux photos attendues");
    const reordered = await api<D<ItemDto>, { id: string }>(
      reorderPhotos,
      "PUT",
      `/api/v1/items/${itemId}/photos/order`,
      { params: { id: itemId }, body: { photoIds: [last.id, first.id] } },
    );
    expect(reordered.status).toBe(200);
    expect(reordered.data.photos[0]?.id).toBe(last.id);

    const removed = await api<D<ItemDto>, { id: string; photoId: string }>(
      removePhoto,
      "DELETE",
      `/api/v1/items/${itemId}/photos/${first.id}`,
      { params: { id: itemId, photoId: first.id } },
    );
    expect(removed.status).toBe(200);
    expect(removed.data.photos.map((p) => p.id)).toEqual([last.id]);
    const gone = await readPhoto(new Request(`${ORIGIN}/api/v1/photos/${target.key}`) as never, {
      params: Promise.resolve({ key: target.key.split("/") }),
    });
    expect(gone.status).toBe(404);
  });

  it("refuse une neuvième photo (409 PHOTO_LIMIT)", async () => {
    for (let i = 0; i < 7; i++) {
      const t = await api<D<UploadTargetDto>>(prepareUpload, "POST", "/api/v1/uploads", {
        body: { mimeType: "image/jpeg" },
      });
      const res = await api(addPhoto, "POST", `/api/v1/items/${itemId}/photos`, {
        params: { id: itemId },
        body: { key: t.data.key },
      });
      expect(res.status).toBe(201);
    }
    const t = await api<D<UploadTargetDto>>(prepareUpload, "POST", "/api/v1/uploads", {
      body: { mimeType: "image/jpeg" },
    });
    const res = await api(addPhoto, "POST", `/api/v1/items/${itemId}/photos`, {
      params: { id: itemId },
      body: { key: t.data.key },
    });
    expect(res.status).toBe(409);
    expect(res.error?.code).toBe("PHOTO_LIMIT");
  });
});
