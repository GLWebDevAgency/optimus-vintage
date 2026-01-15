import { Lot, Sale } from "../../db/repositories";
import { computeLotSummary, computeProtection } from "./calculations";

// Mock Data
const mockLot: Lot = {
  id: 1,
  name: "Test Lot",
  provider: "Eureka",
  buyDate: "2025-01-01",
  type: "BULK",
  totalCost: 100,
  additionalFees: 0,
  initialQuantity: 10,
  currency: "EUR",
  createdAt: null,
  updatedAt: null,
};

describe("Calculation Engine", () => {
  describe("computeLotSummary", () => {
    it("should calculate initial state correctly (0 sales)", () => {
      const result = computeLotSummary(mockLot, [], []);

      expect(result.totalInvestment).toBe(100);
      expect(result.totalRevenue).toBe(0);
      expect(result.profit).toBe(-100);
      expect(result.delta).toBe(100);
      expect(result.remainingQuantity).toBe(10);
      expect(result.isBreakEven).toBe(false);
    });

    it("should calculate partial sales correctly", () => {
      const sales: Sale[] = [
        {
          id: 1,
          lotId: 1,
          itemId: 1,
          priceNet: 40,
          status: "COMPLETED",
          saleDate: "",
          platform: "V",
          priceGross: 50,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
        {
          id: 2,
          lotId: 1,
          itemId: 2,
          priceNet: 40,
          status: "COMPLETED",
          saleDate: "",
          platform: "V",
          priceGross: 50,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
      ];

      const result = computeLotSummary(mockLot, [], sales);

      expect(result.totalRevenue).toBe(80);
      expect(result.profit).toBe(-20); // 80 - 100
      expect(result.delta).toBe(20); // Need 20 more
      expect(result.soldQuantity).toBe(2);
      expect(result.remainingQuantity).toBe(8);
      expect(result.isBreakEven).toBe(false);
    });

    it("should handle break-even and profit", () => {
      const sales: Sale[] = [
        {
          id: 1,
          lotId: 1,
          itemId: 1,
          priceNet: 60,
          status: "COMPLETED",
          saleDate: "",
          platform: "V",
          priceGross: 0,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
        {
          id: 2,
          lotId: 1,
          itemId: 2,
          priceNet: 60,
          status: "COMPLETED",
          saleDate: "",
          platform: "V",
          priceGross: 0,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
      ];
      // Revenue = 120. Cost = 100. Profit = 20.

      const result = computeLotSummary(mockLot, [], sales);

      expect(result.totalRevenue).toBe(120);
      expect(result.profit).toBe(20);
      expect(result.delta).toBe(0); // No shortage
      expect(result.isBreakEven).toBe(true);
      expect(result.roiPercent).toBe(20); // (20/100)*100
    });

    it("should ignore cancelled sales", () => {
      const sales: Sale[] = [
        {
          id: 1,
          lotId: 1,
          itemId: 1,
          priceNet: 50,
          status: "COMPLETED",
          saleDate: "",
          platform: "V",
          priceGross: 0,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
        {
          id: 2,
          lotId: 1,
          itemId: 2,
          priceNet: 50,
          status: "CANCELLED",
          saleDate: "",
          platform: "V",
          priceGross: 0,
          platformFees: 0,
          shippingFees: 0,
          miscFees: 0,
          createdAt: null,
          updatedAt: null,
        },
      ];

      const result = computeLotSummary(mockLot, [], sales);
      expect(result.totalRevenue).toBe(50);
      expect(result.soldQuantity).toBe(1); // Only 1 valid sale
    });
  });

  describe("computeProtection", () => {
    it("should calculate floor price to break even", () => {
      // Delta 20, remaining 8 items
      const protection = computeProtection(20, 8);

      expect(protection.floorPriceBreakEven).toBe(2.5); // 20 / 8 = 2.5
    });

    it("should handle stock exhausted", () => {
      const protection = computeProtection(100, 0);
      expect(protection.floorPriceBreakEven).toBe(0);
      expect(protection.floorPriceMsg).toContain("Stock épuisé");
    });

    it("should return 0 floor price if already in profit (delta 0)", () => {
      const protection = computeProtection(0, 5);
      expect(protection.floorPriceBreakEven).toBe(0);
      expect(protection.floorPriceMsg).toContain("Lot rentabilisé");
    });
  });
});
