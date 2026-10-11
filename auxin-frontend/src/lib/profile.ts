/**
 * auxin-frontend/src/lib/profile.ts
 * ---------------------------------
 * Profile API client for GET/POST/PUT `/profile` and addresses.
 */

import api from "./api";
import type { User, Address } from "@/types";

export interface AddressCreatePayload {
  house_flat: string;
  building?: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pin_code: string;
  address_type: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface AddressUpdatePayload {
  house_flat?: string;
  building?: string;
  street?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  address_type?: string;
  is_default?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateProfilePayload {
  name: string;
  phone: string;
  house_flat: string;
  building?: string;
  street: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pin_code: string;
  address_type?: string;
  latitude?: number | null;
  longitude?: number | null;
  farm_name?: string;
  farm_category?: string;
}

export const profileApi = {
  async getProfile() {
    return api.get<User>("/profile/me");
  },

  async createProfile(data: CreateProfilePayload) {
    return api.post<User>("/profile", data);
  },

  async resubmitProfile() {
    return api.post<User>("/profile/resubmit");
  },

  async updateProfile(data: { name?: string; phone?: string }) {
    return api.put<User>("/profile", data);
  },

  async listAddresses() {
    return api.get<Address[]>("/profile/addresses");
  },

  async createAddress(data: AddressCreatePayload) {
    return api.post<Address>("/profile/addresses", data);
  },

  async updateAddress(id: number, data: AddressUpdatePayload) {
    return api.put<Address>(`/profile/addresses/${id}`, data);
  },

  async deleteAddress(id: number) {
    return api.delete(`/profile/addresses/${id}`);
  },

  async setDefaultAddress(id: number) {
    return api.put<Address>(`/profile/addresses/${id}/default`);
  },
};
export default profileApi;
