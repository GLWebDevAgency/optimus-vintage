/**
 * 🌐 API CLIENT UTILITIES
 *
 * Utilitaires avancés pour les appels API avec:
 * - Retry automatique avec backoff exponentiel
 * - Timeout configurable
 * - Gestion des erreurs réseau
 * - Circuit breaker pattern
 * - Request deduplication
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface RequestConfig {
  /** Timeout en millisecondes (défaut: 10000) */
  timeout?: number;
  /** Nombre de tentatives (défaut: 3) */
  retries?: number;
  /** Délai initial entre les tentatives en ms (défaut: 1000) */
  retryDelay?: number;
  /** Multiplier pour le backoff exponentiel (défaut: 2) */
  backoffMultiplier?: number;
  /** Headers additionnels */
  headers?: Record<string, string>;
  /** Clé de déduplication (évite les appels en double) */
  dedupKey?: string;
}

export interface ApiError extends Error {
  status?: number;
  code?: string;
  isNetworkError: boolean;
  isTimeout: boolean;
  isRetryable: boolean;
  originalError?: Error;
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: Required<Omit<RequestConfig, "headers" | "dedupKey">> = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
};

// HTTP status codes that are retryable
const RETRYABLE_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

const pendingRequests = new Map<string, Promise<unknown>>();

function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
): Promise<T> {
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⏱️ TIMEOUT WRAPPER
// ═══════════════════════════════════════════════════════════════════════════════

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      const error = createApiError(
        `Request timeout after ${ms}ms`,
        undefined,
        "TIMEOUT",
      );
      error.isTimeout = true;
      reject(error);
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚨 ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════════════════

function createApiError(
  message: string,
  status?: number,
  code?: string,
  originalError?: Error,
): ApiError {
  const error = new Error(message) as ApiError;
  error.status = status;
  error.code = code;
  error.isNetworkError = !status;
  error.isTimeout = code === "TIMEOUT";
  error.isRetryable =
    error.isNetworkError ||
    error.isTimeout ||
    (status !== undefined && RETRYABLE_STATUS_CODES.includes(status));
  error.originalError = originalError;
  return error;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🔄 RETRY LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

async function withRetry<T>(
  fn: () => Promise<T>,
  config: Required<Omit<RequestConfig, "headers" | "dedupKey">>,
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.retryDelay;

  for (let attempt = 0; attempt <= config.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      const apiError = error as ApiError;

      // Don't retry non-retryable errors
      if (apiError.isRetryable === false) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.retries) {
        throw error;
      }

      // Wait before retrying with exponential backoff
      await sleep(delay);
      delay *= config.backoffMultiplier;

      console.log(
        `[API] Retrying request (attempt ${attempt + 2}/${config.retries + 1})`,
      );
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 API CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

async function apiRequest<T>(
  method: RequestMethod,
  url: string,
  body?: unknown,
  config: RequestConfig = {},
): Promise<T> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const execute = async (): Promise<T> => {
    const fetchPromise = fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...config.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const response = await withTimeout(fetchPromise, mergedConfig.timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw createApiError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData.code,
      );
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) {
      return {} as T;
    }

    return JSON.parse(text);
  };

  const executeWithRetry = () => withRetry(execute, mergedConfig);

  // Apply deduplication if key provided
  if (config.dedupKey) {
    return deduplicateRequest(config.dedupKey, executeWithRetry);
  }

  return executeWithRetry();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🎯 PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

export const api = {
  /**
   * GET request
   */
  get: <T>(url: string, config?: RequestConfig): Promise<T> =>
    apiRequest<T>("GET", url, undefined, config),

  /**
   * POST request
   */
  post: <T>(url: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiRequest<T>("POST", url, body, config),

  /**
   * PUT request
   */
  put: <T>(url: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiRequest<T>("PUT", url, body, config),

  /**
   * PATCH request
   */
  patch: <T>(url: string, body?: unknown, config?: RequestConfig): Promise<T> =>
    apiRequest<T>("PATCH", url, body, config),

  /**
   * DELETE request
   */
  delete: <T>(url: string, config?: RequestConfig): Promise<T> =>
    apiRequest<T>("DELETE", url, undefined, config),
};

// ═══════════════════════════════════════════════════════════════════════════════
// 🔌 CIRCUIT BREAKER
// ═══════════════════════════════════════════════════════════════════════════════

interface CircuitBreakerConfig {
  /** Nombre d'échecs avant ouverture */
  failureThreshold: number;
  /** Temps en ms avant de tenter une reconnexion */
  resetTimeout: number;
  /** Nombre de succès requis pour fermer le circuit */
  successThreshold: number;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      // Check if we should try again
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = "HALF_OPEN";
        this.successes = 0;
      } else {
        throw createApiError(
          "Circuit breaker is open",
          undefined,
          "CIRCUIT_OPEN",
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === "HALF_OPEN") {
        this.successes++;
        if (this.successes >= this.config.successThreshold) {
          this.state = "CLOSED";
          this.failures = 0;
        }
      } else {
        this.failures = 0;
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.config.failureThreshold) {
        this.state = "OPEN";
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = "CLOSED";
    this.failures = 0;
    this.successes = 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🌐 NETWORK STATUS
// ═══════════════════════════════════════════════════════════════════════════════

import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useEffect, useState } from "react";

/**
 * Hook pour surveiller l'état du réseau
 */
export function useNetworkStatus(): {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string | null;
} {
  const [status, setStatus] = useState<{
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
  }>({
    isConnected: null,
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}

/**
 * Vérifie si le réseau est disponible
 */
export async function checkNetworkAvailable(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable === true;
  } catch {
    return false;
  }
}

export default api;
