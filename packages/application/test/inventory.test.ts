import { asItemId, asPhotoId, unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  AddItemPhoto,
  AppraiseImage,
  ChangeItemStatus,
  Conflict,
  CreateItem,
  DeleteItem,
  Forbidden,
  NotFound,
  RecordSale,
  RemoveItemPhoto,
  ReorderItemPhotos,
  UpdateItem,
  ValidationFailed,
} from "../src/index.js";
import { chine, createLot, eur, expectErr, intruder, setup } from "./helpers.js";

describe("CreateItem", () => {
  it("« Chiner » : la capture rapide crée une source UNIT à la volée et attribue un SKU", async () => {
    const s = await setup();
    const r = await chine(s, 20, {
      photos: [{ key: "ws/photo.jpg", width: 800, height: 600 }],
      quickCapture: { pricePaid: eur(20), location: { label: "Brocante de Lille" } },
    });
    expect(r.source).toMatchObject({
      kind: "UNIT",
      supplierKind: "FLEA_MARKET",
      purchasedAt: "2026-09-08",
      announcedQuantity: 1,
      location: { label: "Brocante de Lille" },
    });
    expect(r.source.goodsCost.minor).toBe(2000);
    expect(r.item).toMatchObject({
      sku: "CH-0001",
      status: "IN_STOCK",
      sourceId: r.source.id,
      acquisitionCost: { minor: 2000, currency: "EUR" },
    });
    expect(r.item.coverUrl).toBe("memory://photos/ws/photo.jpg");
    expect(s.deps.events.ofType("ItemCreated")).toHaveLength(1);
  });

  it("rattache une pièce à un lot existant avec le coût unitaire moyen par défaut", async () => {
    const s = await setup();
    const lot = await createLot(s, { goods: 100, extra: 10, quantity: 10 });
    const r = unwrap(
      await new CreateItem(s.deps).execute({
        ...s.scope,
        sourceId: lot.id,
        title: "Jean Levi's 501",
        category: "JEANS",
        condition: "GOOD",
      }),
    );
    expect(r.item.acquisitionCost.minor).toBe(1100);
    expect(r.source.id).toBe(lot.id);
  });

  it("préremplit depuis une expertise IA et lie l'expertise à la pièce", async () => {
    const s = await setup({ plan: "PREMIUM" });
    const a = unwrap(
      await new AppraiseImage(s.deps).execute({
        ...s.scope,
        imageBase64: "AAAA",
        mimeType: "image/jpeg",
      }),
    );
    const r = unwrap(
      await new CreateItem(s.deps).execute({
        ...s.scope,
        appraisalId: a.appraisal.id,
        quickCapture: { pricePaid: eur(20) },
      }),
    );
    expect(r.item).toMatchObject({
      brand: "Lacoste",
      category: "TRACKSUIT",
      condition: "VERY_GOOD",
      era: "1990s",
      size: "L",
    });
    expect(r.item.retailPrice?.minor).toBe(25000);
    expect(r.item.targetPrice?.minor).toBe(7500);
    expect(r.item.discountVsRetail).toBeCloseTo(0.7);
    expect((await s.deps.appraisals.latestForItem(s.scope.workspaceId, r.item.id))?.id).toBe(
      a.appraisal.id,
    );
  });

  it("exige une source ou une capture rapide, et refuse un acteur étranger", async () => {
    const s = await setup();
    expectErr(await new CreateItem(s.deps).execute({ ...s.scope, title: "x" }), ValidationFailed);
    expectErr(
      await new CreateItem(s.deps).execute({
        ...s.scope,
        ...intruder,
        title: "x",
        quickCapture: { pricePaid: eur(1) },
      }),
      Forbidden,
    );
  });
});

describe("UpdateItem / ChangeItemStatus", () => {
  it("met à jour les prix et calcule la décote face au neuf", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const r = unwrap(
      await new UpdateItem(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        retailPrice: eur(250),
        targetPrice: eur(75),
        size: "L",
      }),
    );
    expect(r.item.discountVsRetail).toBeCloseTo(0.7);
    expect(r.item.size).toBe("L");
  });

  it("LIST crée une annonce, UNLIST la clôture, WRITE_OFF sort la pièce du stock", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const uc = new ChangeItemStatus(s.deps);
    const listed = unwrap(
      await uc.execute({
        ...s.scope,
        itemId: item.id,
        action: "LIST",
        platform: "VINTED",
        price: eur(75),
      }),
    );
    expect(listed.item.status).toBe("LISTED");
    expect(listed.listing).toMatchObject({
      platform: "VINTED",
      status: "ACTIVE",
      price: { minor: 7500 },
    });
    expect(s.deps.events.ofType("ItemListed")).toHaveLength(1);
    const unlisted = unwrap(await uc.execute({ ...s.scope, itemId: item.id, action: "UNLIST" }));
    expect(unlisted.item.status).toBe("IN_STOCK");
    expect((await s.deps.listings.byItem(s.scope.workspaceId, item.id))[0]?.status).toBe("ENDED");
    const off = unwrap(
      await uc.execute({ ...s.scope, itemId: item.id, action: "WRITE_OFF", reason: "DONATED" }),
    );
    expect(off.item.status).toBe("DONATED");
    expect(off.item.isSellable).toBe(false);
    expectErr(await uc.execute({ ...s.scope, itemId: item.id, action: "RESTOCK" }), Object);
  });
});

describe("Photos / DeleteItem", () => {
  it("ajoute, réordonne et retire des photos (le fichier est supprimé du stockage)", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    await s.deps.photos.put("k1", new Uint8Array([1]), "image/jpeg");
    await s.deps.photos.put("k2", new Uint8Array([2]), "image/jpeg");
    const p1 = unwrap(
      await new AddItemPhoto(s.deps).execute({ ...s.scope, itemId: item.id, key: "k1" }),
    );
    const p2 = unwrap(
      await new AddItemPhoto(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        key: "k2",
        blurhash: "LKO2",
      }),
    );
    expect(p2.item.photos.map((p) => p.key)).toEqual(["k1", "k2"]);
    const re = unwrap(
      await new ReorderItemPhotos(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        photoIds: [asPhotoId(p2.photo.id)],
      }),
    );
    expect(re.item.coverUrl).toBe("memory://photos/k2");
    const rm = unwrap(
      await new RemoveItemPhoto(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        photoId: asPhotoId(p1.photo.id),
      }),
    );
    expect(rm.item.photos).toHaveLength(1);
    expect(s.deps.photos.objects.has("k1")).toBe(false);
    expect(s.deps.photos.objects.has("k2")).toBe(true);
  });

  it("refuse la suppression d'une pièce vendue, accepte sinon", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(75),
      }),
    );
    expect(
      expectErr(await new DeleteItem(s.deps).execute({ ...s.scope, itemId: item.id }), Conflict)
        .details,
    ).toMatchObject({ reason: "HAS_SALES" });
    const other = await chine(s, 5);
    unwrap(await new DeleteItem(s.deps).execute({ ...s.scope, itemId: other.item.id }));
    expect(await s.deps.items.byId(s.scope.workspaceId, other.item.id)).toBeUndefined();
    expectErr(
      await new DeleteItem(s.deps).execute({ ...s.scope, itemId: asItemId("ghost") }),
      NotFound,
    );
  });
});
