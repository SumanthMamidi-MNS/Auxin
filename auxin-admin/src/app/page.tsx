"use client";
/**
 * app/page.tsx — Root redirect
 * If authenticated + admin role → dashboard
 * Otherwise → /auth
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/authStore";
import { isAdminRole } from "../types";
import { PageLoader } from "../components/ui/Card";

export default function RootPage() {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth");
    } else if (isAdminRole(user.role)) {
      router.replace("/dashboard");
    } else {
      // Non-admin user somehow on admin portal — sign out
      router.replace("/auth");
    }
  }, [isAuthenticated, user, router]);

  return <PageLoader />;
}
