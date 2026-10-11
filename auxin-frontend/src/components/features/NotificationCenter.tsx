"use client";
/**
 * components/features/NotificationCenter.tsx — Auxin v3.0
 * Notification drawer with live unread badge, milestone alerts, and quick navigation.
 */

import { useState, useEffect, useRef } from "react";
import { Bell, X, Package, Truck, CheckCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "order" | "delivery" | "promo" | "alert";
  link?: string;
}

const SAMPLE_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Order Dispatched 🚚",
    message: "Your fresh harvest is out for delivery. Share your 6-digit OTP at doorstep.",
    timestamp: "Just now",
    read: false,
    type: "delivery",
    link: "/customer/orders",
  },
  {
    id: "notif-2",
    title: "Farm Packing Underway 🌾",
    message: "Demo Farm has begun carefully packing your organic produce.",
    timestamp: "15m ago",
    read: false,
    type: "order",
    link: "/customer/orders",
  },
  {
    id: "notif-3",
    title: "Order Confirmed 🎉",
    message: "Your payment is safely held in Razorpay Escrow.",
    timestamp: "1h ago",
    read: true,
    type: "order",
    link: "/customer/orders",
  },
];

interface NotificationCenterProps {
  className?: string;
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(SAMPLE_NOTIFICATIONS);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleItemClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div ref={dropdownRef} className={clsx("relative", className)}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Open notifications"
        className="relative w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-xs active:scale-95"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[var(--primary)] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-scale-pop">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-xl z-50 overflow-hidden animate-slide-down">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--divider)] bg-[var(--surface-warm)]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--primary)] text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--divider)]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-tertiary)]">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => {
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={clsx(
                      "p-3.5 flex items-start gap-3 cursor-pointer transition-colors",
                      notif.read
                        ? "bg-[var(--surface)] hover:bg-[var(--surface-2)]"
                        : "bg-[var(--primary-subtle)] hover:bg-[rgba(34,197,94,0.1)]"
                    )}
                  >
                    <div
                      className={clsx(
                        "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                        notif.type === "delivery"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-[var(--primary-subtle)] text-[var(--primary)]"
                      )}
                    >
                      {notif.type === "delivery" ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-[var(--text-tertiary)] flex-shrink-0">
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>

                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-tertiary)] mt-2 flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
