"use client";
/**
 * app/error.tsx — Auxin Admin v2.0
 * Route-level error boundary for the admin portal.
 */

import { useEffect } from "react";
import { RefreshCw, Leaf, AlertTriangle } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Auxin Admin Error Boundary]", error.message, error.digest);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0F0F10" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.04) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md text-center space-y-6">
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}
        >
          <Leaf className="w-7 h-7 text-[#22C55E]" />
        </div>

        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#F4F4F5]">Admin panel error</h1>
          <p className="text-[#71717A] text-sm mt-2 leading-relaxed">
            An unexpected error occurred in the admin portal. Tap below to try again.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p
              className="text-xs mt-3 px-3 py-2 rounded-xl font-mono text-left overflow-x-auto"
              style={{ background: "#18181B", color: "#EF4444" }}
            >
              {error.message}
            </p>
          )}
        </div>

        <button
          onClick={reset}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{ background: "#22C55E", color: "#052E16", boxShadow: "0 4px 14px rgba(34,197,94,0.2)" }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
