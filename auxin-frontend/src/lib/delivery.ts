/**
 * auxin-frontend/src/lib/delivery.ts
 * ------------------------------------
 * Delivery partner API client. Auth token injected by the Axios interceptor in api.ts.
 */

import api from "./api";
import type { Delivery } from "@/types";

export const deliveryApi = {
  async myDeliveries() {
    return api.get<Delivery[]>("/delivery/my-assignments");
  },

  async updateStatus(deliveryId: number, status: "picked_up" | "out_for_delivery") {
    return api.put(`/delivery/${deliveryId}/status`, { status });
  },

  async verifyOtp(deliveryId: number, otp: string) {
    return api.post(`/delivery/${deliveryId}/verify-otp`, { otp });
  },
};
