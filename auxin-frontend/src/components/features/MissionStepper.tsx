"use client";
/**
 * components/features/MissionStepper.tsx — Auxin v3.0
 * Visual icon-based 4-step progress stepper for Delivery Partner Mission HUD:
 * 1. Claimed -> 2. Heading to Farm -> 3. Packed & Picked -> 4. Doorstep OTP Delivered
 */

import { Check, Compass, PackageCheck, Navigation, Home, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";

export interface MissionStep {
  id: string;
  label: string;
  sublabel: string;
  icon: typeof Check;
}

const MISSION_STEPS: MissionStep[] = [
  { id: "assigned", label: "Accepted", sublabel: "Job claimed", icon: Compass },
  { id: "accepted", label: "To Farm", sublabel: "Heading to pickup", icon: Navigation },
  { id: "picked_up", label: "Picked Up", sublabel: "Packed harvest loaded", icon: PackageCheck },
  { id: "out_for_delivery", label: "Doorstep", sublabel: "Verify OTP & complete", icon: Home },
];

function getMissionStepIndex(status: string): number {
  switch (status.toLowerCase()) {
    case "assigned":
      return 0;
    case "accepted":
      return 1;
    case "picked_up":
      return 2;
    case "out_for_delivery":
      return 3;
    case "delivered":
    case "completed":
      return 4;
    default:
      return 0;
  }
}

interface MissionStepperProps {
  status: string;
  className?: string;
}

export function MissionStepper({ status, className }: MissionStepperProps) {
  const currentIdx = getMissionStepIndex(status);

  return (
    <div className={clsx("w-full py-2", className)}>
      <div className="flex items-center justify-between relative">
        {/* Track Line Background */}
        <div className="absolute left-6 right-6 top-4.5 h-1 bg-white/20 rounded-full -z-0" />

        {/* Active Track Line Progress */}
        <div
          className="absolute left-6 top-4.5 h-1 bg-white rounded-full -z-0 transition-all duration-500"
          style={{ width: `${Math.min(100, (currentIdx / (MISSION_STEPS.length - 1)) * 100)}%` }}
        />

        {MISSION_STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const StepIcon = step.icon;

          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5 z-10 flex-1 text-center">
              <div
                className={clsx(
                  "w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md",
                  isCurrent
                    ? "bg-white text-[var(--primary-deep)] scale-110 shadow-lg"
                    : isDone
                    ? "bg-emerald-200 text-[var(--primary-deep)]"
                    : "bg-black/30 text-white/60 border border-white/20"
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <StepIcon className="w-4 h-4" />
                )}
              </div>

              <div className="px-1">
                <p
                  className={clsx(
                    "text-[10px] sm:text-xs font-bold tracking-tight leading-tight",
                    isCurrent ? "text-white font-black" : isDone ? "text-emerald-100" : "text-white/60"
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
