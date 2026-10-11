"use client";
/**
 * components/ui/QuantityStepper.tsx — Auxin v3.0
 * Unified plus/minus quantity stepper with smooth transitions and haptic feedback.
 */

import { Plus, Minus, Trash2 } from "lucide-react";
import { clsx } from "clsx";

interface QuantityStepperProps {
  quantity: number;
  onIncrement: (e?: React.MouseEvent) => void;
  onDecrement: (e?: React.MouseEvent) => void;
  max?: number;
  min?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTrashAtOne?: boolean;
}

export function QuantityStepper({
  quantity,
  onIncrement,
  onDecrement,
  max = 99,
  min = 0,
  size = "md",
  className,
  showTrashAtOne = false,
}: QuantityStepperProps) {
  const sizeStyles = {
    sm: {
      btn: "w-6 h-6 rounded-md",
      icon: "w-3 h-3",
      qty: "w-6 text-xs font-bold",
      container: "p-0.5",
    },
    md: {
      btn: "w-8 h-8 rounded-lg",
      icon: "w-3.5 h-3.5",
      qty: "w-8 text-sm font-bold",
      container: "p-1",
    },
    lg: {
      btn: "w-10 h-10 rounded-xl",
      icon: "w-4 h-4",
      qty: "w-10 text-base font-bold",
      container: "p-1.5",
    },
  };

  const s = sizeStyles[size];

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (quantity > min) onDecrement(e);
  };

  const handleInc = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (quantity < max) onIncrement(e);
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={clsx(
        "inline-flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)]",
        s.container,
        className
      )}
    >
      <button
        type="button"
        onClick={handleDec}
        disabled={quantity <= min}
        className={clsx(
          "flex items-center justify-center transition-all duration-150 active:scale-90",
          s.btn,
          "bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)]",
          "disabled:opacity-40 disabled:pointer-events-none shadow-xs"
        )}
        aria-label="Decrease quantity"
      >
        {showTrashAtOne && quantity === 1 ? (
          <Trash2 className={clsx(s.icon, "text-[var(--danger)]")} />
        ) : (
          <Minus className={s.icon} />
        )}
      </button>

      <span
        className={clsx(
          "text-center text-[var(--text-primary)] select-none tabular-nums",
          s.qty
        )}
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {quantity}
      </span>

      <button
        type="button"
        onClick={handleInc}
        disabled={quantity >= max}
        className={clsx(
          "flex items-center justify-center transition-all duration-150 active:scale-90",
          s.btn,
          "bg-[var(--primary)] text-[#FFFFFF] hover:bg-[var(--primary-hover)]",
          "disabled:opacity-40 disabled:pointer-events-none shadow-xs"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={s.icon} />
      </button>
    </div>
  );
}
