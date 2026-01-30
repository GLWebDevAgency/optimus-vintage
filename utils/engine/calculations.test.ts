/**
 * 🧪 CALCULATION ENGINE TESTS - EXTENDED
 *
 * Comprehensive tests for the financial calculation engine
 */

import { Lot, Sale } from "@/db/repositories";
import { computeLotSummary, computeProtection } from "./calculations";

// ═══════════════════════════════════════════════════════════════════════════════
// 📦 MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════════

const createMockLot = (overrides?: Partial<Lot>): Lot => ({
  id: 1,
  name: "Test Lot",
  provider: "Eureka",
  buyDate: "2025-01-01",
  type: "BULK",
  totalCost: "100",
  additionalFees: "0",
  initialQuantity: 10,
  currency: "EUR",
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

const createMockSale = (overrides?: Partial<Sale>): Sale => ({
  id: 1,
  lotId: 1,
  itemId: 1,
  platform: "VINTED",
  priceGross: "50",
  platformFees: "5",
  shippingFees: "5",
  miscFees: "0",
  priceNet: "40",
  saleDate: "2025-01-15",
  status: "COMPLETED",
  createdAt: null,
  updatedAt: null,
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// 🧪 TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe("Calculation Engine - Extended", () => {
  describe("computeLotSummary", () => {
    describe("Initial State (0 sales)", () => {
      it("should return correct initial values with no sales", () => {
        const lot = createMockLot();
        const result = computeLotSummary(lot, [], []);

        expect(result.totalInvestment).toBe(100);
        expect(result.totalRevenue).toBe(0);
        expect(result.profit).toBe(-100);
        expect(result.delta).toBe(100);
        expect(result.remainingQuantity).toBe(10);
        expect(result.isBreakEven).toBe(false);
        expect(result.roiPercent).toBe(-100);
      });

      it("should include additional fees in investment", () => {
        const lot = createMockLot({ totalCost: "100", additionalFees: "25" });
        const result = computeLotSummary(lot, [], []);

        expect(result.totalInvestment).toBe(125);
        expect(result.delta).toBe(125);
      });

      it("should handle string numeric values from PostgreSQL", () => {
        const lot = createMockLot({
          totalCost: "150.50" as unknown as string,
          additionalFees: "10.25" as unknown as string,
        });
        const result = computeLotSummary(lot, [], []);

        expect(result.totalInvestment).toBeCloseTo(160.75, 2);
      });
    });

    describe("Partial Sales", () => {
      it("should calculate revenue from completed sales", () => {
        const lot = createMockLot();
        const sales = [
          createMockSale({ id: 1, priceNet: "30" }),
          createMockSale({ id: 2, priceNet: "25", itemId: 2 }),
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalRevenue).toBe(55);
        expect(result.profit).toBe(-45);
        expect(result.soldQuantity).toBe(2);
        expect(result.remainingQuantity).toBe(8);
      });

      it("should calculate correct delta when not profitable", () => {
        const lot = createMockLot();
        const sales = [createMockSale({ priceNet: "40" })];

        const result = computeLotSummary(lot, [], sales);

        expect(result.delta).toBe(60); // 100 - 40 = 60 remaining needed
        expect(result.isBreakEven).toBe(false);
      });
    });

    describe("Break-Even and Profit", () => {
      it("should recognize break-even state", () => {
        const lot = createMockLot();
        const sales = [
          createMockSale({ id: 1, priceNet: "50" }),
          createMockSale({ id: 2, priceNet: "50", itemId: 2 }),
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalRevenue).toBe(100);
        expect(result.profit).toBe(0);
        expect(result.delta).toBe(0);
        expect(result.isBreakEven).toBe(true);
      });

      it("should calculate positive profit correctly", () => {
        const lot = createMockLot();
        const sales = [
          createMockSale({ id: 1, priceNet: "60" }),
          createMockSale({ id: 2, priceNet: "60", itemId: 2 }),
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalRevenue).toBe(120);
        expect(result.profit).toBe(20);
        expect(result.delta).toBe(0);
        expect(result.isBreakEven).toBe(true);
        expect(result.roiPercent).toBe(20);
      });

      it("should calculate ROI percentage correctly", () => {
        const lot = createMockLot({ totalCost: "200" });
        const sales = [createMockSale({ priceNet: "300" })];

        const result = computeLotSummary(lot, [], sales);

        expect(result.roiPercent).toBe(50); // (300-200)/200 * 100
      });
    });

    describe("Sale Status Handling", () => {
      it("should ignore cancelled sales", () => {
        const lot = createMockLot();
        const sales = [
          createMockSale({ id: 1, priceNet: "40", status: "COMPLETED" }),
          createMockSale({
            id: 2,
            priceNet: "40",
            status: "CANCELLED",
            itemId: 2,
          }),
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalRevenue).toBe(40);
        expect(result.soldQuantity).toBe(1);
      });

      it("should ignore refunded sales", () => {
        const lot = createMockLot();
        const sales = [
          createMockSale({ id: 1, priceNet: "40", status: "COMPLETED" }),
          createMockSale({
            id: 2,
            priceNet: "40",
            status: "REFUNDED",
            itemId: 2,
          }),
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalRevenue).toBe(40);
        expect(result.soldQuantity).toBe(1);
      });

      it("should count pending sales as valid", () => {
        const lot = createMockLot();
        const sales = [createMockSale({ status: "PENDING", priceNet: "40" })];

        const result = computeLotSummary(lot, [], sales);

        // Pending sales should probably not count - check business logic
        // For now, testing current behavior
        expect(result.soldQuantity).toBe(1);
      });
    });

    describe("Edge Cases", () => {
      it("should handle zero investment (gift lot)", () => {
        const lot = createMockLot({ totalCost: "0", additionalFees: "0" });
        const sales = [createMockSale({ priceNet: "50" })];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalInvestment).toBe(0);
        expect(result.profit).toBe(50);
        expect(result.roiPercent).toBe(0); // Guard against division by zero
      });

      it("should handle negative remaining quantity gracefully", () => {
        const lot = createMockLot({ initialQuantity: 2 });
        const sales = [
          createMockSale({ id: 1, priceNet: "20" }),
          createMockSale({ id: 2, priceNet: "20", itemId: 2 }),
          createMockSale({ id: 3, priceNet: "20", itemId: 3 }), // More sales than items
        ];

        const result = computeLotSummary(lot, [], sales);

        expect(result.remainingQuantity).toBe(0); // Should not go negative
      });

      it("should handle very large numbers", () => {
        const lot = createMockLot({ totalCost: "999999.99" });
        const sales = [createMockSale({ priceNet: "500000.00" })];

        const result = computeLotSummary(lot, [], sales);

        expect(result.totalInvestment).toBeCloseTo(999999.99, 2);
        expect(result.profit).toBeCloseTo(-499999.99, 2);
      });
    });
  });

  describe("computeProtection", () => {
    it("should calculate floor price for break-even", () => {
      const result = computeProtection(100, 5, 0);

      expect(result.floorPriceBreakEven).toBe(20); // 100 / 5 = 20
    });

    it("should calculate floor price with margin", () => {
      const result = computeProtection(100, 5, 10);

      expect(result.floorPriceMargin10).toBe(22); // (100 + 10) / 5 = 22
    });

    it("should handle zero remaining quantity", () => {
      const result = computeProtection(100, 0, 0);

      // Should not divide by zero
      expect(result.floorPriceBreakEven).toBe(0);
      expect(result.floorPriceMargin10).toBe(0);
    });

    it("should return zero floor price if already profitable", () => {
      const result = computeProtection(0, 5, 0);

      expect(result.floorPriceBreakEven).toBe(0);
    });

    it("should provide human-readable message", () => {
      const result = computeProtection(100, 5, 0);

      expect(result.floorPriceMsg).toBeDefined();
      expect(typeof result.floorPriceMsg).toBe("string");
    });
  });
});
