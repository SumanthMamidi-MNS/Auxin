/**
 * auxin-frontend/src/lib/delivery.ts
 * ------------------------------------
 * Delivery partner API client. Auth token injected by the Axios interceptor in api.ts.
 */

import api from "./api";
import type { Delivery, PaginatedAvailableDeliveries } from "@/types";

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DeliveryPartnerProfile {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  is_active: boolean;
  is_available: boolean;
  current_latitude?: number | null;
  current_longitude?: number | null;
  location_updated_at?: string | null;
  location_accuracy?: number | null;
  created_at: string;
  bank_name?: string | null;
  account_holder_name?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  vehicle_type?: string | null;
  vehicle_number?: string | null;
  driving_license?: string | null;
}

export const deliveryApi = {
  async getProfile() {
    return api.get<DeliveryPartnerProfile>("/delivery/profile/me");
  },

  async createProfile(data: { full_name: string; phone: string }) {
    return api.post<DeliveryPartnerProfile>("/delivery/profile", data);
  },

  async updateProfile(data: {
    bank_name?: string;
    account_holder_name?: string;
    bank_account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    vehicle_type?: string;
    vehicle_number?: string;
    driving_license?: string;
  }) {
    return api.put<DeliveryPartnerProfile>("/delivery/profile/me", data);
  },

  async toggleAvailability(isAvailable: boolean) {
    return api.put<DeliveryPartnerProfile>(`/delivery/availability?is_available=${isAvailable}`);
  },

  async updateLocation(data: { latitude: number; longitude: number; accuracy?: number | null }) {
    return api.put<DeliveryPartnerProfile>("/delivery/location", data);
  },

  async getAvailableDeliveries(params?: { page?: number; page_size?: number }) {
    return api.get<PaginatedAvailableDeliveries>("/delivery/available", { params });
  },

  async claimDelivery(deliveryId: number) {
    return api.post<Delivery>(`/delivery/${deliveryId}/claim`);
  },

  async myDeliveries(params?: { page?: number; page_size?: number }) {
    // Backend API route: GET /delivery/assigned
    return api.get<PaginatedResponse<Delivery>>("/delivery/assigned", { params });
  },

  async updateStatus(
    deliveryId: number,
    status: "accepted" | "picked_up" | "out_for_delivery" | "failed",
    coords?: { dest_lat?: number; dest_lon?: number }
  ) {
    return api.put(`/delivery/${deliveryId}/status`, {
      status,
      destination_latitude: coords?.dest_lat,
      destination_longitude: coords?.dest_lon,
    });
  },

  async verifyOtp(deliveryId: number, data: { otp: string; latitude: number; longitude: number }) {
    return api.post(`/delivery/${deliveryId}/verify-otp`, data);
  },
};
