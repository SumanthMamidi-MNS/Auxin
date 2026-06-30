/**
 * auxin-frontend/src/lib/products.ts
 * -------------------------------------
 * Products API client. Auth token injected by the Axios interceptor in api.ts.
 */

import api from "./api";
import type { PaginatedResponse, Product } from "@/types";

export const productsApi = {
  async list(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Product>>("/products", { params });
  },

  async get(id: number) {
    return api.get<Product>(`/products/${id}`);
  },

  async myProducts(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Product>>("/products/my", { params });
  },

  async create(data: {
    name: string; description: string; price: number;
    quantity: number; unit: string; harvest_date: string;
  }) {
    return api.post<Product>("/products", data);
  },

  async update(id: number, data: Partial<{
    name: string; description: string; price: number;
    quantity: number; unit: string; harvest_date: string; is_active: boolean;
  }>) {
    return api.put<Product>(`/products/${id}`, data);
  },

  async delete(id: number) {
    return api.delete(`/products/${id}`);
  },
};
