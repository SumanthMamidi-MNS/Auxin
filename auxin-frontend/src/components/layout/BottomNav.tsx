"use client";
/**
 * components/layout/BottomNav.tsx — Auxin v2.0
 * Dark theme mobile bottom navigation, role-adaptive with cart badge.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home, Package, ShoppingCart, ClipboardList,
  Truck, LayoutDashboard, Wallet,
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
  const { user }  = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount);
  const pathname  = usePathname();

  if (!user || isAdminRole(user.role)) return null;

  const navItems: NavItem[] = (() => {
    switch (user.role) {
      case "customer":
        return [
          { href: "/customer/home",   label: "Home",   icon: Home },
          { href: "/customer/cart",   label: "Cart",   icon: ShoppingCart, badge: cartCount || 0 },
          { href: "/customer/orders", label: "Orders", icon: ClipboardList },
        ];
      case "farmer":
        return [
          { href: "/farmer/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/farmer/products",  label: "Products",  icon: Package },
          { href: "/farmer/orders",    label: "Orders",    icon: ClipboardList },
        ];
      case "delivery":
        return [
          { href: "/delivery/dashboard", label: "Deliveries", icon: Truck },
          { href: "/delivery/earnings",  label: "Earnings",   icon: Wallet },
        ];
      default:
        return [];
    }
  })();

  if (navItems.length === 0) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "#0F0F10",
        borderTop: "1px solid #1A1A1D",
        boxShadow: "0 -8px 32px rgba(0,0,0,0.6)",
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto pb-safe">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 relative"
            >
              {/* Active glow underline at top */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full"
                  style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.6)" }}
                />
              )}

              <div className="relative">
                <Icon
                  className={clsx(
                    "w-5 h-5 transition-colors duration-150",
                    active ? "text-[#22C55E]" : "text-[#52525B]"
                  )}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                {badge !== undefined && badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-1.5 text-[#052E16] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none"
                    style={{ background: "#22C55E" }}
                  >
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>

              <span
                className={clsx(
                  "text-[10px] font-medium transition-colors duration-150",
                  active ? "text-[#22C55E]" : "text-[#52525B]"
                )}
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
