"use client";
/**
 * components/ui/Card.tsx — Auxin Admin v2.0 Phase 3.1
 * Premium dashboard surface components using design system tokens.
 * Exports: Card, Badge, Spinner, PageLoader, EmptyState, SectionHeader,
 *          StatCard, Divider, ProgressBar, SkeletonBlock
 */

import { clsx } from "clsx";
import type { ReactNode } from "react";
import Image from "next/image";

/* ═══════════════════════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export function Card({
  children,
  className,
  onClick,
  hover = false,
  elevated = false,
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  elevated?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div
      onClick={onClick}
      className={clsx(
        "border rounded-2xl",
        elevated
          ? "bg-[var(--surface-2)] border-[var(--border-2)]"
          : "bg-[var(--surface)]   border-[var(--border)]",
        paddings[padding],
        hover &&
          "cursor-pointer hover:border-[var(--border-hover)] hover:scale-[1.008] hover:shadow-md " +
          "transition-all duration-200 ease-out active:scale-[0.99]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  pending:          { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  reserved:         { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  payment_pending:  { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  payment_confirmed:{ bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  accepted:         { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  packing:          { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  ready_for_pickup: { bg: "rgba(56,189,248,0.12)",  text: "#38BDF8" },
  completed:        { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  delivered:        { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  approved:         { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  active:           { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  paid:             { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  resolved:         { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  rejected:         { bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
  cancelled:        { bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
  failed:           { bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
  suspended:        { bg: "rgba(239,68,68,0.12)",   text: "#EF4444" },
  open:             { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  in_review:        { bg: "rgba(56,189,248,0.12)",  text: "#38BDF8" },
  assigned:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  picked_up:        { bg: "rgba(99,102,241,0.12)",  text: "#818CF8" },
  out_for_delivery: { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  created:          { bg: "rgba(161,161,170,0.12)", text: "#A1A1AA" },
  refund_pending:   { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  refund_completed: { bg: "rgba(161,161,170,0.12)", text: "#71717A" },
  refunded:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  inactive:         { bg: "rgba(161,161,170,0.12)", text: "#71717A" },
  customer:         { bg: "rgba(56,189,248,0.12)",  text: "#38BDF8" },
  farmer:           { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  delivery:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  admin:            { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  super_admin:      { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  support_admin:    { bg: "rgba(56,189,248,0.12)",  text: "#38BDF8" },
  operations_admin: { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  logistics_admin:  { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
};

export function Badge({
  label,
  className,
  dot = false,
}: {
  label?: string | null;
  className?: string;
  dot?: boolean;
}) {
  const safeLabel = label || "Unknown";
  const key = safeLabel.toLowerCase().replace(/[\s-]+/g, "_");
  const config = STATUS_CONFIG[key] ?? { bg: "rgba(161,161,170,0.12)", text: "#A1A1AA" };
  const displayLabel = safeLabel.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
        className
      )}
      style={{ background: config.bg, color: config.text }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.text }} />}
      {displayLabel}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPINNER
   ═══════════════════════════════════════════════════════════════════════════ */

export function Spinner({
  size = "md",
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={clsx(
        "rounded-full border-2 border-[var(--border-2)] border-t-[var(--primary)] animate-spin",
        sizes[size],
        className
      )}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE LOADER
   ═══════════════════════════════════════════════════════════════════════════ */

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-[var(--bg)]">
      <div className="relative w-20 h-20 rounded-3xl bg-[#141A29] shadow-2xl border border-emerald-500/30 p-2.5 flex items-center justify-center animate-pulse">
        <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/20 to-amber-500/20 rounded-3xl blur-lg pointer-events-none" />
        <Image
          src="/logo-cropped.png"
          alt="Auxin Logo"
          width={64}
          height={64}
          className="object-contain relative z-10"
          priority
        />
      </div>
      <div className="text-center space-y-1">
        <span
          className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          AUXIN ADMIN
        </span>
        <p className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
          Zero-Trust Governance Console
        </p>
      </div>
      <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
        <div className="w-full h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 animate-shimmer" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4 animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)]">
        {icon}
      </div>
      <div>
        <h3
          className="font-semibold text-[var(--text-primary)] text-base"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[var(--text-tertiary)] text-sm mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  color = "green",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "green" | "amber" | "blue" | "red" | "purple";
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    green:  { bg: "rgba(34,197,94,0.10)",  text: "#22C55E" },
    amber:  { bg: "rgba(245,158,11,0.10)", text: "#F59E0B" },
    blue:   { bg: "rgba(56,189,248,0.10)", text: "#38BDF8" },
    red:    { bg: "rgba(239,68,68,0.10)",  text: "#EF4444" },
    purple: { bg: "rgba(168,85,247,0.10)", text: "#A855F7" },
  };
  const c = colors[color];
  const trendColors = { up: "#22C55E", down: "#EF4444", neutral: "#A1A1AA" };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: c.bg }}
        >
          <span style={{ color: c.text }}>{icon}</span>
        </div>
      </div>
      <div>
        <p
          className="text-2xl font-black text-[var(--text-primary)] leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1.5">{label}</p>
        {trendLabel && (
          <p
            className="text-xs font-medium mt-1"
            style={{ color: trend ? trendColors[trend] : "#A1A1AA" }}
          >
            {trendLabel}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2
          className="text-base font-bold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DIVIDER
   ═══════════════════════════════════════════════════════════════════════════ */

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx("divider", className)} />;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PROGRESS BAR
   ═══════════════════════════════════════════════════════════════════════════ */

export function ProgressBar({
  value,
  max = 100,
  color = "green",
  size = "md",
  className,
}: {
  value: number;
  max?: number;
  color?: "green" | "amber" | "blue" | "red";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColors: Record<string, string> = {
    green: "var(--primary)",
    amber: "var(--warning)",
    blue:  "var(--info)",
    red:   "var(--danger)",
  };
  const heights: Record<string, string> = { sm: "h-1", md: "h-1.5", lg: "h-2.5" };

  return (
    <div className={clsx("w-full rounded-full overflow-hidden bg-[var(--border)]", heights[size], className)}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, background: barColors[color] }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON BLOCK
   ═══════════════════════════════════════════════════════════════════════════ */

export function SkeletonBlock({
  className,
  height = "h-4",
  rounded = "rounded-xl",
}: {
  className?: string;
  height?: string;
  rounded?: string;
}) {
  return <div className={clsx("skeleton w-full", height, rounded, className)} />;
}
