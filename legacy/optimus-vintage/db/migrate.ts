/**
 * 📚 Database Initialization Layer
 *
 * Since we now use PostgreSQL via REST API, this file only verifies
 * that the API is reachable. All migrations are handled on the server side.
 */

import { api } from './api-client';

/**
 * Verify API connection is working.
 * Tables are managed by the PostgreSQL server, not the mobile app.
 */
export async function ensureTables(): Promise<void> {
  console.log("[DB] Using PostgreSQL via REST API");
  
  try {
    // Simple health check - try to fetch lots (will return empty array if no data)
    await api.get('/lots');
    console.log("[DB] API connection verified ✓");
  } catch (error) {
    console.warn("[DB] API not reachable, app may work in offline mode:", error);
    // Don't throw - let the app continue and handle API errors gracefully
  }
}
