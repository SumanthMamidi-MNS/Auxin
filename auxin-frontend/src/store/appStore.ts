/**
 * store/appStore.ts — Auxin v2.0
 * Lightweight global app state (cold start UX, backend status).
 * Separate from authStore to avoid circular dependencies.
 */

import { create } from "zustand";

interface AppState {
  /** True when the backend is waking up from Render free-tier sleep */
  isColdStart: boolean;
  /** Cold start detected at timestamp (ms) — for timeout calculation */
  coldStartAt: number | null;
  setColdStart: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isColdStart: false,
  coldStartAt: null,
  setColdStart: (value) =>
    set({
      isColdStart: value,
      coldStartAt: value ? Date.now() : null,
    }),
}));
