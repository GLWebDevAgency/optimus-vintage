/**
 * 🔧 API Configuration for PostgreSQL Backend
 * 
 * ⚠️ DEPRECATED: Use /db/api-client.ts instead for all API operations.
 * This file is kept for backward compatibility only.
 * 
 * IMPORTANT: React Native cannot directly connect to PostgreSQL.
 * All database operations go through the Express API server.
 */

import { config } from '../constants/Config';

// Backend API URL - Read from environment
export const API_URL = config.api.url;

// PostgreSQL connection details are NOT stored in the mobile app
// They are configured in the API server via environment variables
// See /api/.env for server-side configuration

// Feature flags
export const USE_REMOTE_DB = true; // Always use remote DB through API

// ⚠️ DEPRECATED: Use the enterprise API client instead
// import { api } from './api-client';

// Legacy API Helper functions (deprecated - use api-client.ts)
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
  return response.json();
}

export async function apiDelete(endpoint: string): Promise<void> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }
}
