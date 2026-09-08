import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { config } from "./config";
import * as schema from "./schema";

// PostgreSQL connection pool using config
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  ssl: config.database.ssl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Export pool for direct access
export { pool };

// Test connection
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
