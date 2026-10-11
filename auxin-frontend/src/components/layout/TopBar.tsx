"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, Bell, ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { clsx } from "clsx";
import { signOut } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/orders";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function TopBar({
  title,
  showBack = false,
  action,
  className,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    clearAuth();
    toast.success("Signed out.");
    router.push("/auth");
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-40",
        transparent
          ? "bg-transparent"
          : "border-b",
        !transparent && "backdrop-blur-xl",
        className
      )}
      style={
        transparent
          ? {}
          : {
              background: "var(--surface-overlay)",
              borderColor: "var(--border)",
            }
      }
    >
      <div className="max-w-full md:max-w-4xl lg:max-w-6xl mx-auto flex items-center h-14 px-4 sm:px-6 lg:px-8 gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <h1
          className="flex-1 text-xl font-bold truncate"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h1>

        {action}

        {!action && (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150"
            style={{
              color: "var(--text-tertiary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--danger-bg)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-tertiary)";
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

/** Brand header for home page — Auxin gold+green identity */
export function BrandHeader() {
  const [showNotifications, setShowNotifications] = useState(false);

  const { data } = useQuery({
    queryKey: ["my-orders-notifications"],
    queryFn: () => ordersApi.myOrders({ page: 1, page_size: 10 }).then((r) => r.data),
    refetchInterval: 30000,
  });

  const activeOrders = data?.items?.filter((o) => ["pending", "accepted"].includes(o.status)) ?? [];
  const hasNotifications = activeOrders.length > 0;

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-xl"
      style={{
        background: "var(--surface-overlay)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="max-w-full md:max-w-4xl lg:max-w-6xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
      {/* Brand Logo */}
      <div className="flex items-center gap-2.5">
        {/* Real logo image */}
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center relative flex-shrink-0 border"
          style={{ borderColor: "var(--border)" }}
        >
          <img
            src="/logo-cropped.png"
            alt="Auxin Logo"
            className="w-full h-full object-cover scale-110"
          />
        </div>
        <span
          className="font-black tracking-tight text-lg"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
          }}
        >
          Auxin
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 relative"
            style={{ color: "var(--text-secondary)" }}
          >
            <Bell className="w-[18px] h-[18px]" />
            {hasNotifications && (
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--danger)" }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-72 rounded-2xl border p-4 shadow-2xl z-50 animate-slide-down"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border-2)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div
                className="flex items-center justify-between pb-2.5 mb-2.5"
                style={{ borderBottom: "1px solid var(--divider)" }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
                >
                  Notifications
                </span>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  className="text-[10px] font-medium"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto scrollbar-hide">
                {data?.items && data.items.length > 0 ? (
                  data.items.slice(0, 5).map((order) => {
                    let msg = "";
                    let icon = "📦";
                    if (order.status === "pending") { msg = `Order #${order.id}: Payment pending`; icon = "⏳"; }
                    else if (order.status === "accepted") { msg = `Order #${order.id}: Accepted — Processing`; icon = "✅"; }
                    else if (order.status === "completed") { msg = `Order #${order.id}: Delivered!`; icon = "🎉"; }
                    else if (order.status === "cancelled") { msg = `Order #${order.id}: Cancelled`; icon = "❌"; }
                    else msg = `Order #${order.id} — ${order.status}`;

                    return (
                      <Link
                        key={order.id}
                        href="/customer/orders"
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl transition-all"
                        style={{ background: "var(--surface-3)" }}
                      >
                        <span className="text-base flex-shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] leading-normal" style={{ color: "var(--text-secondary)" }}>
                            {msg}
                          </p>
                          <p className="text-[9px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                            {new Date(order.updated_at || order.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-[11px] text-center py-4" style={{ color: "var(--text-tertiary)" }}>
                    No recent updates
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </header>
);
}
