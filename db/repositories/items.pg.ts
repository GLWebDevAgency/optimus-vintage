import { eq, sql } from "drizzle-orm";
import { db, items, type Item, type NewItem } from "../postgres";

export const ItemsRepository = {
  // CREATE
  async create(itemData: NewItem): Promise<Item> {
    const result = await db.insert(items).values(itemData).returning();
    return result[0];
  },

  async createBatch(itemsData: NewItem[]): Promise<Item[]> {
    if (itemsData.length === 0) return [];
    const result = await db.insert(items).values(itemsData).returning();
    return result;
  },

  // READ
  async getByLotId(lotId: number): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.lotId, lotId));
  },

  async getAllStock(): Promise<Item[]> {
    return await db.select().from(items).where(eq(items.status, "STOCK"));
  },

  async getById(id: number): Promise<Item | undefined> {
    const result = await db.select().from(items).where(eq(items.id, id));
    return result[0];
  },

  async getAll(): Promise<Item[]> {
    return await db.select().from(items);
  },

  // UPDATE
  async update(id: number, itemData: Partial<NewItem>): Promise<Item | undefined> {
    const result = await db
      .update(items)
      .set({ ...itemData, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(items.id, id))
      .returning();
    return result[0];
  },

  // Custom: Update Status
  async updateStatus(id: number, status: string): Promise<Item | undefined> {
    return await this.update(id, { status });
  },

  // DELETE
  async delete(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  },

  // COUNT
  async countByLotId(lotId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.lotId, lotId));
    return Number(result[0]?.count || 0);
  },

  async countByStatus(status: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(items)
      .where(eq(items.status, status));
    return Number(result[0]?.count || 0);
  },
};
