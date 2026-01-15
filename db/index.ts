import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DATABASE_NAME = "optimus_vintage.db";

// Ensure the database is opened synchronously
const expoDb = openDatabaseSync(DATABASE_NAME);

// Initialize Drizzle ORM
export const db = drizzle(expoDb, { schema });

// Helper to reset DB (dev only)
export const resetDatabase = async () => {
  // In a real app we might drop tables using raw SQL if needed,
  // or just delete the file. For now, we rely on Drizzle migrations
  // or manual sync if we add that later.
  // For MVP/Proto, we can just drop tables:
  await expoDb.execAsync(`
        DROP TABLE IF EXISTS sales;
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS lots;
    `);
  // Re-create is handled by the migration/init logic we will write next.
};
