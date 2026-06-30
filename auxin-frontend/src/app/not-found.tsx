"use client";
/**
 * app/not-found.tsx — Auxin v2.0
 * Dark theme 404 page. Prevents white-screen fallback.
 */

import Link from "next/link";
import { Home, Leaf, AlertTriangle } from "lucide-react";

export default function NotFound() {
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
            "radial-gradient(ellipse at 50% 30%, rgba(34,197,94,0.06) 0%, transparent 60%)",
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

        {/* 404 */}
        <div>
          <p className="text-8xl font-black text-[#27272A] leading-none select-none">404</p>
          <h1 className="text-2xl font-bold text-[#F4F4F5] mt-2">Page not found</h1>
          <p className="text-[#71717A] text-sm mt-2 leading-relaxed">
            This page doesn't exist or has been moved.
          </p>
        </div>

        {/* Action */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            background: "#22C55E",
            color: "#052E16",
            boxShadow: "0 4px 14px rgba(34,197,94,0.2)",
          }}
        >
          <Home className="w-4 h-4" />
          Go Home
        </Link>
      </div>
    </div>
  );
}
