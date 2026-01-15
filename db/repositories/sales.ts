import { desc, eq, sum } from "drizzle-orm";
import { db } from "../index";
import { sales } from "../schema";

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;

export const SalesRepository = {
  // CREATE
  async create(saleData: NewSale) {
    const result = await db.insert(sales).values(saleData).returning();
    return result[0];
  },

  // READ
  async getAll() {
    return await db.select().from(sales).orderBy(desc(sales.saleDate));
  },

  async getByLotId(lotId: number) {
    return await db.select().from(sales).where(eq(sales.lotId, lotId));
  },

  // Analytics Helpers
  async getTotalRevenue() {
    const result = await db
      .select({
        total: sum(sales.priceNet),
      })
      .from(sales);
    return result[0]?.total || 0;
  },
};
