"use client";
/**
 * components/ui/ETABadge.tsx — Auxin v3.0
 * Estimated Time of Arrival pill indicator with live status dot and time duration.
 */

import { Clock } from "lucide-react";
import { clsx } from "clsx";

interface ETABadgeProps {
  eta?: string | null;
  status?: string;
  className?: string;
  size?: "sm" | "md";
}

export function ETABadge({
  eta,
  status = "in_transit",
  className,
  size = "md",
}: ETABadgeProps) {
  if (!eta) return null;

  const isDelivered = status === "delivered" || status === "completed";

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-all",
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs sm:text-sm",
        isDelivered
          ? "bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]"
          : "bg-[var(--primary-subtle)] text-[var(--primary-deep)] border border-[var(--primary-glow)]",
        className
      )}
    >
      {!isDelivered ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]" />
        </span>
      ) : (
        <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      )}
      <span>{eta}</span>
    </div>
  );
}
