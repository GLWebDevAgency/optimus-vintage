import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { DATABASE_CONFIG } from "./config";
import * as schema from "./schema/postgres";

// Create PostgreSQL connection pool
const pool = new Pool({
  host: DATABASE_CONFIG.host,
  port: DATABASE_CONFIG.port,
  user: DATABASE_CONFIG.user,
  password: DATABASE_CONFIG.password,
  database: DATABASE_CONFIG.database,
  ssl: DATABASE_CONFIG.ssl ? { rejectUnauthorized: false } : false,
  max: 10, // Maximum connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Initialize Drizzle ORM with PostgreSQL
export const db = drizzle(pool, { schema });

// Export pool for direct access if needed
export { pool };

// Re-export schema types
    export * from "./schema/postgres";

// Helper to test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    console.log("✅ PostgreSQL connection successful");
    return true;
  } catch (error) {
    console.error("❌ PostgreSQL connection failed:", error);
    return false;
  }
};

// Helper to close connection pool (for app cleanup)
export const closeConnection = async (): Promise<void> => {
  await pool.end();
  console.log("PostgreSQL connection pool closed");
};
