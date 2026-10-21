/**
 * auxin-frontend/src/lib/inventory.ts
 * =====================================
 * V3.0 Farmer Inventory API client.
 *
 * Maps to the /inventory/* backend endpoints.
 * Used by the farmer portal to manage stock listings.
 */

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

// ─────────────────────────────────────────────────────────────────────────── //
// Types
// ─────────────────────────────────────────────────────────────────────────── //

export interface InventoryEntry {
  id: number;
  master_product_id: number;
  master_product_name: string | null;
  master_product_slug: string | null;
  farmer_id: number;
  price: number;
  quantity: number;
  unit: string;
  is_organic: boolean;
  harvest_date: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedInventory {
  items: InventoryEntry[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AddInventoryRequest {
  master_product_id: number;
  price: number;
  quantity: number;
  unit: string;
  is_organic: boolean;
  harvest_date: string; // YYYY-MM-DD
  notes?: string;
}

export interface UpdateInventoryRequest {
  price?: number;
  quantity?: number;
  unit?: string;
  is_organic?: boolean;
  harvest_date?: string;
  notes?: string;
  is_active?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────── //
// API client factory (requires auth token)
// ─────────────────────────────────────────────────────────────────────────── //

function createInventoryApi(token?: string | null) {
  const reqConfig = <T extends Record<string, any>>(extra?: T) => {
    const base: Record<string, any> = extra ? { ...extra } : {};
    if (token) {
      base.headers = { ...(base.headers || {}), Authorization: `Bearer ${token}` };
    }
    return base;
  };

  return {
    /** Add a new inventory entry for a master product */
    add: (data: AddInventoryRequest) =>
      api.post<InventoryEntry>("/inventory", data, reqConfig()),

    /** List the farmer's own inventory entries */
    listMy: (params?: {
      page?: number;
      page_size?: number;
      include_inactive?: boolean;
    }) =>
      api.get<PaginatedInventory>("/inventory/my", reqConfig(params ? { params } : undefined)),

    /** Update an inventory entry */
    update: (inventoryId: number, data: UpdateInventoryRequest) =>
      api.put<InventoryEntry>(`/inventory/${inventoryId}`, data, reqConfig()),

    /** Deactivate (soft-remove) an inventory entry */
    deactivate: (inventoryId: number) =>
      api.delete<{ message: string }>(`/inventory/${inventoryId}`, reqConfig()),
  };
}

export const inventoryApi = createInventoryApi;
