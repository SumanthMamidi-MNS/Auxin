"use client";
/**
 * app/not-found.tsx — Auxin v3.0
 * Brand-aligned 404 error screen with warm cream + forest green theme.
 */

import Link from "next/link";
import { Home, Leaf } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Logo */}
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

        {/* 404 Content */}
        <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-4">
          <p className="text-7xl font-black text-[var(--primary)] leading-none select-none tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            404
          </p>
          <h1 className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
            Harvest Field Not Found
          </h1>
          <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
            This produce page doesn&apos;t exist or was relocated. Let&apos;s get you back to fresh crops.
          </p>

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] bg-[var(--primary)] text-white shadow-xs hover:bg-[var(--primary-hover)]"
            >
              <Home className="w-4 h-4" />
              Return to Marketplace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
