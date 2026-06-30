"use client";
/**
 * app/(admin)/layout.tsx — Auxin Admin v2.0
 * Dark Stripe-inspired admin shell.
 * Guards: must be authenticated + isAdminRole.
 */
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { isAdminRole, adminRoleLabel, type AdminRole } from "../../types";
import { PageLoader } from "../../components/ui/Card";
import { Sidebar, SidebarToggle } from "../../components/layout/Sidebar";
import { DemoBanner } from "../../components/ui/DemoBanner";


/* Route → human title map */
const TITLE_MAP: Record<string, string> = {
  dashboard:  "Dashboard",
  farmers:    "Farmers",
  products:   "Products",
  orders:     "Orders",
  deliveries: "Deliveries",
  payments:   "Payments",
  disputes:   "Disputes",
  users:      "All Users",
  settings:   "Settings",
};

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth");
      return;
    }
    if (!isAdminRole(user.role)) {
      router.replace("/auth");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user) return <PageLoader />;
  if (!isAdminRole(user.role)) return <PageLoader />;

  // Derive page title from pathname
  const segment = pathname.split("/").pop() ?? "dashboard";
  const pageTitle = TITLE_MAP[segment] ?? (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg, #0F0F10)" }}
    >
      {/* Demo mode amber notice — always visible when active */}
      <DemoBanner />

      {/* Sidebar + main content row */}
      <div className="flex flex-1 min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header
            className="sticky top-0 z-30 flex-shrink-0"
            style={{
              background: "var(--surface, #18181B)",
              borderBottom: "1px solid var(--border, #27272A)",
              height: "var(--header-h, 60px)",
            }}
          >
            <div className="flex items-center h-full px-4 sm:px-6 gap-4">
              <SidebarToggle onClick={() => setSidebarOpen(true)} />

              <div className="flex-1 min-w-0">
                <h1 className="text-base font-bold text-[#F4F4F5] truncate">{pageTitle}</h1>
              </div>

              {/* Role badge */}
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap"
                style={{
                  background: "rgba(34,197,94,0.1)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: "#22C55E",
                }}
              >
                {adminRoleLabel(user.role as AdminRole)}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto animate-fade-in">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

