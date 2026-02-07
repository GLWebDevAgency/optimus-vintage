/**
 * 🗃️ Drizzle Kit Configuration
 *
 * Configuration for database migrations and schema management.
 *
 * Usage:
 *   npx drizzle-kit generate   → Generate migration SQL from schema changes
 *   npx drizzle-kit migrate    → Apply pending migrations to the database
 *   npx drizzle-kit push       → Push schema changes directly (dev only)
 *   npx drizzle-kit studio     → Open Drizzle Studio (visual DB browser)
 *   npx drizzle-kit introspect → Generate schema from existing database
 */

import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  // Schema source
  schema: "./src/schema.ts",

  // Output directory for generated migrations
  out: "./drizzle",

  // Database dialect
  dialect: "postgresql",

  // Database connection
  dbCredentials: {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "optimus_vintage",
    ssl: process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: false }
      : false,
  },

  // Verbose logging
  verbose: true,

  // Strict mode — warns about destructive changes
  strict: true,
});
