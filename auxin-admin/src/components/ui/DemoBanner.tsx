"use client";
/**
 * components/ui/DemoBanner.tsx — Auxin Admin v2.0
 * Non-dismissible amber banner shown during investor demo sessions.
 * Rendered by the admin shell layout when NEXT_PUBLIC_DEMO_MODE=true.
 *
 * Ensures no one accidentally believes they are modifying production data.
 */

import { AlertTriangle } from "lucide-react";

export function DemoBanner() {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!isDemoMode) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium"
      style={{
        background: "rgba(245,158,11,0.12)",
        borderBottom: "1px solid rgba(245,158,11,0.3)",
        color: "#F59E0B",
      }}
      role="alert"
      aria-live="polite"
    >
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>
        <strong>DEMO MODE</strong> — All actions affect sandbox data only.
        Production data is completely isolated and untouched.
      </span>
      <span
        className="ml-auto shrink-0 px-2 py-0.5 rounded-full text-xs font-bold"
        style={{
          background: "rgba(245,158,11,0.2)",
          border: "1px solid rgba(245,158,11,0.4)",
        }}
      >
        SANDBOX
      </span>
    </div>
  );
}
