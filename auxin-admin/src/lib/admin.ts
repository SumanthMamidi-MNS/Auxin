/**
 * auxin-admin/src/lib/admin.ts
 * ------------------------------
 * Admin API client for Auxin v2.0.
 *
 * All fallback/offline demo logic removed. The admin dashboard requires a
 * live backend connection. Supabase Auth tokens are injected by api.ts.
 */

import api from "./api";
import type { Farmer, Order, Dispute, User, Payment, PaginatedResponse, AdminStats } from "../types";


export const adminApi = {
  async stats() {
    return api.get<AdminStats>("/admin/stats");
  },

  async listUsers(params?: { role?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<User>>("/admin/users", { params });
  },

  async suspendUser(userId: number, reason: string) {
    return api.put(`/admin/users/${userId}/suspend`, { reason });
  },

  async reinstateUser(userId: number) {
    return api.put(`/admin/users/${userId}/reinstate`);
  },

  async pendingFarmers(params?: { page?: number }) {
    return api.get<PaginatedResponse<Farmer>>("/admin/farmers/pending", { params });
  },

  async approveFarmer(farmerId: number) {
    return api.put(`/admin/farmers/${farmerId}/approve`);
  },

  async rejectFarmer(farmerId: number) {
    return api.put(`/admin/farmers/${farmerId}/reject`);
  },

  async listOrders(params?: { status?: string; page?: number }) {
    return api.get<PaginatedResponse<Order>>("/admin/orders", { params });
  },

  async listProducts(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<unknown>>("/admin/products", { params });
  },

  async deactivateProduct(productId: number) {
    return api.put(`/admin/products/${productId}/deactivate`);
  },

  async listDeliveries(params?: { page?: number }) {
    return api.get("/admin/deliveries", { params });
  },

  async listDisputes(params?: { status?: string; page?: number }) {
    return api.get<PaginatedResponse<Dispute>>("/admin/disputes", { params });
  },

  async resolveDispute(disputeId: number, data: {
    new_status: "resolved" | "rejected";
    resolution_note: string;
    trigger_refund: boolean;
  }) {
    return api.put(`/admin/disputes/${disputeId}`, data);
  },

  async listPayments(params?: { status?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Payment>>("/admin/payments", { params });
  },
};

