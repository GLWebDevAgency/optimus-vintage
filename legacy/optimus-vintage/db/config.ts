/**
 * 🔧 Database Configuration
 * 
 * ⚠️ DEPRECATED: This file is kept for backward compatibility.
 * Use the API client instead for all database operations.
 * 
 * For API server configuration, see: /api/.env
 */

// This configuration is no longer used directly by the app
// All database operations go through the API server
export const DATABASE_CONFIG = {
  // Values are read from environment variables in the API server
  // See /api/src/config.ts for the actual configuration
  host: 'configured-in-api-server',
  port: 5432,
  user: 'configured-in-api-server',
  password: 'configured-in-api-server',
  database: 'configured-in-api-server',
  ssl: false,
};

// Connection string - not used in mobile app
export const DATABASE_URL = 'configured-in-api-server';
