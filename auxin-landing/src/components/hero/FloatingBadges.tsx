'use client';

/**
 * auxin-landing/src/components/hero/FloatingBadges.tsx
 * ============================================================================
 * AUXIN V3.5 — FLOATING SATELLITE BADGES (ORGANIC CREAM LUXURY)
 * 
 * Re-anchored & Spatialized:
 * - Positioned safely around the phone frame (Zero Navbar Collision)
 * - Glazed porcelain glass panels with warm gold/botanical accents
 * - Live dynamic parallax tracking cursor offsets
 * ============================================================================
 */

import React from 'react';
import { Navigation, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

interface FloatingBadgesProps {
  mouseXRatio?: number;
  mouseYRatio?: number;
}

export function FloatingBadges({ mouseXRatio = 0.5, mouseYRatio = 0.5 }: FloatingBadgesProps) {
  // Parallax offsets based on cursor
  const offsetX = (mouseXRatio - 0.5) * 16;
  const offsetY = (mouseYRatio - 0.5) * 16;

  return (
    <>
      {/* ── Badge 1: Live Courier GPS (Left Midground, Z = +55px) ── */}
      <div
        style={{
          transform: `translate3d(${-offsetX * 1.5}px, ${-offsetY * 1.5}px, 55px)`,
        }}
        className="absolute top-20 -left-4 sm:-left-12 z-30 pointer-events-none sm:pointer-events-auto transition-transform duration-150 ease-out animate-float-gentle"
      >
        <div className="glass-porcelain-elevated p-3 rounded-2xl flex items-center gap-3 border border-emerald-600/20 shadow-[0_15px_35px_rgba(60,45,20,0.08)] backdrop-blur-xl">
          <div className="relative w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
            <Navigation className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                Courier Vikram En Route
              </span>
              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded-full border border-emerald-600/15">
                12m away
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] font-medium">
              Live GPS • Electric Cargo Bike
            </span>
          </div>
        </div>
      </div>

      {/* ── Badge 2: Harvest Freshness Proof (Right Midground, Z = +35px) ── */}
      <div
        style={{
          transform: `translate3d(${offsetX * 1.3}px, ${offsetY * 1.3}px, 35px)`,
        }}
        className="absolute top-1/2 -right-4 sm:-right-12 z-30 pointer-events-none sm:pointer-events-auto transition-transform duration-150 ease-out animate-float-reverse"
      >
        <div className="glass-porcelain-elevated p-3.5 rounded-2xl flex items-center gap-3 border border-amber-600/20 shadow-[0_15px_35px_rgba(60,45,20,0.08)] backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-600/25 flex items-center justify-center text-amber-700">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#0F172A] tracking-tight">
                Ratnagiri Alphonso
              </span>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded-full border border-amber-600/20">
                0h Storage
              </span>
            </div>
            <span className="text-[11px] text-[#B45309] font-medium">
              Plucked 06:30 AM Today (NPOP)
            </span>
          </div>
        </div>
      </div>

      {/* ── Badge 3: Cryptographic Escrow Guard (Bottom Left, Z = +20px) ── */}
      <div
        style={{
          transform: `translate3d(${offsetX * 0.9}px, ${-offsetY * 0.9}px, 20px)`,
        }}
        className="absolute -bottom-6 left-2 sm:left-6 z-20 pointer-events-none sm:pointer-events-auto hidden sm:block transition-transform duration-150 ease-out"
      >
        <div className="glass-porcelain p-2.5 rounded-2xl flex items-center gap-2.5 border border-black/[0.07] shadow-[0_12px_30px_rgba(60,45,20,0.06)] backdrop-blur-lg">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-[#0F172A]">
                Escrow Locked
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            </div>
            <span className="text-[10px] font-mono text-[#64748B]">
              ₹360.00 Doorstep Guard
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
