"use client";

/**
 * auxin-frontend/src/app/providers.tsx
 * ----------------------------------------
 * Global providers for the Auxin customer/farmer/delivery app.
 *
 * v2.0 changes:
 *  - Adds Supabase auth state listener (onAuthStateChange).
 *  - On sign-in: fetches user profile from backend, populates store.
 *  - On sign-out: clears the store.
 *  - Removed legacy token bootstrap from localStorage.
 */

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getMe } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";
import { ColdStartLoader } from "@/components/ui/ColdStartLoader";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,        // 1 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthListener({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Bootstrap: check for an existing session on mount
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const me = await getMe();
        if (me) setAuth(me);
      }
    })();

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const me = await getMe();
          if (me) setAuth(me);
        } else if (event === "SIGNED_OUT") {
          clearAuth();
        } else if (event === "TOKEN_REFRESHED" && session) {
          // Token silently refreshed — no action needed; session is current
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth]);

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const isColdStart = useAppStore((s) => s.isColdStart);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener>
        {isColdStart && <ColdStartLoader />}
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1a2e1a",
              color: "#d1fae5",
              border: "1px solid rgba(52, 211, 153, 0.2)",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </AuthListener>
    </QueryClientProvider>
  );
}

