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
};
