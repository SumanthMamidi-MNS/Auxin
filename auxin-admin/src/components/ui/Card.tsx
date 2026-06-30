"use client";
/**
 * components/ui/Card.tsx — Auxin Admin v2.0
 * Dark Stripe-inspired surface components.
 */

import { clsx } from "clsx";
import type { ReactNode } from "react";

/* ── Card ───────────────────────────────────────────────────────────────── */

export function Card({
  children,
  className,
  onClick,
  hover = false,
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };
  return (
    <div
      onClick={onClick}
      className={clsx(
        "bg-[#18181B] border border-[#27272A] rounded-2xl",
        paddings[padding],
        hover && "cursor-pointer hover:border-[#3F3F46] transition-colors duration-150",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ── Badge ──────────────────────────────────────────────────────────────── */

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  pending:          { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  accepted:         { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
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
  in_review:        { bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  assigned:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  picked_up:        { bg: "rgba(99,102,241,0.12)",  text: "#818CF8" },
  out_for_delivery: { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  created:          { bg: "rgba(161,161,170,0.12)", text: "#A1A1AA" },
  refunded:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  inactive:         { bg: "rgba(161,161,170,0.12)", text: "#71717A" },
  customer:         { bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  farmer:           { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
  delivery:         { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  admin:            { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  super_admin:      { bg: "rgba(245,158,11,0.12)",  text: "#F59E0B" },
  support_admin:    { bg: "rgba(59,130,246,0.12)",  text: "#3B82F6" },
  operations_admin: { bg: "rgba(168,85,247,0.12)",  text: "#A855F7" },
  logistics_admin:  { bg: "rgba(34,197,94,0.12)",   text: "#22C55E" },
};

export function Badge({
  label,
  className,
  dot = false,
}: {
  label: string;
  className?: string;
  dot?: boolean;
}) {
  const key = label.toLowerCase().replace(/[\s-]+/g, "_");
  const config = STATUS_CONFIG[key] ?? { bg: "rgba(161,161,170,0.12)", text: "#A1A1AA" };
  const displayLabel = label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", className)}
      style={{ background: config.bg, color: config.text }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: config.text }} />}
      {displayLabel}
    </span>
  );
}

/* ── Spinner ────────────────────────────────────────────────────────────── */

export function Spinner({ size = "md", className }: { size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sizes = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" };
  return (
    <div
      className={clsx("rounded-full border-2 border-[#27272A] border-t-[#22C55E] animate-spin", sizes[size], className)}
    />
  );
}

/* ── PageLoader ─────────────────────────────────────────────────────────── */

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F10]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
          <span className="text-[#22C55E] font-black text-lg">A</span>
        </div>
        <Spinner size="sm" />
      </div>
    </div>
  );
}

/* ── EmptyState ─────────────────────────────────────────────────────────── */

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
      <div className="w-16 h-16 rounded-2xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-[#52525B]">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-[#F4F4F5] text-base">{title}</h3>
        {description && <p className="text-[#71717A] text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── StatCard ───────────────────────────────────────────────────────────── */

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
    green:  { bg: "rgba(34,197,94,0.1)",  text: "#22C55E" },
    amber:  { bg: "rgba(245,158,11,0.1)", text: "#F59E0B" },
    blue:   { bg: "rgba(59,130,246,0.1)", text: "#3B82F6" },
    red:    { bg: "rgba(239,68,68,0.1)",  text: "#EF4444" },
    purple: { bg: "rgba(168,85,247,0.1)", text: "#A855F7" },
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
        <p className="text-2xl font-black text-[#F4F4F5] leading-none">{value}</p>
        <p className="text-xs text-[#71717A] mt-1.5">{label}</p>
        {trendLabel && (
          <p className="text-xs font-medium mt-1" style={{ color: trend ? trendColors[trend] : "#A1A1AA" }}>
            {trendLabel}
          </p>
        )}
      </div>
    </Card>
  );
}

/* ── SectionHeader ──────────────────────────────────────────────────────── */

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
        <h2 className="text-base font-bold text-[#F4F4F5]">{title}</h2>
        {subtitle && <p className="text-xs text-[#71717A] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
