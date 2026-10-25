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
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { getMe } from "@/lib/auth";
import { profileApi } from "@/lib/profile";
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
  const router = useRouter();

  useEffect(() => {
    // Bootstrap: check for an existing session on mount
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const me = await getMe();
          if (me) {
            setAuth(me);
            // Verify backend profile existence
            try {
              await profileApi.getProfile();
            } catch (err: any) {
              const status = err?.status ?? err?.response?.status;
              if (status === 404 && !window.location.pathname.includes("pending") && !window.location.pathname.includes("dashboard") && !window.location.pathname.includes("inventory") && !window.location.pathname.includes("orders") && !window.location.pathname.includes("earnings")) {
                router.replace("/profile/create");
              }
            }
          }
        }
      } catch (err) {
        console.error("Auth listener bootstrap failed:", err);
      }
    })();

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const me = await getMe();
          if (me) {
            setAuth(me);
            // Verify backend profile existence
            try {
              await profileApi.getProfile();
            } catch (err: any) {
              const status = err?.status ?? err?.response?.status;
              if (status === 404 && !window.location.pathname.includes("pending") && !window.location.pathname.includes("dashboard") && !window.location.pathname.includes("inventory") && !window.location.pathname.includes("orders") && !window.location.pathname.includes("earnings")) {
                router.replace("/profile/create");
              }
            }
          }
        } else if (event === "SIGNED_OUT") {
          clearAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [setAuth, clearAuth, router]);

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
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl, 12px)",
              fontSize: "14px",
              fontFamily: "var(--font-body, sans-serif)",
            },
          }}
        />
      </AuthListener>
    </QueryClientProvider>
  );
}

