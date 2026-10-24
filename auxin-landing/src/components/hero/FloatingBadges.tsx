'use client';

import React from 'react';
import { Navigation, ShieldCheck, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

interface FloatingBadgesProps {
  mouseXRatio?: number;
  mouseYRatio?: number;
}

export function FloatingBadges({ mouseXRatio = 0.5, mouseYRatio = 0.5 }: FloatingBadgesProps) {
  // Parallax offsets based on cursor
  const offsetX = (mouseXRatio - 0.5) * 20;
  const offsetY = (mouseYRatio - 0.5) * 20;

  return (
    <>
      {/* ── Badge 1: Live Courier GPS (Foreground Z = +60px) ── */}
      <div
        style={{
          transform: `translate3d(${-offsetX * 1.8}px, ${-offsetY * 1.8}px, 60px)`,
        }}
        className="absolute -top-6 -left-6 sm:-left-12 z-30 pointer-events-none sm:pointer-events-auto transition-transform duration-150 ease-out animate-float-slow"
      >
        <div className="glass-obsidian-elevated p-3 rounded-2xl flex items-center gap-3 border border-emerald-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(34,197,94,0.25)] backdrop-blur-xl">
          <div className="relative w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Navigation className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                Courier Vikram En Route
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                12m away
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Live GPS • 25 km Geofence
            </span>
          </div>
        </div>
      </div>

      {/* ── Badge 2: Harvest Freshness Proof (Midground Z = +35px) ── */}
      <div
        style={{
          transform: `translate3d(${offsetX * 1.4}px, ${offsetY * 1.4}px, 35px)`,
        }}
        className="absolute -bottom-8 -right-4 sm:-right-10 z-30 pointer-events-none sm:pointer-events-auto transition-transform duration-150 ease-out animate-float-reverse"
      >
        <div className="glass-obsidian-elevated p-3.5 rounded-2xl flex items-center gap-3 border border-amber-500/30 shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.25)] backdrop-blur-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">
                Ratnagiri Alphonso
              </span>
              <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Zero Storage
              </span>
            </div>
            <span className="text-[11px] font-mono text-amber-400/90">
              Harvested 06:30 AM Today (NPOP Org)
            </span>
          </div>
        </div>
      </div>

      {/* ── Badge 3: Cryptographic Escrow Guard (Background Z = +15px) ── */}
      <div
        style={{
          transform: `translate3d(${offsetX * 0.8}px, ${-offsetY * 0.8}px, 15px)`,
        }}
        className="absolute top-1/2 -right-6 sm:-right-16 z-20 pointer-events-none sm:pointer-events-auto hidden sm:block transition-transform duration-150 ease-out"
      >
        <div className="glass-obsidian p-3 rounded-2xl flex items-center gap-3 border border-white/10 shadow-[0_10px_25px_rgba(0,0,0,0.6)] backdrop-blur-lg">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col text-left pr-2">
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-white">
                Escrow Locked
              </span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              ₹360.00 Doorstep Guard
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
