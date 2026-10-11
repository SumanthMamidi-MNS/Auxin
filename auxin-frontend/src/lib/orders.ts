/**
 * auxin-frontend/src/lib/orders.ts
 * ----------------------------------
 * Orders API client. Auth token injected by the Axios interceptor in api.ts.
 */

import api from "./api";
import type { Order, PaginatedResponse } from "@/types";

export const ordersApi = {
  async create(items: { product_id?: number; inventory_id?: number; quantity: number }[], paymentMethod: string = "razorpay") {
    return api.post<Order>("/orders", { items, payment_method: paymentMethod });
  },

  async myOrders(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Order>>("/orders/my", { params });
  },

  async farmerOrders(params?: { status?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Order>>("/orders/farmer/incoming", { params });
  },

  async get(id: number) {
    return api.get<Order>(`/orders/${id}`);
  },

  async accept(id: number) {
    return api.put<Order>(`/orders/${id}/accept`);
  },

  async reject(id: number) {
    return api.put<Order>(`/orders/${id}/reject`);
  },

  async cancel(id: number) {
    return api.put<Order>(`/orders/${id}/cancel`);
  },

  async complete(id: number) {
    return api.put<Order>(`/orders/${id}/complete`);
  },

  async markPacking(id: number) {
    return api.put<Order>(`/orders/${id}/packing`);
  },

  async markReadyForPickup(id: number) {
    return api.put<Order>(`/orders/${id}/ready-for-pickup`);
  },

  async submitReview(orderId: number, data: { farmer_rating: number; farmer_review?: string; delivery_rating?: number; delivery_review?: string }) {
    return api.post(`/orders/${orderId}/review`, data);
  },
};
