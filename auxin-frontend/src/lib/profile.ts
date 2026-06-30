/**
 * auxin-frontend/src/lib/profile.ts
 * ---------------------------------
 * Profile API client for GET/POST/PUT `/profile`.
 */

import api from "./api";
import type { User } from "@/types";

export const profileApi = {
  async getProfile() {
    return api.get<User>("/profile/me");
  },

  async createProfile(data: { name: string; phone: string; address: string }) {
    return api.post<User>("/profile", data);
  },

  async updateProfile(data: { name?: string; phone?: string; address?: string }) {
    return api.put<User>("/profile", data);
  },
};
