"use client";
/**
 * components/ui/PriceBadge.tsx — Auxin v3.0
 * Formatted currency display for Indian Rupees (₹) with unit labels,
 * strikethrough original prices, price ranges for multi-farmer catalog items.
 */

import { clsx } from "clsx";

interface PriceBadgeProps {
  price: number;
  maxPrice?: number;
  originalPrice?: number;
  unit?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function PriceBadge({
  price,
  maxPrice,
  originalPrice,
  unit,
  size = "md",
  className,
}: PriceBadgeProps) {
  const isRange = maxPrice !== undefined && maxPrice > price;

  const sizeStyles = {
    sm: {
      price: "text-sm font-bold",
      unit: "text-[11px]",
      original: "text-xs",
    },
    md: {
      price: "text-base lg:text-lg font-bold",
      unit: "text-xs",
      original: "text-xs",
    },
    lg: {
      price: "text-xl lg:text-2xl font-extrabold",
      unit: "text-sm",
      original: "text-sm",
    },
    xl: {
      price: "text-2xl lg:text-3xl font-black",
      unit: "text-base",
      original: "text-base",
    },
  };

  const s = sizeStyles[size];

  return (
    <div className={clsx("inline-flex items-baseline gap-1.5 flex-wrap", className)}>
      <div className="inline-flex items-baseline" style={{ fontFamily: "var(--font-heading)" }}>
        <span className={clsx("text-[var(--text-price)] tracking-tight", s.price)}>
          {isRange ? `₹${price} - ₹${maxPrice}` : `₹${price}`}
        </span>
        {unit && (
          <span className={clsx("text-[var(--text-secondary)] font-normal ml-0.5", s.unit)}>
            /{unit}
          </span>
        )}
      </div>

      {originalPrice && originalPrice > price && (
        <span className={clsx("text-[var(--text-price-old)] line-through font-normal", s.original)}>
          ₹{originalPrice}
        </span>
      )}
    </div>
  );
}
