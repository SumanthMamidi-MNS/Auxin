/**
 * auxin-frontend/src/lib/catalogue.ts
 * =====================================
 * V3.0 Master Catalogue API client.
 *
 * Replaces productsApi for customer browsing.
 * Maps to the new /catalogue/* backend endpoints.
 */

import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// ─────────────────────────────────────────────────────────────────────────── //
// Types
// ─────────────────────────────────────────────────────────────────────────── //

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon_emoji: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  subcategories: Category[];
}

/** Aggregated product card — one entry per master product */
export interface CatalogueProduct {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  default_unit: string;
  image_url: string | null;
  is_seasonal: boolean;
  shelf_life_days: number | null;
  category_id: number;
  category_name: string;
  category_slug: string;
  category_icon: string | null;
  // Aggregated from all farmer contributions
  min_price: number;
  max_price: number;
  total_stock: number;
  farmer_count: number;
  has_organic: boolean;
}

export interface PaginatedCatalogue {
  items: CatalogueProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductSuggestion {
  id: number;
  name: string;
  slug: string;
  category_name: string | null;
  category_icon: string | null;
  default_unit: string;
}

export interface FarmerSupplier {
  inventory_id: number;
  farmer_id: number;
  farmer_name: string | null;
  farmer_farm_name: string | null;
  price: number;
  quantity: number;
  unit: string;
  is_organic: boolean;
  harvest_date: string;
  notes: string | null;
}

export interface MasterProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  default_unit: string;
  image_url: string | null;
  tags: string | null;
  storage_info: string | null;
  shelf_life_days: number | null;
  is_seasonal: boolean;
  is_active: boolean;
  display_order: number;
  category_id: number;
  category_name: string | null;
  category_slug: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────── //
// API client
// ─────────────────────────────────────────────────────────────────────────── //

export const catalogueApi = {
  /** List aggregated products (customer home) */
  list: (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    organic?: boolean;
    q?: string;
  }) =>
    api.get<PaginatedCatalogue>("/catalogue", { params }),

  /** Autocomplete suggestions */
  suggest: (q: string, limit = 6) =>
    api.get<ProductSuggestion[]>("/catalogue/suggest", { params: { q, limit } }),

  /** List all root categories with nested subcategories */
  categories: () =>
    api.get<Category[]>("/catalogue/categories"),

  /** Get master product detail */
  getProduct: (productId: number) =>
    api.get<MasterProductDetail>(`/catalogue/${productId}`),

  /** Get product by slug */
  getProductBySlug: (slug: string) =>
    api.get<MasterProductDetail>(`/catalogue/slug/${slug}`),

  /** List farmer suppliers for a product */
  getSuppliers: (productId: number, organic?: boolean) =>
    api.get<FarmerSupplier[]>(`/catalogue/${productId}/suppliers`, {
      params: organic != null ? { organic } : {},
    }),
};

// ─────────────────────────────────────────────────────────────────────────── //
// Admin API (requires auth token)
// ─────────────────────────────────────────────────────────────────────────── //

export const catalogueAdminApi = {
  createCategory: (token: string, data: {
    name: string; slug: string; parent_id?: number;
    icon_emoji?: string; display_order?: number;
  }) =>
    api.post("/catalogue/admin/categories", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateCategory: (token: string, categoryId: number, data: object) =>
    api.put(`/catalogue/admin/categories/${categoryId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createProduct: (token: string, data: object) =>
    api.post("/catalogue/admin/products", data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateProduct: (token: string, productId: number, data: object) =>
    api.put(`/catalogue/admin/products/${productId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
