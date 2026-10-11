/**
 * auxin-admin/src/lib/catalogue.ts
 * =====================================
 * V3.0 Master Catalogue Admin API client.
 *
 * Integrates with /catalogue endpoints.
 */

import api from "./api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  icon_emoji: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  subcategories?: Category[];
}

export interface MasterProduct {
  id: number;
  category_id: number;
  category_name?: string | null;
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
  created_at: string;
}

export interface PaginatedCatalogue {
  items: MasterProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const catalogueApi = {
  // Public-facing list/suggest on aggregated level (also usable by admin)
  list: (params?: { page?: number; page_size?: number; category?: string; q?: string }) =>
    api.get<PaginatedCatalogue>("/catalogue", { params }),

  categories: () =>
    api.get<Category[]>("/catalogue/categories"),

  getProduct: (id: number) =>
    api.get<MasterProduct>(`/catalogue/${id}`),

  // ── Admin-only Catalogue Endpoints ────────────────────────────────────────── //

  createCategory: (data: {
    name: string;
    slug: string;
    parent_id?: number | null;
    icon_emoji?: string | null;
    display_order?: number;
  }) =>
    api.post<Category>("/catalogue/admin/categories", data),

  updateCategory: (id: number, data: Partial<{
    name: string;
    slug: string;
    parent_id: number | null;
    icon_emoji: string | null;
    display_order: number;
    is_active: boolean;
  }>) =>
    api.put<Category>(`/catalogue/admin/categories/${id}`, data),

  createProduct: (data: {
    category_id: number;
    name: string;
    slug: string;
    description?: string;
    default_unit?: string;
    image_url?: string;
    tags?: string;
    storage_info?: string;
    shelf_life_days?: number;
    is_seasonal?: boolean;
    display_order?: number;
  }) =>
    api.post<MasterProduct>("/catalogue/admin/products", data),

  updateProduct: (id: number, data: Partial<{
    category_id: number;
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
  }>) =>
    api.put<MasterProduct>(`/catalogue/admin/products/${id}`, data),
};
