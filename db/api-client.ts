/**
 * 🌐 Enterprise API Client
 * 
 * Production-ready HTTP client with:
 * - Automatic retry with exponential backoff
 * - Request timeout
 * - Detailed error handling
 * - Response type safety
 */

// Configuration
const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 30000, // 30 seconds
  retryAttempts: 5, // More retries for rate limiting
  retryDelay: 1000, // Initial delay in ms
  minRequestInterval: 200, // Min 200ms between requests to avoid rate limits
};

// ============ REQUEST THROTTLING ============

let lastRequestTime = 0;
let requestQueue: Array<() => void> = [];
let isProcessingQueue = false;

async function throttle(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < API_CONFIG.minRequestInterval) {
    await sleep(API_CONFIG.minRequestInterval - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
}

// ============ ERROR TYPES ============

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError() {
    return this.statusCode === 0;
  }

  get isServerError() {
    return this.statusCode >= 500;
  }

  get isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  get isRetryable() {
    return this.isNetworkError || this.isServerError;
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed') {
    super(0, message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ApiError {
  constructor(message: string = 'Request timed out') {
    super(0, message, 'TIMEOUT');
    this.name = 'TimeoutError';
  }
}

// ============ RESPONSE TYPES ============

interface ApiResponse<T> {
  data: T;
  message?: string;
  count?: number;
}

interface ApiErrorResponse {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

// ============ HELPER FUNCTIONS ============

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseErrorResponse(response: Response): Promise<ApiError> {
  try {
    const body = await response.json() as ApiErrorResponse;
    return new ApiError(
      response.status,
      body.error?.message || `HTTP ${response.status}`,
      body.error?.code,
      body.error?.details
    );
  } catch {
    return new ApiError(
      response.status,
      `HTTP ${response.status}: ${response.statusText}`,
      'UNKNOWN_ERROR'
    );
  }
}

// ============ CORE REQUEST FUNCTION ============

async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown,
  options: { retries?: number; timeout?: number } = {}
): Promise<T> {
  const url = `${API_CONFIG.baseUrl}${endpoint}`;
  const retries = options.retries ?? API_CONFIG.retryAttempts;
  const timeout = options.timeout ?? API_CONFIG.timeout;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    fetchOptions.body = JSON.stringify(data);
  }

  let lastError: Error = new NetworkError();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Throttle requests to prevent rate limiting
      await throttle();
      
      const response = await fetchWithTimeout(url, fetchOptions, timeout);

      if (!response.ok) {
        const error = await parseErrorResponse(response);
        
        // Handle rate limiting (429) - always retry with longer delay
        if (response.status === 429) {
          if (attempt < retries) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '3', 10);
            const delay = Math.max(retryAfter * 1000, API_CONFIG.retryDelay * Math.pow(2, attempt + 1));
            console.warn(`Rate limited (429), waiting ${delay}ms before retry (attempt ${attempt + 1}/${retries})...`);
            await sleep(delay);
            continue;
          }
          // No more retries, throw the error
          throw new ApiError(429, 'Too many requests. Please try again later.', 'RATE_LIMITED');
        }
        
        // Don't retry other client errors (4xx)
        if (error.isClientError) {
          throw error;
        }
        
        lastError = error;
        
        // Retry server errors
        if (attempt < retries && error.isRetryable) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, attempt);
          console.warn(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
        
        throw error;
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return undefined as T;
      }

      const json = await response.json() as ApiResponse<T> | T;
      
      // Handle wrapped responses
      if (json && typeof json === 'object' && 'data' in json) {
        return (json as ApiResponse<T>).data;
      }
      
      return json as T;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network error - retry
      if (error instanceof TypeError || (error instanceof Error && error.message.includes('Network'))) {
        lastError = new NetworkError('Unable to connect to server. Check your internet connection.');
        
        if (attempt < retries) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, attempt);
          console.warn(`Network error (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }
      }

      if (error instanceof TimeoutError) {
        lastError = error;
        if (attempt < retries) {
          console.warn(`Timeout (attempt ${attempt + 1}/${retries + 1}), retrying...`);
          continue;
        }
      }

      if (error instanceof Error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

// ============ PUBLIC API ============

export const api = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, data: unknown) => request<T>('POST', endpoint, data),
  put: <T>(endpoint: string, data: unknown) => request<T>('PUT', endpoint, data),
  patch: <T>(endpoint: string, data: unknown) => request<T>('PATCH', endpoint, data),
  delete: (endpoint: string) => request<void>('DELETE', endpoint),
};

// ============ LEGACY EXPORTS (for backward compatibility) ============

export const API_URL = API_CONFIG.baseUrl;

export async function apiGet<T>(endpoint: string): Promise<T> {
  return api.get<T>(endpoint);
}

export async function apiPost<T>(endpoint: string, data: unknown): Promise<T> {
  return api.post<T>(endpoint, data);
}

export async function apiPut<T>(endpoint: string, data: unknown): Promise<T> {
  return api.put<T>(endpoint, data);
}

export async function apiDelete(endpoint: string): Promise<void> {
  return api.delete(endpoint);
}

// ============ HEALTH CHECK ============

export async function checkApiHealth(): Promise<boolean> {
  try {
    const health = await api.get<{ status: string }>('/health');
    return health.status === 'healthy';
  } catch {
    return false;
  }
}
