"use client";
/**
 * components/layout/BottomNav.tsx — Auxin v3.0
 * Role-adaptive mobile bottom navigation bar with active indicator lines,
 * badge counters, and safe-area padding.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home, Package, ShoppingCart, ClipboardList,
  Truck, Wallet, User as UserIcon, Heart,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { isAdminRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export function BottomNav() {
  const { user } = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount);
  const pathname = usePathname();

  if (!user || isAdminRole(user.role)) return null;

  const navItems: NavItem[] = (() => {
    switch (user.role) {
      case "customer":
        return [
          { href: "/customer/home", label: "Home", icon: Home },
          { href: "/customer/cart", label: "Cart", icon: ShoppingCart, badge: cartCount || 0 },
          { href: "/customer/wishlist", label: "Wishlist", icon: Heart },
          { href: "/customer/orders", label: "Orders", icon: ClipboardList },
          { href: "/profile", label: "Profile", icon: UserIcon },
        ];
      case "farmer":
        return [
          { href: "/farmer/dashboard", label: "Home", icon: Home },
          { href: "/farmer/inventory", label: "Inventory", icon: Package },
          { href: "/farmer/orders", label: "Orders", icon: ClipboardList },
          { href: "/farmer/earnings", label: "Earnings", icon: Wallet },
          { href: "/farmer/profile", label: "Profile", icon: UserIcon },
        ];
      case "delivery":
        return [
          { href: "/delivery/dashboard", label: "Deliveries", icon: Truck },
          { href: "/delivery/history", label: "History", icon: ClipboardList },
          { href: "/delivery/earnings", label: "Earnings", icon: Wallet },
          { href: "/delivery/profile", label: "Profile", icon: UserIcon },
        ];
      default:
        return [];
    }
  })();

  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 lg:hidden"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto pb-safe">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-1 relative group select-none"
            >
              {/* Active top indicator border line */}
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-b-full transition-all duration-300"
                style={{
                  width: active ? "28px" : "0px",
                  background: "var(--primary)",
                  boxShadow: active ? "0 0 8px rgba(34,197,94,0.3)" : "none",
                  opacity: active ? 1 : 0,
                }}
              />

              {/* Icon Container */}
              <div
                className="relative flex items-center justify-center w-9 h-7 rounded-full transition-all duration-200"
                style={{
                  background: active ? "var(--primary-glow)" : "transparent",
                }}
              >
                <Icon
                  className="transition-all duration-200"
                  style={{
                    width: "18px",
                    height: "18px",
                    color: active ? "var(--primary)" : "var(--text-secondary)",
                  }}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none"
                    style={{ background: "var(--primary)" }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-bold transition-colors duration-200 truncate max-w-[60px]"
                style={{
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
