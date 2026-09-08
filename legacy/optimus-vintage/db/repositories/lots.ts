import { desc, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { lots } from "../schema";

export type Lot = typeof lots.$inferSelect;
export type NewLot = typeof lots.$inferInsert;

export const LotsRepository = {
  // CREATE
  async create(lotData: NewLot) {
    const result = await db.insert(lots).values(lotData).returning();
    return result[0];
  },

  // READ
  async getAll() {
    return await db.select().from(lots).orderBy(desc(lots.buyDate));
  },

  async getById(id: number) {
    const result = await db.select().from(lots).where(eq(lots.id, id));
    return result[0];
  },

  // UPDATE
  async update(id: number, lotData: Partial<NewLot>) {
    const result = await db
      .update(lots)
      .set({ ...lotData, updatedAt: sql`CURRENT_TIMESTAMP` })
      .where(eq(lots.id, id))
      .returning();
    return result[0];
  },

  // DELETE
  async delete(id: number) {
    // Basic delete, might need cascade if we don't rely on DB FK constraints
    await db.delete(lots).where(eq(lots.id, id));
  },
};
