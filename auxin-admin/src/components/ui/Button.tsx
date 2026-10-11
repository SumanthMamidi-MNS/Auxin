"use client";
/**
 * components/ui/Button.tsx — Auxin Admin v2.0 Phase 3.1
 * Premium dashboard button using design system tokens.
 */

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "pill";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
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
    "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-[var(--bg)] active:scale-[0.97]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-fg)] " +
      "hover:bg-[var(--primary-dim)] " +
      "shadow-[0_4px_14px_var(--primary-glow)] hover:shadow-[0_6px_18px_var(--primary-glow)] " +
      "focus-visible:ring-[var(--primary)] " +
      "duration-150",
    secondary:
      "bg-[var(--primary-subtle)] text-[var(--primary)] " +
      "border border-[var(--primary-glow-sm)] hover:border-[var(--primary-ring)] " +
      "hover:bg-[rgba(34,197,94,0.12)] " +
      "focus-visible:ring-[var(--primary)] " +
      "duration-150",
    ghost:
      "bg-transparent text-[var(--text-secondary)] " +
      "hover:bg-[var(--hover-overlay)] hover:text-[var(--text-primary)] " +
      "focus-visible:ring-[var(--border-hover)] " +
      "duration-150",
    danger:
      "bg-[var(--danger-bg)] text-[var(--danger)] " +
      "border border-[var(--danger-border)] " +
      "hover:bg-[rgba(239,68,68,0.18)] hover:border-[rgba(239,68,68,0.38)] " +
      "focus-visible:ring-[var(--danger)] " +
      "duration-150",
    outline:
      "bg-transparent text-[var(--text-primary)] " +
      "border border-[var(--border-2)] " +
      "hover:bg-[var(--hover-overlay)] hover:border-[var(--border-hover)] " +
      "focus-visible:ring-[var(--border-hover)] " +
      "duration-150",
    pill:
      "bg-[var(--surface-2)] text-[var(--text-secondary)] " +
      "border border-[var(--border)] rounded-full " +
      "hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] " +
      "focus-visible:ring-[var(--border-hover)] " +
      "duration-150",
  };

  const sizes: Record<string, string> = {
    xs:   "text-xs  px-2.5 py-1.5 h-7  rounded-lg gap-1.5",
    sm:   "text-sm  px-3.5 py-2   h-9  rounded-xl",
    md:   "text-sm  px-5   py-2.5 h-11 rounded-xl",
    lg:   "text-base px-6  py-3   h-12 rounded-2xl",
    icon: "text-sm  w-9 h-9 p-0  rounded-xl",
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
        (disabled || loading) && "opacity-45 cursor-not-allowed pointer-events-none",
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
