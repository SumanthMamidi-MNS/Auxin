"use client";
/**
 * components/ui/Card.tsx — Auxin v3.0
 * Premium mobile-first surface components using design system tokens.
 * Exports: Card, Badge, Spinner, PageLoader, EmptyState, SectionHeader,
 *          StatCard, Divider, ProgressBar, SkeletonBlock
 */

import { clsx } from "clsx";
import { Leaf, ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export function Card({
  children,
  className,
  onClick,
  hover = false,
  glow = false,
  padding = "md",
  elevated = false,
  radius = "md",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
  elevated?: boolean;
  padding?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}) {
  const paddings = {
    none: "",
    xs:   "p-2",
    sm:   "p-3",
    md:   "p-4 sm:p-5",
    lg:   "p-5 sm:p-6",
    xl:   "p-6 sm:p-8",
  };

  const radiuses = {
    none: "rounded-none",
    sm:   "rounded-lg",
    md:   "rounded-xl",
    lg:   "rounded-2xl",
    xl:   "rounded-3xl",
    "2xl":"rounded-[24px]",
    full: "rounded-full",
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        "border transition-all duration-200",
        radiuses[radius],
        elevated
          ? "bg-[var(--surface-2)] border-[var(--border-2)] shadow-xs"
          : "bg-[var(--surface)] border-[var(--border)] shadow-xs",
        paddings[padding],
        hover &&
          "cursor-pointer hover:border-[var(--card-hover-border)] hover:bg-[var(--surface)] hover:-translate-y-0.5 hover:shadow-[var(--card-hover-shadow)] " +
          "active:translate-y-0 active:scale-[0.995]",
        glow && "shadow-[var(--shadow-green)]",
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending:          { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  reserved:         { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  payment_pending:  { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  payment_confirmed:{ bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  accepted:         { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  packing:          { bg: "rgba(168,85,247,0.12)",  text: "#7E22CE", dot: "#A855F7" },
  ready_for_pickup: { bg: "rgba(56,189,248,0.12)",  text: "#0369A1", dot: "#38BDF8" },
  completed:        { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  delivered:        { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  approved:         { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  active:           { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  in_stock:         { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  available:        { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  sold_out:         { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  out_of_stock:     { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  paid:             { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  resolved:         { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  rejected:         { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  cancelled:        { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  failed:           { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  suspended:        { bg: "rgba(239,68,68,0.12)",   text: "#B91C1C", dot: "#EF4444" },
  open:             { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  in_review:        { bg: "rgba(56,189,248,0.12)",  text: "#0369A1", dot: "#38BDF8" },
  assigned:         { bg: "rgba(168,85,247,0.12)",  text: "#7E22CE", dot: "#A855F7" },
  picked_up:        { bg: "rgba(99,102,241,0.12)",  text: "#4338CA", dot: "#818CF8" },
  out_for_delivery: { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  created:          { bg: "rgba(161,161,170,0.12)", text: "#52525B", dot: "#A1A1AA" },
  refund_pending:   { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
  refund_completed: { bg: "rgba(161,161,170,0.12)", text: "#52525B", dot: "#71717A" },
  refunded:         { bg: "rgba(168,85,247,0.12)",  text: "#7E22CE", dot: "#A855F7" },
  inactive:         { bg: "rgba(161,161,170,0.12)", text: "#52525B", dot: "#71717A" },
  customer:         { bg: "rgba(56,189,248,0.12)",  text: "#0369A1", dot: "#38BDF8" },
  farmer:           { bg: "rgba(34,197,94,0.12)",   text: "#15803D", dot: "#22C55E" },
  delivery:         { bg: "rgba(168,85,247,0.12)",  text: "#7E22CE", dot: "#A855F7" },
  admin:            { bg: "rgba(245,158,11,0.12)",  text: "#B45309", dot: "#F59E0B" },
};

export function Badge({
  label,
  className,
  dot = false,
  size = "md",
}: {
  label: string;
  className?: string;
  dot?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const key = label.toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_CONFIG[key] ?? {
    bg: "rgba(161,161,170,0.12)",
    text: "#52525B",
    dot: "#A1A1AA",
  };
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-xs font-bold",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap",
        sizeStyles[size],
        className
      )}
      style={{ background: config.bg, color: config.text }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: config.dot }}
        />
      )}
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[var(--bg)]">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-glow)] flex items-center justify-center shadow-xs">
          <Leaf className="w-5 h-5 text-[var(--primary)]" />
        </div>
        <span
          className="text-[var(--text-primary)] font-bold text-xl tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Auxin
        </span>
      </div>
      <Spinner size="sm" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */

export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  illustration?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx(
      "flex flex-col items-center justify-center py-12 lg:py-16 px-4 text-center gap-4 animate-fade-in max-w-sm mx-auto",
      className
    )}>
      {illustration ? (
        <div className="flex items-center justify-center mb-1 transition-transform duration-300 hover:scale-105">
          {illustration}
        </div>
      ) : icon ? (
        <div
          className="w-18 h-18 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xs"
          style={{
            background: "var(--primary-subtle)",
            border: "1px solid var(--primary-glow-sm)",
            color: "var(--primary)",
          }}
        >
          {icon}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <h3
          className="font-bold text-[var(--text-primary)] text-lg"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h3>
        {description && (
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-[280px] mx-auto">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="pt-2 transition-all active:scale-95 duration-150">
          {action}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center justify-between mb-4", className)}>
      <div>
        <h2
          className="text-lg lg:text-xl font-bold text-[var(--text-primary)] tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h2>
        {subtitle && <p className="text-[var(--text-secondary)] text-xs lg:text-sm mt-0.5">{subtitle}</p>}
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
  variant = "standard",
  className,
  onClick,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "green" | "amber" | "blue" | "red" | "purple" | "gold";
  variant?: "standard" | "hero" | "compact";
  className?: string;
  onClick?: () => void;
}) {
  const colors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    green:  { bg: "rgba(34,197,94,0.10)",  text: "#22C55E", border: "rgba(34,197,94,0.20)", glow: "rgba(34,197,94,0.15)" },
    amber:  { bg: "rgba(245,158,11,0.10)", text: "#F59E0B", border: "rgba(245,158,11,0.20)", glow: "rgba(245,158,11,0.15)" },
    blue:   { bg: "rgba(56,189,248,0.10)", text: "#38BDF8", border: "rgba(56,189,248,0.20)", glow: "rgba(56,189,248,0.15)" },
    red:    { bg: "rgba(239,68,68,0.10)",  text: "#EF4444", border: "rgba(239,68,68,0.20)", glow: "rgba(239,68,68,0.15)" },
    purple: { bg: "rgba(168,85,247,0.10)", text: "#A855F7", border: "rgba(168,85,247,0.20)", glow: "rgba(168,85,247,0.15)" },
    gold:   { bg: "rgba(212,175,55,0.10)", text: "#D4AF37", border: "rgba(212,175,55,0.25)", glow: "rgba(212,175,55,0.15)" },
  };
  const c = colors[color] || colors.green;
  const trendColors = { up: "#22C55E", down: "#EF4444", neutral: "#A1A1AA" };

  if (variant === "hero") {
    return (
      <div
        onClick={onClick}
        className={clsx(
          "relative overflow-hidden rounded-2xl p-5 lg:p-6 border transition-all duration-200 shadow-xs",
          onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]",
          className
        )}
        style={{
          background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-warm) 100%)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {label}
            </p>
            <p
              className="text-3xl lg:text-4xl font-black text-[var(--text-primary)] leading-none tracking-tight"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {value}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs"
            style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
          >
            {icon}
          </div>
        </div>

        {trendLabel && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[var(--divider)]">
            {trend === "up" && <ArrowUpRight className="w-4 h-4 text-[var(--success)]" />}
            {trend === "down" && <ArrowDownRight className="w-4 h-4 text-[var(--danger)]" />}
            <span
              className="text-xs font-semibold"
              style={{ color: trend ? trendColors[trend] : "var(--text-secondary)" }}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        onClick={onClick}
        className={clsx(
          "flex items-center gap-3 p-3.5 rounded-xl border bg-[var(--surface)] border-[var(--border)] transition-all shadow-xs",
          onClick && "cursor-pointer hover:border-[var(--card-hover-border)] hover:bg-[var(--surface-2)]",
          className
        )}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: c.bg, color: c.text }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-lg font-bold text-[var(--text-primary)] leading-tight truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {value}
          </p>
          <p className="text-xs text-[var(--text-secondary)] truncate">{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={clsx(
        "flex flex-col gap-3 p-4 rounded-2xl border bg-[var(--surface)] border-[var(--border)] transition-all shadow-xs relative overflow-hidden min-w-0",
        onClick && "cursor-pointer hover:border-[var(--card-hover-border)] hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.99]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}
        >
          {icon}
        </div>
        {trend && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: trend === "up" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: trendColors[trend],
            }}
          >
            {trend === "up" ? "↑" : "↓"} {trendLabel}
          </span>
        )}
      </div>

      <div>
        <p
          className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-none tracking-tight truncate tabular-nums"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium truncate">{label}</p>
      </div>
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
    <div
      className={clsx(
        "w-full rounded-full overflow-hidden bg-[var(--border)]",
        heights[size],
        className
      )}
    >
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
