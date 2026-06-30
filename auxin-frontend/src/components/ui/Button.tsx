"use client";
/**
 * components/ui/Button.tsx — Auxin v2.0
 * Premium dark-theme button with neon emerald brand accent.
 */

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0B] select-none cursor-pointer";

  const variants: Record<string, string> = {
    primary:
      "bg-[#22C55E] text-[#052E16] hover:bg-[#16A34A] active:scale-[0.98] focus-visible:ring-[#22C55E] shadow-[0_4px_14px_rgba(34,197,94,0.25)]",
    secondary:
      "bg-[#18181B] text-[#22C55E] border border-[#22C55E]/30 hover:bg-[#22C55E]/10 hover:border-[#22C55E]/50 active:scale-[0.98] focus-visible:ring-[#22C55E]",
    ghost:
      "bg-transparent text-[#A1A1AA] hover:bg-white/5 hover:text-[#FAFAFA] active:scale-[0.98] focus-visible:ring-white/20",
    danger:
      "bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/25 hover:bg-[#EF4444]/20 hover:border-[#EF4444]/40 active:scale-[0.98] focus-visible:ring-[#EF4444]",
    outline:
      "bg-transparent text-[#FAFAFA] border border-[#3F3F46] hover:bg-white/5 hover:border-[#52525B] active:scale-[0.98] focus-visible:ring-white/20",
  };

  const sizes: Record<string, string> = {
    xs: "text-xs px-2.5 py-1.5 h-7 rounded-lg",
    sm: "text-sm px-3.5 py-2 h-9",
    md: "text-sm px-5 py-2.5 h-11",
    lg: "text-base px-6 py-3 h-12",
  };

  return (
    <button
      className={clsx(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        (disabled || loading) && "opacity-50 cursor-not-allowed pointer-events-none",
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
