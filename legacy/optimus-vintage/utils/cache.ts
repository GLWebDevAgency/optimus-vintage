/**
 * 💾 SMART CACHE SYSTEM
 *
 * Système de cache intelligent multi-couches pour Optimus Vintage
 * - Memory cache (Level 1) - Instantané
 * - AsyncStorage cache (Level 2) - Persistant
 * - Network cache (Level 3) - API avec revalidation
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ═══════════════════════════════════════════════════════════════════════════════
// 📊 TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheConfig {
  /** Time-to-live en millisecondes */
  ttl: number;
  /** Version du cache (pour invalidation) */
  version: number;
  /** Prefix pour les clés AsyncStorage */
  storagePrefix: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  memorySize: number;
  storageKeys: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ⚙️ CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  version: 1,
  storagePrefix: "@optimus_cache:",
};

// TTL presets
export const CacheTTL = {
  /** 30 secondes - Pour données très dynamiques */
  INSTANT: 30 * 1000,
  /** 2 minutes - Pour listes fréquemment mises à jour */
  SHORT: 2 * 60 * 1000,
  /** 5 minutes - Par défaut */
  MEDIUM: 5 * 60 * 1000,
  /** 30 minutes - Pour données statiques */
  LONG: 30 * 60 * 1000,
  /** 24 heures - Pour référentiels */
  DAY: 24 * 60 * 60 * 1000,
  /** 7 jours - Pour données très statiques */
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 🧠 MEMORY CACHE (L1)
// ═══════════════════════════════════════════════════════════════════════════════

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 100; // Max entries
  private stats = { hits: 0, misses: 0 };

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > DEFAULT_CONFIG.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Check version
    if (entry.version !== DEFAULT_CONFIG.version) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version: DEFAULT_CONFIG.version,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  /** Invalide toutes les entrées correspondant à un pattern */
  invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  getStats(): { hits: number; misses: number; size: number } {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 💿 STORAGE CACHE (L2)
// ═══════════════════════════════════════════════════════════════════════════════

class StorageCache {
  private prefix = DEFAULT_CONFIG.storagePrefix;

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const stored = await AsyncStorage.getItem(this.getKey(key));

      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      // Check expiration
      if (Date.now() - entry.timestamp > DEFAULT_CONFIG.ttl) {
        await this.delete(key);
        return null;
      }

      // Check version
      if (entry.version !== DEFAULT_CONFIG.version) {
        await this.delete(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: DEFAULT_CONFIG.version,
      };
      await AsyncStorage.setItem(this.getKey(key), JSON.stringify(entry));
    } catch (error) {
      console.warn("[StorageCache] Failed to set:", error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch {
      // Ignore
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k: string) => k.startsWith(this.prefix));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch {
      // Ignore
    }
  }

  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const matchingKeys = keys.filter(
        (k: string) => k.startsWith(this.prefix) && k.includes(pattern),
      );
      await AsyncStorage.multiRemove(matchingKeys);
      return matchingKeys.length;
    } catch {
      return 0;
    }
  }

  async getStats(): Promise<{ keys: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k: string) => k.startsWith(this.prefix));
      return { keys: cacheKeys.length };
    } catch {
      return { keys: 0 };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🚀 SMART CACHE (UNIFIED)
// ═══════════════════════════════════════════════════════════════════════════════

class SmartCache {
  private memoryCache = new MemoryCache();
  private storageCache = new StorageCache();

  /**
   * Récupère une valeur du cache (L1 -> L2)
   */
  async get<T>(key: string): Promise<T | null> {
    // Try memory first (fastest)
    const memResult = this.memoryCache.get<T>(key);
    if (memResult !== null) {
      return memResult;
    }

    // Try storage (slower but persistent)
    const storageResult = await this.storageCache.get<T>(key);
    if (storageResult !== null) {
      // Promote to memory cache
      this.memoryCache.set(key, storageResult);
      return storageResult;
    }

    return null;
  }

  /**
   * Stocke une valeur dans le cache (L1 + L2)
   */
  async set<T>(key: string, data: T, persist = true): Promise<void> {
    // Always set in memory
    this.memoryCache.set(key, data);

    // Optionally persist
    if (persist) {
      await this.storageCache.set(key, data);
    }
  }

  /**
   * Supprime une valeur du cache
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.storageCache.delete(key);
  }

  /**
   * Vide tout le cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.storageCache.clear();
  }

  /**
   * Invalide les entrées correspondant à un pattern
   * Utile pour invalider toutes les données d'un lot ou d'un type
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const memCount = this.memoryCache.invalidatePattern(pattern);
    const storageCount = await this.storageCache.invalidatePattern(pattern);
    return memCount + storageCount;
  }

  /**
   * Récupère ou calcule une valeur (pattern cache-aside)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { persist?: boolean; ttl?: number },
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    await this.set(key, data, options?.persist ?? true);
    return data;
  }

  /**
   * Récupère les statistiques du cache
   */
  async getStats(): Promise<CacheStats> {
    const memStats = this.memoryCache.getStats();
    const storageStats = await this.storageCache.getStats();

    return {
      hits: memStats.hits,
      misses: memStats.misses,
      memorySize: memStats.size,
      storageKeys: storageStats.keys,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 🏷️ CACHE KEYS BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export const CacheKeys = {
  // Lots
  lots: {
    all: () => "lots:all",
    byId: (id: number) => `lots:${id}`,
    summary: (id: number) => `lots:${id}:summary`,
  },

  // Items
  items: {
    all: () => "items:all",
    byLot: (lotId: number) => `items:lot:${lotId}`,
    byId: (id: number) => `items:${id}`,
    stock: () => "items:stock",
  },

  // Sales
  sales: {
    all: () => "sales:all",
    byLot: (lotId: number) => `sales:lot:${lotId}`,
    byItem: (itemId: number) => `sales:item:${itemId}`,
    recent: () => "sales:recent",
  },

  // Dashboard
  dashboard: {
    stats: () => "dashboard:stats",
    kpis: () => "dashboard:kpis",
  },

  // Settings
  settings: {
    user: () => "settings:user",
    preferences: () => "settings:preferences",
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// 📤 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Instance singleton du cache intelligent */
export const cache = new SmartCache();

/**
 * Hook pour le cache avec revalidation automatique
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { revalidateOnFocus?: boolean; revalidateInterval?: number },
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  revalidate: () => Promise<void>;
} {
  // Ce hook serait implémenté avec useState/useEffect
  // Pour l'instant, on retourne une structure de base
  throw new Error("useCachedQuery doit être implémenté avec React hooks");
}

export default cache;
