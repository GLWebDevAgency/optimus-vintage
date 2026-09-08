import { desc, eq, sql } from "drizzle-orm";
import { db, lots, type Lot, type NewLot } from "../postgres";

export const LotsRepository = {
  // CREATE
  async create(lotData: NewLot): Promise<Lot> {
    const result = await db.insert(lots).values(lotData).returning();
    return result[0];
  },

  // READ
  async getAll(): Promise<Lot[]> {
    return await db.select().from(lots).orderBy(desc(lots.buyDate));
  },

  async getById(id: number): Promise<Lot | undefined> {
    const result = await db.select().from(lots).where(eq(lots.id, id));
    return result[0];
  },

  // UPDATE
  async update(id: number, lotData: Partial<NewLot>): Promise<Lot | undefined> {
    const result = await db
      .update(lots)
      .set({ ...lotData, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(lots.id, id))
      .returning();
    return result[0];
  },

  // DELETE
  async delete(id: number): Promise<void> {
    await db.delete(lots).where(eq(lots.id, id));
  },

  // COUNT
  async count(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(lots);
    return Number(result[0]?.count || 0);
  },
};
