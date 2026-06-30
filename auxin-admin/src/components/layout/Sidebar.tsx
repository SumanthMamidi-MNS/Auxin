"use client";
/**
 * components/layout/Sidebar.tsx — Auxin Admin v2.0
 * Deep dark sidebar with neon emerald active state.
 * Permission-aware nav items based on admin role.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ClipboardList,
  ShieldAlert, LogOut, Menu, X, Truck, Settings,
  CreditCard, Leaf, UserCog,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "../../store/authStore";
import { adminSignOut } from "../../lib/auth";
import { hasPermission, isAdminRole, adminRoleLabel, type AdminRole, type Permission } from "../../types";
import toast from "react-hot-toast";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission: Permission | null;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",  label: "Dashboard",       icon: LayoutDashboard, permission: null },
  { href: "/farmers",    label: "Farmers",          icon: Leaf,            permission: "manage_farmers" },
  { href: "/products",   label: "Products",         icon: Package,         permission: "manage_products" },
  { href: "/orders",     label: "Orders",           icon: ClipboardList,   permission: "manage_orders" },
  { href: "/deliveries", label: "Deliveries",       icon: Truck,           permission: "manage_delivery" },
  { href: "/payments",   label: "Payments",         icon: CreditCard,      permission: "manage_finances" },
  { href: "/disputes",   label: "Disputes",         icon: ShieldAlert,     permission: "manage_disputes" },
  { href: "/users",      label: "All Users",        icon: UserCog,         permission: "manage_users" },
  { href: "/settings",   label: "Settings",         icon: Settings,        permission: null },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, clearAuth } = useAuthStore();
  const pathname = usePathname();
  const router   = useRouter();

  const role = user?.role as AdminRole | undefined;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.permission) return true;
    if (!role || !isAdminRole(role)) return false;
    return hasPermission(role, item.permission);
  });

  const handleLogout = async () => {
    await adminSignOut();
    clearAuth();
    toast.success("Signed out.");
    router.push("/auth");
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={clsx(
          "fixed top-0 left-0 h-full z-50 flex flex-col",
          "transition-transform duration-250 ease-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          width: "var(--sidebar-w, 240px)",
          background: "var(--sidebar-bg, #0A0A0B)",
          borderRight: "1px solid #1A1A1D",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-[60px] flex-shrink-0"
          style={{ borderBottom: "1px solid #1A1A1D" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}
          >
            <Leaf className="w-4 h-4 text-[#22C55E]" />
          </div>
          <div className="min-w-0">
            <p className="text-[#F4F4F5] font-black text-base leading-none tracking-tight">Auxin</p>
            <p className="text-[#52525B] text-[10px] mt-0.5">Admin Portal</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[#52525B] hover:text-[#F4F4F5] hover:bg-white/5 transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User profile */}
        {user && (
          <div className="px-4 py-4" style={{ borderBottom: "1px solid #1A1A1D" }}>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{
                  background: "rgba(34,197,94,0.12)",
                  border: "1px solid rgba(34,197,94,0.2)",
                  color: "#22C55E",
                }}
              >
                {user.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <div className="min-w-0">
                <p className="text-[#F4F4F5] text-sm font-semibold truncate">{user.name}</p>
                <p className="text-[#52525B] text-[10px] mt-0.5">
                  {role ? adminRoleLabel(role) : "Admin"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
          {visibleItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                  active
                    ? ""
                    : "text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/5"
                )}
                style={
                  active
                    ? {
                        background: "rgba(34,197,94,0.1)",
                        color: "#22C55E",
                        border: "1px solid rgba(34,197,94,0.15)",
                      }
                    : {}
                }
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0 transition-colors duration-150"
                  strokeWidth={active ? 2.5 : 1.75}
                />
                <span>{label}</span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: "#22C55E" }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #1A1A1D" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#EF4444] hover:bg-[#EF4444]/8 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-white/5 transition-all"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
