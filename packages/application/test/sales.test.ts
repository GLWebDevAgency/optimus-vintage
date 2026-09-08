import { InvalidTransition, unwrap } from "@chine/domain";
import { describe, expect, it } from "vitest";
import {
  CancelSale,
  ChangeItemStatus,
  CompletePendingSale,
  RecordSale,
  RefundSale,
  UpdateSale,
  UpdateWorkspaceSettings,
  ValidationFailed,
} from "../src/index.js";
import { chine, eur, expectErr, setup } from "./helpers.js";

describe("RecordSale", () => {
  it("calcule les frais depuis les surcharges de l'espace, marque la pièce vendue et clôture les annonces", async () => {
    const s = await setup();
    unwrap(
      await new UpdateWorkspaceSettings(s.deps).execute({
        ...s.scope,
        feeOverrides: { VINTED: { percent: 5, fixedMinor: 70 } },
      }),
    );
    const { item } = await chine(s, 20);
    unwrap(
      await new ChangeItemStatus(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        action: "LIST",
        platform: "VINTED",
        price: eur(75),
      }),
    );
    const r = unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(75),
        shippingCost: eur(4.95),
        packagingCost: eur(0.4),
        buyer: "marie_92",
      }),
    );
    expect(r.sale.platformFees.minor).toBe(445); // 5 % de 75 € + 0,70 €
    expect(r.sale.economics.net.minor).toBe(7500 - 445 - 495 - 40);
    expect(r.sale.economics.margin.minor).toBe(7500 - 445 - 495 - 40 - 2000);
    expect(r.sale.status).toBe("COMPLETED");
    expect(r.item.status).toBe("SOLD");
    expect(r.item.soldAt).not.toBeNull();
    const listings = await s.deps.listings.byItem(s.scope.workspaceId, item.id);
    expect(listings.map((l) => l.status)).toEqual(["SOLD"]);
    const sold = s.deps.events.ofType("ItemSold");
    expect(sold).toHaveLength(1);
    expect(sold[0]?.net.minor).toBe(6520);
  });

  it("refuse une pièce non vendable et une devise étrangère", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(30),
      }),
    );
    expect(
      expectErr(
        await new RecordSale(s.deps).execute({
          ...s.scope,
          itemId: item.id,
          platform: "VINTED",
          grossPrice: eur(30),
        }),
        ValidationFailed,
      ).details,
    ).toMatchObject({ status: "SOLD" });
    const other = await chine(s, 5);
    expectErr(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: other.item.id,
        platform: "VINTED",
        grossPrice: { minor: 3000, currency: "USD" },
      }),
      ValidationFailed,
    );
  });

  it("une vente PENDING réserve la pièce ; CompletePendingSale la vend", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const pending = unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "LEBONCOIN",
        grossPrice: eur(40),
        status: "PENDING",
      }),
    );
    expect(pending.item.status).toBe("RESERVED");
    expect(s.deps.events.ofType("ItemSold")).toHaveLength(0);
    const done = unwrap(
      await new CompletePendingSale(s.deps).execute({ ...s.scope, saleId: pending.sale.id }),
    );
    expect(done.sale.status).toBe("COMPLETED");
    expect(done.item.status).toBe("SOLD");
    expect(s.deps.events.ofType("ItemSold")).toHaveLength(1);
  });
});

describe("Cancel / Refund / Update", () => {
  it("RefundSale rembourse et fait revenir la pièce en RETURNED", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const sale = unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(75),
      }),
    ).sale;
    const r = unwrap(await new RefundSale(s.deps).execute({ ...s.scope, saleId: sale.id }));
    expect(r.sale.status).toBe("REFUNDED");
    expect(r.sale.refundedAt).not.toBeNull();
    expect(r.item.status).toBe("RETURNED");
    expect(r.item.isSellable).toBe(true);
    expect(r.item.soldAt).toBeNull();
    expect(s.deps.events.ofType("SaleRefunded")).toHaveLength(1);
    expectErr(
      await new RefundSale(s.deps).execute({ ...s.scope, saleId: sale.id }),
      InvalidTransition,
    );
  });

  it("CancelSale remet la pièce en stock", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const sale = unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(75),
      }),
    ).sale;
    const r = unwrap(await new CancelSale(s.deps).execute({ ...s.scope, saleId: sale.id }));
    expect(r.sale.status).toBe("CANCELLED");
    expect(r.item.status).toBe("IN_STOCK");
    expect(s.deps.events.ofType("SaleCancelled")).toHaveLength(1);
  });

  it("UpdateSale recalcule les frais quand la plateforme change", async () => {
    const s = await setup();
    const { item } = await chine(s, 20);
    const sale = unwrap(
      await new RecordSale(s.deps).execute({
        ...s.scope,
        itemId: item.id,
        platform: "VINTED",
        grossPrice: eur(75),
      }),
    ).sale;
    expect(sale.platformFees.minor).toBe(0);
    const r = unwrap(
      await new UpdateSale(s.deps).execute({ ...s.scope, saleId: sale.id, platform: "VESTIAIRE" }),
    );
    expect(r.sale.platformFees.minor).toBe(1500); // 15 % plancher 15 €
    const manual = unwrap(
      await new UpdateSale(s.deps).execute({
        ...s.scope,
        saleId: sale.id,
        grossPrice: eur(80),
        platformFees: eur(1),
      }),
    );
    expect(manual.sale.platformFees.minor).toBe(100);
  });
});
