/**
 * 🔐 Environment Configuration
 *
 * SECURITY: All sensitive data MUST come from environment variables.
 * Never commit credentials to version control.
 *
 * Required environment variables:
 * - DATABASE_URL or individual PG* variables
 * - API_SECRET (for future auth)
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ["PGHOST", "PGPASSWORD"] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(
    (key) => !process.env[key] && !process.env.DATABASE_URL,
  );
  if (missing.length > 0 && !process.env.DATABASE_URL) {
    console.warn(`⚠️ Missing environment variables: ${missing.join(", ")}`);
    console.warn(
      "Using default development configuration. DO NOT use in production!",
    );
  }
}

// Database configuration from environment
export const config = {
  // Database
  database: {
    host: process.env.PGHOST || "localhost",
    port: parseInt(process.env.PGPORT || "5432"),
    user: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "",
    database: process.env.PGDATABASE || "optimus_vintage",
    ssl: process.env.PGSSLMODE === "require",
    poolSize: parseInt(process.env.DB_POOL_SIZE || "10"),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || "30000"),
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "10000"),
  },

  // Server
  server: {
    port: parseInt(process.env.PORT || "3001"),
    env: process.env.NODE_ENV || "development",
    isProduction: process.env.NODE_ENV === "production",
  },

  // Security
  security: {
    corsOrigins: process.env.CORS_ORIGINS?.split(",") || [
      "http://localhost:8081",
      "http://localhost:8082",
      "http://localhost:19006",
    ],
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"), // 1 min window
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "300"), // 300 requests per minute
    apiSecret: process.env.API_SECRET || "",
  },

  // Feature flags
  features: {
    enableLogging: process.env.ENABLE_LOGGING !== "false",
    enableRateLimiting: process.env.NODE_ENV === "production", // Only in production
  },
} as const;

export type Config = typeof config;
