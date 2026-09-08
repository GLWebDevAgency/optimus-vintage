import { describe, expect, it } from "vitest";
import { Item, Money, asItemId, asSourceId, asWorkspaceId, asPhotoId, formatSku, unwrap } from "../src/index.js";

const now = new Date("2026-09-07T10:00:00Z");
const make = () => unwrap(Item.create({
  id: asItemId("i1"), workspaceId: asWorkspaceId("w1"), sourceId: asSourceId("s1"), sku: "CH-0142",
  title: "Ensemble Lacoste", brand: "Lacoste", category: "TRACKSUIT", condition: "EXCELLENT",
  acquisitionCost: Money.of(20, "EUR"), retailPrice: Money.of(250, "EUR"), targetPrice: Money.of(75, "EUR"), now,
}));

describe("Item", () => {
  it("naît en stock avec un événement ItemCreated", () => {
    const item = make();
    expect(item.status).toBe("IN_STOCK");
    expect(item.pullEvents().map((e) => e.type)).toEqual(["ItemCreated"]);
  });
  it("calcule la décote face au neuf : 20 → 75 vs 250 = −70 %", () => {
    expect(make().discountVsRetail()).toBeCloseTo(0.7, 5);
  });
  it("suit la machine à états", () => {
    const item = make();
    expect(item.markListed("VINTED", now).ok).toBe(true);
    expect(item.markSold(now).ok).toBe(true);
    expect(item.markListed("VINTED", now).ok).toBe(false);
    expect(item.markReturned(now).ok).toBe(true);
    expect(item.status).toBe("RETURNED");
    expect(item.restock(now).ok).toBe(true);
    expect(item.writeOff("DONATED", now).ok).toBe(true);
    expect(item.restock(now).ok).toBe(false);
  });
  it("refuse un SKU mal formé et valide formatSku", () => {
    expect(formatSku("CH", 7)).toBe("CH-0007");
    const bad = Item.create({ id: asItemId("x"), workspaceId: asWorkspaceId("w"), sourceId: asSourceId("s"), sku: "nope", title: "t", category: "OTHER", condition: "GOOD", acquisitionCost: Money.zero("EUR"), now });
    expect(bad.ok).toBe(false);
  });
  it("détecte le stock dormant et limite les photos", () => {
    const item = make();
    expect(item.isDormant(new Date("2026-10-20T00:00:00Z"))).toBe(true);
    expect(item.isDormant(new Date("2026-09-10T00:00:00Z"))).toBe(false);
    for (let i = 0; i < 8; i++) expect(item.addPhoto({ id: asPhotoId(`p${i}`), key: `k${i}` }, now).ok).toBe(true);
    expect(item.addPhoto({ id: asPhotoId("p9"), key: "k9" }, now).ok).toBe(false);
  });
});
