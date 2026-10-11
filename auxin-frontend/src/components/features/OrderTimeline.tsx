"use client";
/**
 * components/features/OrderTimeline.tsx — Auxin v3.0
 * Reusable 5-milestone interactive order progress timeline.
 * Steps: 1. Confirmed -> 2. Packing -> 3. Courier Assigned -> 4. Out for Delivery -> 5. Delivered
 */

import { Check, ClipboardList, Package, Truck, Navigation, Home, AlertCircle } from "lucide-react";
import { clsx } from "clsx";

export interface TimelineStep {
  id: string;
  label: string;
  /** Compact label used by the horizontal stepper on small screens */
  short?: string;
  description?: string;
  icon: typeof Check;
}

const MILESTONES: TimelineStep[] = [
  { id: "confirmed", label: "Order Confirmed", short: "Confirmed", description: "Payment escrow locked", icon: ClipboardList },
  { id: "packing", label: "Farm Packing", short: "Packing", description: "Fresh harvest prepared", icon: Package },
  { id: "assigned", label: "Courier Assigned", short: "Courier", description: "Partner heading to farm", icon: Navigation },
  { id: "out_for_delivery", label: "On the Road", short: "On the way", description: "Heading to your doorstep", icon: Truck },
  { id: "delivered", label: "Delivered", short: "Delivered", description: "Doorstep OTP verified", icon: Home },
];

function getStepIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "pending":
    case "reserved":
    case "payment_pending":
    case "payment_confirmed":
    case "accepted":
      return 0; // Confirmed
    case "packing":
    case "ready_for_pickup":
      return 1; // Packing
    case "assigned":
    case "picked_up":
      return 2; // Courier
    case "out_for_delivery":
      return 3; // On the road
    case "delivered":
    case "completed":
      return 4; // Delivered
    default:
      return 0;
  }
}

interface OrderTimelineProps {
  status: string;
  isFailed?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function OrderTimeline({
  status,
  isFailed = false,
  className,
  orientation = "horizontal",
}: OrderTimelineProps) {
  const currentIndex = getStepIndex(status);

  if (orientation === "vertical") {
    return (
      <div className={clsx("flex flex-col gap-4 relative pl-3", className)}>
        {MILESTONES.map((step, idx) => {
          const isDone = idx <= currentIndex && !isFailed;
          const isCurrent = idx === currentIndex && !isFailed;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="relative flex items-start gap-3.5">
              {/* Connector line to next step */}
              {idx < MILESTONES.length - 1 && (
                <div
                  className={clsx(
                    "absolute left-4.5 top-9 w-0.5 -bottom-2 transition-colors duration-500",
                    idx < currentIndex ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  )}
                />
              )}

              {/* Step Circle Icon */}
              <div
                className={clsx(
                  "w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 z-10 shadow-xs",
                  isCurrent
                    ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary-glow)] scale-105"
                    : isDone
                    ? "bg-[var(--primary-subtle)] text-[var(--primary)] border border-[var(--primary-glow)]"
                    : "bg-[var(--surface-2)] text-[var(--text-tertiary)] border border-[var(--border)]"
                )}
              >
                {isDone && !isCurrent ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              {/* Step Label & Subtitle */}
              <div className="pt-0.5">
                <p
                  className={clsx(
                    "text-xs sm:text-sm font-bold tracking-tight",
                    isCurrent
                      ? "text-[var(--primary-deep)] font-extrabold"
                      : isDone
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal Stepper (Mobile & Desktop Cards)
  return (
    <div className={clsx("w-full py-2", className)}>
      <div className="flex items-center justify-between relative">
        {/* Background Connecting Line */}
        <div className="absolute left-[10%] right-[10%] top-[15px] sm:top-[17px] h-0.5 bg-[var(--border)] -z-0" />
        
        {/* Active Progress Connecting Line */}
        <div
          className="absolute left-[10%] top-[15px] sm:top-[17px] h-0.5 bg-[var(--primary)] -z-0 transition-all duration-500"
          style={{ width: `${isFailed ? 0 : (currentIndex / (MILESTONES.length - 1)) * 80}%` }}
        />

        {MILESTONES.map((step, idx) => {
          const isDone = idx <= currentIndex && !isFailed;
          const isCurrent = idx === currentIndex && !isFailed;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 flex-1 text-center">
              <div
                className={clsx(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-300 shadow-xs",
                  isCurrent
                    ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary-glow)]"
                    : isDone
                    ? "bg-[var(--primary-muted)] text-[var(--primary-deep)] border-2 border-[var(--primary)]"
                    : "bg-[var(--surface)] text-[var(--text-tertiary)] border-2 border-[var(--border)]"
                )}
              >
                {isDone && !isCurrent ? (
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </div>

              <span
                className={clsx(
                  "text-[10px] sm:text-[11px] font-semibold leading-tight px-0.5",
                  isCurrent
                    ? "text-[var(--primary-deep)] font-extrabold"
                    : isDone
                    ? "text-[var(--text-primary)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                <span className="sm:hidden">{step.short ?? step.label}</span>
                <span className="hidden sm:inline">{step.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
