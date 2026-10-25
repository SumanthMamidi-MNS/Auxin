"use client";
/** app/delivery/layout.tsx — Role guard: delivery only. Redirects pending accounts. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/ui/Card";
import { isAdminRole } from "@/types";
import { profileApi } from "@/lib/profile";

// Admin portal lives on a separate domain/port — never in this app
const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ??
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://admin.auxin.in"
    : "http://localhost:3001");

import { DesktopSidebar } from "@/components/layout/DesktopSidebar";

export default function DeliveryLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) { router.replace("/auth"); return; }
    if (!user) return;
    if (user.role !== "delivery") {
      // Wrong role — redirect to correct home
      if (isAdminRole(user.role)) { window.location.href = ADMIN_URL; return; }
      if (user.role === "customer") router.replace("/customer/home");
      else if (user.role === "farmer") router.replace("/farmer/dashboard");
      else router.replace("/auth");
      return;
    }
    // Check profile completion first
    (async () => {
      try {
        await profileApi.getProfile();
        // Correct role — check approval status
        if (user.status === "pending" || user.status === "rejected") { router.replace("/pending-approval"); return; }
        if (user.status === "suspended") {
          router.replace("/auth");
        }
      } catch (err: any) {
        const status = err?.status ?? err?.response?.status;
        if (status === 404 && !user?.address) {
          router.replace("/profile/create");
        }
      }
    })();
  }, [hydrated, isAuthenticated, user, router]);

  if (!hydrated || !isAuthenticated || !user) return <PageLoader />;
  if (user.role !== "delivery") return <PageLoader />;
  if (user.status !== "approved") return <PageLoader />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-[240px]">
        <main className="flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Mobile/Tablet Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
