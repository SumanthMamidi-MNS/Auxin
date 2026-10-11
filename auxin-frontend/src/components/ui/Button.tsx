"use client";
/**
 * components/ui/Button.tsx — Auxin v3.0
 * Premium button component supporting primary green, gold accent, secondary,
 * ghost, outline, and pill variants with interactive micro-motion.
 */

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "gold" | "secondary" | "ghost" | "danger" | "outline" | "pill";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon";
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer " +
    "transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-[var(--bg)] active:scale-[0.98]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--primary)] text-[#FFFFFF] " +
      "hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)] " +
      "shadow-[0_4px_16px_var(--primary-glow)] hover:shadow-[0_6px_20px_var(--primary-glow)] " +
      "focus-visible:ring-[var(--primary)]",
    gold:
      "bg-[var(--gold)] text-[#FFFFFF] " +
      "hover:bg-[var(--gold-dim)] " +
      "shadow-[0_4px_16px_var(--gold-glow)] hover:shadow-[0_6px_20px_var(--gold-glow)] " +
      "focus-visible:ring-[var(--gold)]",
    secondary:
      "bg-[var(--primary-subtle)] text-[var(--primary-deep)] " +
      "border border-[var(--primary-glow)] hover:border-[var(--primary-ring)] " +
      "hover:bg-[rgba(34,197,94,0.12)] " +
      "focus-visible:ring-[var(--primary)]",
    ghost:
      "bg-transparent text-[var(--text-secondary)] " +
      "hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)] " +
      "focus-visible:ring-[var(--border-focus)]",
    danger:
      "bg-[var(--danger-bg)] text-[var(--danger)] " +
      "border border-[var(--danger-border)] " +
      "hover:bg-[rgba(239,68,68,0.18)] hover:border-[rgba(239,68,68,0.40)] " +
      "focus-visible:ring-[var(--danger)]",
    outline:
      "bg-transparent text-[var(--text-primary)] " +
      "border border-[var(--border-2)] " +
      "hover:bg-[var(--hover-overlay)] hover:border-[var(--border-hover)] " +
      "focus-visible:ring-[var(--border-hover)]",
    pill:
      "bg-[var(--surface)] text-[var(--text-secondary)] " +
      "border border-[var(--border)] rounded-full shadow-xs " +
      "hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] " +
      "focus-visible:ring-[var(--border-hover)]",
  };

  const sizes: Record<string, string> = {
    xs:   "text-xs px-2.5 py-1 h-7 rounded-lg gap-1.5",
    sm:   "text-xs sm:text-sm px-3.5 py-1.5 h-9 rounded-xl gap-1.5",
    md:   "text-sm px-5 py-2.5 h-11 rounded-xl gap-2",
    lg:   "text-base px-6 py-3 h-12 sm:h-13 rounded-2xl gap-2.5",
    xl:   "text-base sm:text-lg px-8 py-3.5 h-14 rounded-2xl gap-3 font-bold",
    icon: "text-sm w-10 h-10 p-0 rounded-xl",
  };

  const roundedOverride = variant === "pill" ? "rounded-full" : "";

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        roundedOverride,
        fullWidth && "w-full",
        (disabled || loading) && "opacity-40 cursor-not-allowed pointer-events-none active:scale-100",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </button>
  );
}
