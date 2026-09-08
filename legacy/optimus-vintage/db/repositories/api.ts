/**
 * API-based Repositories for React Native
 * These use fetch to communicate with the backend API
 */

import { API_URL, apiDelete, apiGet, apiPost, apiPut } from "../api-config";

// Types (matching PostgreSQL schema)
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

// ============ LOTS REPOSITORY ============
export const LotsRepository = {
  async create(lotData: NewLot): Promise<Lot> {
    return apiPost<Lot>("/lots", lotData);
  },

  async getAll(): Promise<Lot[]> {
    return apiGet<Lot[]>("/lots");
  },

  async getById(id: number): Promise<Lot | undefined> {
    try {
      return await apiGet<Lot>(`/lots/${id}`);
    } catch {
      return undefined;
    }
  },

  async update(id: number, lotData: Partial<NewLot>): Promise<Lot | undefined> {
    return apiPut<Lot>(`/lots/${id}`, lotData);
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/lots/${id}`);
  },

  async count(): Promise<number> {
    const lots = await this.getAll();
    return lots.length;
  },
};

// ============ ITEMS REPOSITORY ============
export const ItemsRepository = {
  async create(itemData: NewItem): Promise<Item> {
    return apiPost<Item>("/items", itemData);
  },

  async createBatch(itemsData: NewItem[]): Promise<Item[]> {
    if (itemsData.length === 0) return [];
    return apiPost<Item[]>("/items/batch", itemsData);
  },

  async getByLotId(lotId: number): Promise<Item[]> {
    return apiGet<Item[]>(`/items?lotId=${lotId}`);
  },

  async getAllStock(): Promise<Item[]> {
    return apiGet<Item[]>("/items?status=STOCK");
  },

  async getById(id: number): Promise<Item | undefined> {
    try {
      return await apiGet<Item>(`/items/${id}`);
    } catch {
      return undefined;
    }
  },

  async getAll(): Promise<Item[]> {
    return apiGet<Item[]>("/items");
  },

  async update(id: number, itemData: Partial<NewItem>): Promise<Item | undefined> {
    return apiPut<Item>(`/items/${id}`, itemData);
  },

  async updateStatus(id: number, status: string): Promise<Item | undefined> {
    const response = await fetch(`${API_URL}/items/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error("Failed to update status");
    return response.json();
  },

  async delete(id: number): Promise<void> {
    return apiDelete(`/items/${id}`);
  },

  async countByLotId(lotId: number): Promise<number> {
    const items = await this.getByLotId(lotId);
    return items.length;
  },

  async countByStatus(status: string): Promise<number> {
    const items = await apiGet<Item[]>(`/items?status=${status}`);
    return items.length;
  },
};

// ============ SALES REPOSITORY ============
export const SalesRepository = {
  async create(saleData: NewSale): Promise<Sale> {
    return apiPost<Sale>("/sales", saleData);
  },

  async getAll(): Promise<Sale[]> {
    return apiGet<Sale[]>("/sales");
  },

  async getByLotId(lotId: number): Promise<Sale[]> {
    return apiGet<Sale[]>(`/sales?lotId=${lotId}`);
  },

  async getById(id: number): Promise<Sale | undefined> {
    try {
      return await apiGet<Sale>(`/sales/${id}`);
    } catch {
      return undefined;
    }
  },

  async getTotalRevenue(): Promise<number> {
    const result = await apiGet<{ total: number }>("/sales/revenue");
    return result.total;
  },

  async getTotalRevenueByLotId(lotId: number): Promise<number> {
    const result = await apiGet<{ total: number }>(`/sales/revenue?lotId=${lotId}`);
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
    return apiDelete(`/sales/${id}`);
  },
};
