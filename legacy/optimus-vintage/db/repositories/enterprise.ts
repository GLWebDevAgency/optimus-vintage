/**
 * 📦 Enterprise Repositories
 *
 * Production-ready data access layer with:
 * - Strong typing
 * - Comprehensive error handling
 * - Consistent API responses
 */

import { api, ApiError } from "../api-client";

// ============ TYPES ============

export interface Lot {
  id: number;
  name: string | null;
  provider: string;
  buyDate: string;
  type: string;
  totalCost: string;
  additionalFees: string | null;
  initialQuantity: number;
  currency: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface LotSummary {
  id: number;
  name: string | null;
  provider: string | null;
  buyDate: string;
  initialQuantity: number;
  totalCost: string;
  additionalFees: string;
  totalInvestment: number;
  totalRevenue: number;
  soldCount: number;
  stockCount: number;
  delta: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewLot {
  name?: string | null;
  provider: string;
  buyDate: string;
  type?: string;
  totalCost: string;
  additionalFees?: string;
  initialQuantity: number;
  currency?: string;
}

export interface Item {
  id: number;
  lotId: number;
  brand: string | null;
  type: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  unitCost: string;
  status: string;
  photos: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NewItem {
  lotId: number;
  brand?: string | null;
  type?: string | null;
  color?: string | null;
  size?: string | null;
  condition?: string | null;
  unitCost: string;
  status?: string;
  photos?: string | null;
}

export interface Sale {
  id: number;
  itemId: number | null;
  lotId: number;
  platform: string | null;
  priceGross: string;
  platformFees: string | null;
  shippingFees: string | null;
  miscFees: string | null;
  priceNet: string;
  saleDate: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface NewSale {
  itemId?: number | null;
  lotId: number;
  platform?: string;
  priceGross: string;
  platformFees?: string;
  shippingFees?: string;
  miscFees?: string;
  priceNet: string;
  saleDate: string;
  status?: string;
}

// Re-export ApiError for error handling
export { ApiError };

// ============ LOTS REPOSITORY ============

export const LotsRepository = {
  async create(lotData: NewLot): Promise<Lot> {
    return api.post<Lot>("/lots", lotData);
  },

  async getAll(): Promise<Lot[]> {
    return api.get<Lot[]>("/lots");
  },

  async getSummary(): Promise<LotSummary[]> {
    return api.get<LotSummary[]>("/lots/summary");
  },

  async getById(id: number): Promise<Lot | undefined> {
    try {
      return await api.get<Lot>(`/lots/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  },

  async update(id: number, lotData: Partial<NewLot>): Promise<Lot> {
    return api.put<Lot>(`/lots/${id}`, lotData);
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/lots/${id}`);
  },

  async count(): Promise<number> {
    const lots = await this.getAll();
    return lots.length;
  },
};

// ============ ITEMS REPOSITORY ============

export const ItemsRepository = {
  async create(itemData: NewItem): Promise<Item> {
    return api.post<Item>("/items", itemData);
  },

  async createBatch(itemsData: NewItem[]): Promise<Item[]> {
    if (itemsData.length === 0) return [];
    return api.post<Item[]>("/items/batch", itemsData);
  },

  async getByLotId(lotId: number): Promise<Item[]> {
    return api.get<Item[]>(`/items?lotId=${lotId}`);
  },

  async getAllStock(): Promise<Item[]> {
    return api.get<Item[]>("/items?status=STOCK");
  },

  async getById(id: number): Promise<Item | undefined> {
    try {
      return await api.get<Item>(`/items/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  },

  async getAll(): Promise<Item[]> {
    return api.get<Item[]>("/items");
  },

  async update(id: number, itemData: Partial<NewItem>): Promise<Item> {
    return api.put<Item>(`/items/${id}`, itemData);
  },

  async updateStatus(id: number, status: string): Promise<Item> {
    return api.patch<Item>(`/items/${id}/status`, { status });
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/items/${id}`);
  },

  async countByLotId(lotId: number): Promise<number> {
    const items = await this.getByLotId(lotId);
    return items.length;
  },

  async countByStatus(status: string): Promise<number> {
    const items = await api.get<Item[]>(`/items?status=${status}`);
    return items.length;
  },
};

// ============ SALES REPOSITORY ============

export const SalesRepository = {
  async create(saleData: NewSale): Promise<Sale> {
    return api.post<Sale>("/sales", saleData);
  },

  async getAll(): Promise<Sale[]> {
    return api.get<Sale[]>("/sales");
  },

  async getByLotId(lotId: number): Promise<Sale[]> {
    return api.get<Sale[]>(`/sales?lotId=${lotId}`);
  },

  async getById(id: number): Promise<Sale | undefined> {
    try {
      return await api.get<Sale>(`/sales/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        return undefined;
      }
      throw error;
    }
  },

  async update(id: number, saleData: Partial<NewSale>): Promise<Sale> {
    return api.put<Sale>(`/sales/${id}`, saleData);
  },

  async cancel(id: number): Promise<Sale> {
    return api.post<Sale>(`/sales/${id}/cancel`, {});
  },

  async getTotalRevenue(): Promise<number> {
    const result = await api.get<{ total: number }>("/sales/revenue");
    return result.total;
  },

  async getTotalRevenueByLotId(lotId: number): Promise<number> {
    const result = await api.get<{ total: number }>(
      `/sales/revenue?lotId=${lotId}`,
    );
    return result.total;
  },

  async count(): Promise<number> {
    const sales = await this.getAll();
    return sales.length;
  },

  async countByLotId(lotId: number): Promise<number> {
    const sales = await this.getByLotId(lotId);
    return sales.length;
  },

  async delete(id: number): Promise<void> {
    return api.delete(`/sales/${id}`);
  },
};
