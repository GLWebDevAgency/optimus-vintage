/**
 * 📚 Database Entry Point
 *
 * Platform-aware database:
 * - Web: Uses remote API (no local SQLite)
 * - Native: Uses SQLite with Drizzle (see index.native.ts)
 *
 * This file is the web version - exports null db since web uses API.
 */

// Web platform uses the remote API, not local SQLite
// This stub prevents expo-sqlite from being bundled on web
export const db = null;
