"use client";
/** app/customer/layout.tsx — Role guard: customer only */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/ui/Card";
import { isAdminRole } from "@/types";

// Admin portal lives on a separate domain/port — never in this app
const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://admin.auxin.in"
    : "http://localhost:3001");

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) { router.replace("/auth"); return; }
    if (!user) return;
    if (user.role === "customer") {
      if (!user.address) {
        router.replace("/profile/create");
      }
      return;
    }
    // Wrong role — redirect to correct home
    if (isAdminRole(user.role)) {
      // Admin portal is a separate app — use full URL redirect
      window.location.href = ADMIN_URL;
      return;
    }
    if (user.role === "farmer") router.replace("/farmer/dashboard");
    else if (user.role === "delivery") router.replace("/delivery/dashboard");
    else router.replace("/auth");
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return <PageLoader />;
  if (user.role !== "customer") return <PageLoader />;

  return (
    <div className="max-w-lg mx-auto min-h-screen" style={{ background: "#0A0A0B" }}>
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
