/**
 * auxin-admin/src/lib/admin.ts
 * ------------------------------
 * Admin API client for Auxin v2.0.
 *
 * All fallback/offline demo logic removed. The admin dashboard requires a
 * live backend connection. Supabase Auth tokens are injected by api.ts.
 */

import api from "./api";
import type { Farmer, Order, Dispute, User, Payment, PaginatedResponse, AdminStats, DeliveryPartner, AdminActivityLog } from "../types";


export const adminApi = {
  async stats(isDemo?: boolean) {
    return api.get<AdminStats>("/admin/stats", { params: isDemo !== undefined ? { is_demo: isDemo } : undefined });
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

  async pendingDelivery(params?: { page?: number }) {
    return api.get<PaginatedResponse<DeliveryPartner>>("/admin/delivery/pending", { params });
  },

  async approveFarmer(farmerId: number) {
    return api.patch(`/admin/farmers/${farmerId}/approve`);
  },

  async rejectFarmer(farmerId: number, rejectionReason?: string) {
    return api.patch(`/admin/farmers/${farmerId}/reject`, { rejection_reason: rejectionReason || "Incomplete Profile" });
  },

  async approveDelivery(partnerId: number) {
    return api.patch(`/admin/delivery/${partnerId}/approve`);
  },

  async rejectDelivery(partnerId: number, rejectionReason?: string) {
    return api.patch(`/admin/delivery/${partnerId}/reject`, { rejection_reason: rejectionReason || "Incomplete Profile" });
  },

  async listOrders(params?: { status?: string; page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<Order>>("/admin/orders", { params });
  },

  async listProducts(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<unknown>>("/admin/products", { params });
  },

  async deactivateProduct(productId: number) {
    return api.put(`/admin/products/${productId}/deactivate`);
  },

  async activateProduct(productId: number) {
    return api.put(`/admin/products/${productId}/activate`);
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

  async listAdmins(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedResponse<User>>("/admin/admins", { params });
  },

  async createAdmin(data: { name: string; email: string; password?: string; phone?: string }) {
    return api.post<User>("/admin/admins", data);
  },

  async disableAdmin(adminId: number) {
    return api.put<User>(`/admin/admins/${adminId}/disable`);
  },

  async activateAdmin(adminId: number) {
    return api.put<User>(`/admin/admins/${adminId}/activate`);
  },

  async removeAdmin(adminId: number) {
    return api.delete<Record<string, string>>(`/admin/admins/${adminId}`);
  },

  async listActivityLogs(params?: {
    admin_id?: number;
    action_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    order?: string;
    page?: number;
    page_size?: number;
  }) {
    return api.get<PaginatedResponse<AdminActivityLog>>("/admin/activity-logs", { params });
  },

  async listMyActivityLogs(params?: {
    page?: number;
    page_size?: number;
    order?: string;
  }) {
    return api.get<PaginatedResponse<AdminActivityLog>>("/admin/my-activity-logs", { params });
  },

  async reviewAnalytics() {
    return api.get<any>("/admin/reviews/analytics");
  },

  async resetDemoEnvironment(passwordConfirm?: string) {
    return api.post<any>("/admin/demo/reset", { password_confirm: passwordConfirm });
  },

  async getSystemHealth() {
    return api.get<any>("/admin/system/health");
  },
};


