"use client";
/**
 * components/ui/TrustBadge.tsx — Auxin v3.0
 * Reassurance trust signal badge (Razorpay Escrow, 100% Farm Direct, 25km Local).
 */

import { ShieldCheck, Truck, Sprout, Sparkles } from "lucide-react";
import { clsx } from "clsx";

interface TrustBadgeProps {
  type?: "escrow" | "farm_direct" | "fresh_local" | "organic";
  variant?: "pill" | "card" | "inline";
  className?: string;
}

export function TrustBadge({
  type = "escrow",
  variant = "pill",
  className,
}: TrustBadgeProps) {
  const configs = {
    escrow: {
      icon: ShieldCheck,
      title: "Razorpay Escrow Protection",
      description: "Payment released to farmer & courier only after doorstep OTP verification.",
      tag: "Safe & Protected",
      color: "var(--primary)",
      bg: "var(--primary-subtle)",
      border: "var(--primary-glow)",
    },
    farm_direct: {
      icon: Sprout,
      title: "100% Farm Direct",
      description: "Zero middlemen. 100% of profit margins flow straight to the producer.",
      tag: "Fair Trade",
      color: "var(--gold)",
      bg: "rgba(212, 175, 55, 0.08)",
      border: "rgba(212, 175, 55, 0.25)",
    },
    fresh_local: {
      icon: Truck,
      title: "25 KM Hyper-Local",
      description: "Harvested and delivered within a 25 km radius for peak nutritional freshness.",
      tag: "Same Day Fresh",
      color: "var(--info)",
      bg: "rgba(56, 189, 248, 0.08)",
      border: "rgba(56, 189, 248, 0.25)",
    },
    organic: {
      icon: Sparkles,
      title: "Certified Organic",
      description: "Verified pesticide-free and naturally cultivated by certified growers.",
      tag: "Pure Produce",
      color: "var(--primary-dim)",
      bg: "rgba(34, 197, 94, 0.08)",
      border: "rgba(34, 197, 94, 0.25)",
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  if (variant === "inline") {
    return (
      <div className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]", className)}>
        <Icon className="w-4 h-4 text-[var(--primary)]" />
        <span>{config.title}</span>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={clsx(
          "rounded-2xl p-4 border flex items-start gap-3.5 transition-all",
          className
        )}
        style={{ background: config.bg, borderColor: config.border }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs"
          style={{ background: "var(--surface)", color: config.color }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              {config.title}
            </h4>
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
              style={{ background: "var(--surface)", color: config.color }}
            >
              {config.tag}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
            {config.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-xs",
        className
      )}
      style={{ background: config.bg, borderColor: config.border, color: config.color }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-[var(--text-primary)]">{config.title}</span>
    </div>
  );
}
