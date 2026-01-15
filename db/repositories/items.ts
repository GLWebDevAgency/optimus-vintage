import { eq } from "drizzle-orm";
import { db } from "../index";
import { items } from "../schema";

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;

export const ItemsRepository = {
  // CREATE
  async create(itemData: NewItem) {
    const result = await db.insert(items).values(itemData).returning();
    return result[0];
  },

  async createBatch(itemsData: NewItem[]) {
    // Drizzle/SQLite supports batch insert
    const result = await db.insert(items).values(itemsData).returning();
    return result;
  },

  // READ
  async getByLotId(lotId: number) {
    return await db.select().from(items).where(eq(items.lotId, lotId));
  },

  async getAllStock() {
    return await db.select().from(items).where(eq(items.status, "STOCK"));
  },

  async getById(id: number) {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0];
  },

  // UPDATE
  async update(id: number, itemData: Partial<NewItem>) {
    const result = await db
      .update(items)
      .set(itemData)
      .where(eq(items.id, id))
      .returning();
    return result[0];
  },

  // Custom: Update Status
  async updateStatus(id: number, status: string) {
    return await this.update(id, { status });
  },
};
