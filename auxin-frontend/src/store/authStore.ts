/**
 * auxin-frontend/src/store/authStore.ts
 * ----------------------------------------
 * Zustand auth store for Auxin v2.0.
 *
 * v2.0 changes:
 *  - Supabase SDK manages tokens and sessions. This store only tracks
 *    the application-level user profile and auth state.
 *  - Manual localStorage token management removed.
 *  - Token keys (access_token / refresh_token) removed from localStorage.
 *  - Store is populated by the onAuthStateChange listener in providers.tsx.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const STORAGE_KEY = "auxin_auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      clearAuth: () => {
        // Clear cart on sign-out
        if (typeof window !== "undefined") {
          localStorage.removeItem("auxin_cart");
        }
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : ({} as Storage)
      ),
      // Persist only user and isAuthenticated — session tokens are owned by Supabase SDK
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
