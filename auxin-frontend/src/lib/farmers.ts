/**
 * auxin-frontend/src/lib/farmers.ts
 * ------------------------------------
 * Farmer profile API client. Auth token injected by the Axios interceptor in api.ts.
 */

import api from "./api";
import type { Farmer } from "@/types";

export const farmersApi = {
  async createProfile(data: {
    full_name: string;
    phone: string;
    location: string;
    bank_account_number: string;
    ifsc_code: string;
  }) {
    return api.post<Farmer>("/farmers/profile", data);
  },

  async myProfile() {
    return api.get<Farmer>("/farmers/profile/me");
  },

  async updateProfile(data: {
    location?: string;
    bank_name?: string;
    account_holder_name?: string;
    bank_account_number?: string;
    ifsc_code?: string;
    upi_id?: string;
    farm_name?: string;
    farm_category?: string;
  }) {
    return api.put<Farmer>("/farmers/profile/me", data);
  },
};
