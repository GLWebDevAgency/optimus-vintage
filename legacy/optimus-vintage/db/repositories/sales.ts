import { desc, eq, sum } from "drizzle-orm";
import { db } from "../index";
import { items, sales } from "../schema";

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

  async getById(id: number) {
    const result = await db.select().from(sales).where(eq(sales.id, id));
    return result[0];
  },

  async getByLotId(lotId: number) {
    return await db.select().from(sales).where(eq(sales.lotId, lotId));
  },

  // UPDATE
  async update(id: number, saleData: Partial<NewSale>) {
    const result = await db
      .update(sales)
      .set(saleData)
      .where(eq(sales.id, id))
      .returning();
    return result[0];
  },

  // CANCEL - Sets status to CANCELLED and restores item to STOCK
  async cancel(id: number) {
    const sale = await this.getById(id);
    if (!sale) throw new Error("Sale not found");

    // Update sale status
    const updatedSale = await db
      .update(sales)
      .set({ status: "CANCELLED" })
      .where(eq(sales.id, id))
      .returning();

    // Restore item to stock if it was linked
    if (sale.itemId) {
      await db
        .update(items)
        .set({ status: "STOCK" })
        .where(eq(items.id, sale.itemId));
    }

    return updatedSale[0];
  },

  // DELETE
  async delete(id: number) {
    const result = await db.delete(sales).where(eq(sales.id, id)).returning();
    return result[0];
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
