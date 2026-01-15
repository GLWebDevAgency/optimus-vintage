import { desc, eq, sql, sum } from "drizzle-orm";
import { db, sales, type NewSale, type Sale } from "../postgres";

export const SalesRepository = {
  // CREATE
  async create(saleData: NewSale): Promise<Sale> {
    const result = await db.insert(sales).values(saleData).returning();
    return result[0];
  },

  // READ
  async getAll(): Promise<Sale[]> {
    return await db.select().from(sales).orderBy(desc(sales.saleDate));
  },

  async getByLotId(lotId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.lotId, lotId));
  },

  async getById(id: number): Promise<Sale | undefined> {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0];
  },

  // Analytics Helpers
  async getTotalRevenue(): Promise<number> {
    const result = await db
      .select({
        total: sum(sales.priceNet),
      })
      .from(sales);
    return Number(result[0]?.total || 0);
  },

  async getTotalRevenueByLotId(lotId: number): Promise<number> {
    const result = await db
      .select({
        total: sum(sales.priceNet),
      })
      .from(sales)
      .where(eq(sales.lotId, lotId));
    return Number(result[0]?.total || 0);
  },

  // COUNT
  async count(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(sales);
    return Number(result[0]?.count || 0);
  },

  async countByLotId(lotId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(sales)
      .where(eq(sales.lotId, lotId));
    return Number(result[0]?.count || 0);
  },

  // DELETE
  async delete(id: number): Promise<void> {
    await db.delete(sales).where(eq(sales.id, id));
  },
};
