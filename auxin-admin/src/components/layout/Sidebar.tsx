"use client";
/**
 * components/layout/Sidebar.tsx — Auxin Admin v2.0 Phase 3.1
 * Premium dashboard sidebar with design token-based active state.
 * Permission-aware nav items based on admin role.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard, Users, Package, ClipboardList,
  ShieldAlert, LogOut, Menu, X, Truck, Settings,
  CreditCard, Leaf, UserCog, UserCheck, Layers,
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
  permission: Permission | "super_admin_only" | null;
}

const GROUP_1: NavItem[] = [
  { href: "/dashboard",         label: "Dashboard",         icon: LayoutDashboard, permission: null },
  { href: "/approvals",         label: "Approvals",         icon: UserCheck,       permission: null },
  { href: "/demo-workspace",    label: "Demo Workspace",    icon: Layers,          permission: null },
];

const GROUP_2: NavItem[] = [
  { href: "/users",             label: "Customers",         icon: Users,           permission: "manage_users" },
  { href: "/farmers",           label: "Farmers",           icon: Leaf,            permission: "manage_farmers" },
  { href: "/delivery-partners", label: "Delivery Partners", icon: Truck,           permission: "manage_delivery" },
];

const GROUP_3: NavItem[] = [
  { href: "/catalogue",            label: "Catalogue",         icon: Package,         permission: "manage_products" },
  { href: "/catalogue/categories", label: "Categories",        icon: Layers,          permission: "manage_products" },
  { href: "/orders",               label: "Orders",            icon: ClipboardList,   permission: "manage_orders" },
  { href: "/payments",             label: "Payments",          icon: CreditCard,      permission: "manage_finances" },
];

const GROUP_4: NavItem[] = [
  { href: "/admins",            label: "Admins",            icon: UserCog,         permission: "super_admin_only" },
  { href: "/logs",              label: "Audit Logs",        icon: ClipboardList,   permission: "super_admin_only" },
  { href: "/settings",          label: "Settings",          icon: Settings,        permission: null },
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

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => {
      if (!item.permission) return true;
      if (item.permission === "super_admin_only") {
        return user?.is_super_admin === true;
      }
      if (!role || !isAdminRole(role)) return false;
      return hasPermission(role, item.permission);
    });

  const handleLogout = async () => {
    await adminSignOut();
    clearAuth();
    toast.success("Signed out.");
    router.push("/auth");
  };

  const renderLink = ({ href, label, icon: Icon }: NavItem) => {
    const isExact = pathname === href;
    const isChild = href !== "/dashboard" && href !== "/catalogue" && pathname.startsWith(href + "/");
    const active = isExact || isChild;
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        onClick={onClose}
        className={clsx(
          "relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium",
          "transition-all duration-150 group overflow-hidden",
          active
            ? "text-[var(--primary)]"
            : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)]"
        )}
        style={
          active
            ? {
                background: "var(--primary-subtle)",
                border: "1px solid var(--primary-glow-sm)",
              }
            : {}
        }
      >
        {/* Left accent bar */}
        {active && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
            style={{ background: "var(--primary)", boxShadow: "0 0 8px var(--primary-glow)" }}
          />
        )}
        <Icon
          className="w-4 h-4 flex-shrink-0 transition-colors duration-150"
          strokeWidth={active ? 2.5 : 1.75}
        />
        <span>{label}</span>
        {active && (
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "var(--primary)" }}
          />
        )}
      </Link>
    );
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
          "transition-transform duration-[250ms] ease-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          width: "var(--sidebar-w, 240px)",
          background: "var(--sidebar-bg, var(--bg))",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-[60px] flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: "1px solid var(--border)" }}
          >
            <Image
              src="/logo-cropped.png"
              alt="Auxin Logo"
              fill
              className="object-cover scale-110"
              priority
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-[var(--text-primary)] font-black text-base leading-none tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Auxin
            </p>
            <p className="text-[var(--text-tertiary)] text-[10px] mt-0.5">Admin Portal</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] transition-all"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User profile */}
        {user && (() => {
          const rawName = user.name === "Platform Admin" ? "Sumanth Mamidi" : (user.name ?? "Admin");
          const firstName = rawName.trim().split(/\s+/)[0];
          const displayRole = user.is_super_admin ? "Super Admin" : adminRoleLabel(user.role as string);
          return (
            <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold animate-pulse-subtle"
                  style={{
                    background: "var(--primary-subtle)",
                    border: "1px solid var(--primary-glow-sm)",
                    color: "var(--primary)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-primary)] text-sm font-semibold truncate">{firstName}</p>
                  <p className="text-[var(--text-tertiary)] text-[10px] mt-0.5">
                    {displayRole}
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide space-y-0.5">
          {/* Overview */}
          <p className="px-2 pb-1 pt-0.5 text-[9px] uppercase font-black tracking-widest text-[var(--text-quaternary,#52525B)]">Overview</p>
          {filterItems(GROUP_1).map(renderLink)}

          {filterItems(GROUP_2).length > 0 && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-2 text-[9px] uppercase font-black tracking-widest text-[var(--text-quaternary,#52525B)]">Directory</p>
              </div>
              <div className="space-y-0.5">{filterItems(GROUP_2).map(renderLink)}</div>
            </>
          )}

          {filterItems(GROUP_3).length > 0 && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-2 text-[9px] uppercase font-black tracking-widest text-[var(--text-quaternary,#52525B)]">Commerce</p>
              </div>
              <div className="space-y-0.5">{filterItems(GROUP_3).map(renderLink)}</div>
            </>
          )}

          {filterItems(GROUP_4).length > 0 && (
            <>
              <div className="pt-3 pb-1">
                <p className="px-2 text-[9px] uppercase font-black tracking-widest text-[var(--text-quaternary,#52525B)]">System</p>
              </div>
              <div className="space-y-0.5">{filterItems(GROUP_4).map(renderLink)}</div>
            </>
          )}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all duration-150"
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
      className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] transition-all"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
