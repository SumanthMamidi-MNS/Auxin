"use client";
/**
 * app/error.tsx — Auxin v3.0
 * Route-level error boundary matching Auxin v3.0 design tokens.
 */

import { useEffect } from "react";
import { RefreshCw, Leaf } from "lucide-react";
import Image from "next/image";
import { NetworkErrorIllustration } from "@/components/illustrations/NetworkError";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Auxin Error Boundary]", error.message, error.digest);
  }, [error]);

  const isNetworkError =
    error.message?.toLowerCase().includes("fetch") ||
    error.message?.toLowerCase().includes("network") ||
    error.message?.toLowerCase().includes("failed");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center relative shadow-xs border-2 border-[var(--gold)]">
            <Image
              src="/logo-cropped.png"
              alt="Auxin Logo"
              fill
              className="object-cover scale-110"
            />
          </div>
          <span className="text-lg font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
            Auxin
          </span>
        </div>

        {/* Error Card */}
        <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
          <div className="w-28 h-28 mx-auto flex items-center justify-center">
            <NetworkErrorIllustration />
          </div>

          <h1 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
            {isNetworkError ? "Connection Interrupted" : "Something Went Wrong"}
          </h1>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            {isNetworkError
              ? "Unable to reach regional servers. The service may be synchronizing — please try again."
              : "An unexpected hiccup occurred. Tap below to reload the harvest feed."}
          </p>

          <div className="pt-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
