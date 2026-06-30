"use client";
/**
 * app/error.tsx — Auxin v2.0
 * Route-level error boundary. Prevents white-screen crashes.
 * Next.js requires: "use client", reset() function, error prop.
 */

import { useEffect } from "react";
import { RefreshCw, Leaf, Wifi } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error for monitoring (non-blocking)
    console.error("[Auxin Error Boundary]", error.message, error.digest);
  }, [error]);

  const isNetworkError =
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0A0A0B" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(239,68,68,0.05) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Logo */}
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2"
          style={{
            background: "rgba(34,197,94,0.1)",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <Leaf className="w-7 h-7 text-[#22C55E]" />
        </div>

        {/* Error icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          {isNetworkError
            ? <Wifi className="w-8 h-8 text-[#EF4444]" />
            : <RefreshCw className="w-8 h-8 text-[#EF4444]" />
          }
        </div>

        <div>
          <h1 className="text-xl font-bold text-[#F4F4F5]">
            {isNetworkError ? "Connection issue" : "Something went wrong"}
          </h1>
          <p className="text-[#71717A] text-sm mt-2 leading-relaxed">
            {isNetworkError
              ? "Can't reach our servers. The backend may be waking up — please wait a moment and try again."
              : "An unexpected error occurred. Tap below to try again."}
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
          style={{
            background: "#22C55E",
            color: "#052E16",
            boxShadow: "0 4px 14px rgba(34,197,94,0.2)",
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    </div>
  );
}
