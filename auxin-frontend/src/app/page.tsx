"use client";
/**
 * app/page.tsx — Root redirect
 * Admins are redirected to the separate admin portal (port 3001 in dev,
 * or NEXT_PUBLIC_ADMIN_URL in production).
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { isAdminRole } from "@/types";
import { PageLoader } from "@/components/ui/Card";

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://admin.auxin.in"
    : "http://localhost:3001");

function getRoleRoute(role: string): string {
  switch (role) {
    case "customer": return "/customer/home";
    case "farmer":   return "/farmer/dashboard";
    case "delivery": return "/delivery/dashboard";
    default:         return "/auth";
  }
}

export default function RootPage() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth");
      return;
    }

    if (isAdminRole(user.role)) {
      // Admin users do not belong in this app — sign them out cleanly and
      // redirect to the admin portal. This prevents token confusion.
      clearAuth();
      window.location.href = ADMIN_URL;
      return;
    }

    router.replace(getRoleRoute(user.role));
  }, [isAuthenticated, user, router, clearAuth]);

  return <PageLoader />;
}
