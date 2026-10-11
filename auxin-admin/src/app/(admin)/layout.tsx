"use client";
/**
 * app/(admin)/layout.tsx — Auxin Admin v2.0
 * Dark Stripe-inspired admin shell.
 * Guards: must be authenticated + isAdminRole.
 */
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { isAdminRole, adminRoleLabel, hasPermission, type AdminRole } from "../../types";
import { PageLoader } from "../../components/ui/Card";
import { Sidebar, SidebarToggle } from "../../components/layout/Sidebar";
import { DemoBanner } from "../../components/ui/DemoBanner";
import { ShieldAlert } from "lucide-react";


import { adminSignOut, getSession, getAdminMe } from "../../lib/auth";

/* Route → human title map */
const TITLE_MAP: Record<string, string> = {
  dashboard:  "Dashboard",
  farmers:    "Farmers",
  catalogue:  "Master Catalogue",
  categories: "Catalogue Categories",
  orders:     "Orders",
  deliveries: "Deliveries",
  payments:   "Payments",
  disputes:   "Disputes",
  users:      "All Users",
  "demo-workspace": "Demo Workspace",
  settings:   "Settings",
};

export default function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, setAuth, clearAuth } = useAuthStore();
  const router   = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [connError, setConnError] = useState(false);

  const checkSession = async () => {
    try {
      setConnError(false);
      const session = await getSession();
      if (!session) {
        clearAuth();
        router.replace("/auth");
        return;
      }

      const me = await getAdminMe();
      if (!me) {
        clearAuth();
        await adminSignOut();
        router.replace("/auth");
        return;
      }

      if (!isAdminRole(me.role)) {
        clearAuth();
        await adminSignOut();
        router.replace("/auth");
        return;
      }

      setAuth(me);
      setIsValidating(false);
    } catch (err) {
      console.error("Session verification failed:", err);
      setConnError(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/auth");
      return;
    }
    checkSession();
  }, [isAuthenticated]);

  if (connError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F10] p-4 text-[#F4F4F5]">
        <div className="w-full max-w-sm border border-[#27272A] bg-[#18181B] rounded-2xl p-6 space-y-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F4F4F5]">Connection Error</h3>
            <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
              Unable to verify your administrator session with the server. Please check your internet connection or the server status.
            </p>
          </div>
          <button
            onClick={() => checkSession()}
            className="w-full h-10 rounded-xl bg-[#22C55E] text-[#052E16] hover:bg-[#22C55E]/90 text-sm font-semibold transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (isValidating || !isAuthenticated || !user) return <PageLoader />;
  if (!isAdminRole(user.role)) return <PageLoader />;

  // Derive page title from pathname
  const segment = pathname.split("/").pop() ?? "dashboard";
  const pageTitle = TITLE_MAP[segment] ?? (segment ? segment.charAt(0).toUpperCase() + segment.slice(1) : "Dashboard");

  // Permission checks
  const isSuperOnlyPage = ["admins", "logs"].includes(segment);
  const isSuper = user.is_super_admin === true;

  const hasPagePermission = (() => {
    if (isSuperOnlyPage) return isSuper;
    
    // Check page permissions based on route
    if (segment === "users") return hasPermission(user.role as AdminRole, "manage_users");
    if (segment === "farmers") return hasPermission(user.role as AdminRole, "manage_farmers");
    if (segment === "delivery-partners") return hasPermission(user.role as AdminRole, "manage_delivery");
    if (segment === "catalogue" || segment === "categories") return hasPermission(user.role as AdminRole, "manage_products");
    if (segment === "orders") return hasPermission(user.role as AdminRole, "manage_orders");
    if (segment === "payments") return hasPermission(user.role as AdminRole, "manage_finances");
    if (segment === "disputes") return hasPermission(user.role as AdminRole, "manage_disputes");
    
    return true;
  })();

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
                {user.is_super_admin ? "Super Admin" : adminRoleLabel(user.role as AdminRole)}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-5 sm:p-7 max-w-7xl w-full mx-auto animate-fade-in">
            {hasPagePermission ? children : (
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4 py-20 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#F4F4F5]">Access Denied</h2>
                  <p className="text-sm text-[#71717A] mt-2 max-w-sm">
                    You do not have permission to view the <span className="text-[#F4F4F5] font-semibold">{pageTitle}</span> page. Please contact a Super Admin if you believe this is an error.
                  </p>
                </div>
                <button
                  onClick={() => router.replace("/dashboard")}
                  className="mt-2 h-10 px-6 rounded-xl bg-[#18181B] border border-[#27272A] text-[#F4F4F5] hover:bg-white/5 transition-all text-sm font-medium"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

