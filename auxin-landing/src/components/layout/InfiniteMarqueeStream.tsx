'use client';

/**
 * auxin-landing/src/components/layout/InfiniteMarqueeStream.tsx
 * ============================================================================
 * AUXIN V4.0 — INFINITE HORIZONTAL MARQUEE STREAM (DUAL-TRACK TICKER)
 * 
 * After Effects-Grade Continuous Motion:
 * - 60fps GPU-accelerated horizontal translation (translate3d)
 * - Bilateral alpha gradient edge fading for a seamless horizon effect
 * - Track 1: Live Farm-to-Door Agritech Telemetry & Real-Time Logistics
 * - Track 2: Verified Full-Stack Architectural Proofs & Escrow Specifications
 * - Interactive pause-on-hover physics and tactile porcelain pill capsules
 * ============================================================================
 */

import React from 'react';
import { 
  Sprout, 
  Truck, 
  ShieldCheck, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Terminal, 
  Layers, 
  Coins 
} from 'lucide-react';

interface MarqueeItem {
  icon: React.ElementType;
  tag: string;
  tagColor: string;
  dotColor: string;
  title: string;
  detail: string;
}

const TELEMETRY_STREAM_A: MarqueeItem[] = [
  {
    icon: Sprout,
    tag: 'Live Harvest',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: 'Ratnagiri Alphonso Mangoes',
    detail: 'Plucked 14m ago • ₹45/kg Direct Farm Gate',
  },
  {
    icon: Truck,
    tag: 'EV Courier',
    tagColor: 'text-blue-800 bg-blue-100/80 border-blue-600/20',
    dotColor: 'bg-blue-500',
    title: 'Cargo Mission #204 Dispatched',
    detail: '2.4 km from Sohna Farm • Transit ETA 22 min',
  },
  {
    icon: ShieldCheck,
    tag: 'Escrow Vault',
    tagColor: 'text-amber-800 bg-amber-100/80 border-amber-600/20',
    dotColor: 'bg-amber-500',
    title: '₹360.00 Locked in Vault',
    detail: 'Cryptographic 6-Digit Doorstep OTP Ready',
  },
  {
    icon: CheckCircle2,
    tag: 'Organic Soil',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: 'NPOP Certified Organic',
    detail: '0% Chemical Fertilizer • Batch #IND-0491',
  },
  {
    icon: MapPin,
    tag: 'Radar Active',
    tagColor: 'text-purple-800 bg-purple-100/80 border-purple-600/20',
    dotColor: 'bg-purple-500',
    title: '25 km Strict Geofence',
    detail: 'Real-Time GPS Coordinate Triangulation',
  },
  {
    icon: Sparkles,
    tag: 'Milo AI Telemetry',
    tagColor: 'text-amber-800 bg-amber-100/80 border-amber-600/20',
    dotColor: 'bg-amber-500',
    title: 'Brix Sweetness 18.5°',
    detail: 'Peak Maturity Verified • Zero Cold-Storage',
  },
  {
    icon: Clock,
    tag: 'Pluck-to-Plate',
    tagColor: 'text-rose-800 bg-rose-100/80 border-rose-600/20',
    dotColor: 'bg-rose-500',
    title: 'Sub-120 Min Guarantee',
    detail: 'Direct Farm-to-Kitchen Route Bypassing Mandis',
  },
  {
    icon: Coins,
    tag: 'Direct Payout',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: '100% Cultivator Margin',
    detail: 'Instant Settlement to Bank on Doorstep OTP',
  },
];

const ARCHITECTURE_STREAM_B: MarqueeItem[] = [
  {
    icon: Cpu,
    tag: 'FastAPI 0.111',
    tagColor: 'text-teal-800 bg-teal-100/80 border-teal-600/20',
    dotColor: 'bg-teal-500',
    title: 'Async Python Engine',
    detail: 'Sub-15ms Latency on Render Cloud Host',
  },
  {
    icon: Layers,
    tag: 'Next.js 16',
    tagColor: 'text-slate-900 bg-slate-200/90 border-slate-700/20',
    dotColor: 'bg-slate-700',
    title: 'Turbopack Edge Rendering',
    detail: 'Zero Cold Start & Sub-Second Hydration',
  },
  {
    icon: ShieldCheck,
    tag: 'Escrow Engine',
    tagColor: 'text-blue-800 bg-blue-100/80 border-blue-600/20',
    dotColor: 'bg-blue-500',
    title: '2-Phase Atomic Commit',
    detail: '₹0 Commission Deductions via Razorpay Vault',
  },
  {
    icon: MapPin,
    tag: 'Leaflet Cartography',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: 'Spherical Haversine GPS',
    detail: 'Automated 25.0 km Boundary Enforcement',
  },
  {
    icon: Sparkles,
    tag: 'Milo AI Copilot',
    tagColor: 'text-amber-800 bg-amber-100/80 border-amber-600/20',
    dotColor: 'bg-amber-500',
    title: '7-Stage Semantic RAG',
    detail: 'Gemini 2.5 Flash with 120+ Agronomic Vectors',
  },
  {
    icon: Terminal,
    tag: 'Pytest Suite',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: '73/73 Tests Passed (100%)',
    detail: 'Automated Integration & Security Hardening',
  },
  {
    icon: Layers,
    tag: 'Unified Portals',
    tagColor: 'text-indigo-800 bg-indigo-100/80 border-indigo-600/20',
    dotColor: 'bg-indigo-500',
    title: '4 Operational Roles',
    detail: 'Customer • Cultivator • Courier • Admin Suite',
  },
  {
    icon: CheckCircle2,
    tag: 'Produce Registry',
    tagColor: 'text-emerald-800 bg-emerald-100/80 border-emerald-600/20',
    dotColor: 'bg-emerald-500',
    title: '120 Organic SKUs',
    detail: 'Dynamic Daily Price Index & Real-Time Stock',
  },
];

export function InfiniteMarqueeStream() {
  return (
    <div className="relative w-full py-4 sm:py-6 bg-gradient-to-b from-white via-[#F8FAFC] to-white border-y border-black/[0.05] overflow-hidden select-none marquee-container">
      {/* ── Gradient Mask for Bilateral Horizon Edge Fading ── */}
      <div className="w-full marquee-mask space-y-3">
        
        {/* ── Track A: Live Agritech Telemetry (Left to Right) ── */}
        <div className="flex overflow-hidden">
          <div className="marquee-track-left gap-3.5 sm:gap-4 pl-4">
            {/* First Set */}
            {TELEMETRY_STREAM_A.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-a-1-${idx}`}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-emerald-600/30 transition-all duration-200 flex-shrink-0 cursor-default"
                >
                  <span className={`flex h-2 w-2 rounded-full ${item.dotColor} animate-pulse`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px]">
                    <span className="font-bold text-[#0F172A]">{item.title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{item.detail}</span>
                  </div>
                </div>
              );
            })}

            {/* Seamless Duplicate Set for 100% Loop Continuity */}
            {TELEMETRY_STREAM_A.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-a-2-${idx}`}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-emerald-600/30 transition-all duration-200 flex-shrink-0 cursor-default"
                >
                  <span className={`flex h-2 w-2 rounded-full ${item.dotColor} animate-pulse`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px]">
                    <span className="font-bold text-[#0F172A]">{item.title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Track B: Full-Stack Architecture Proofs (Right to Left) ── */}
        <div className="flex overflow-hidden">
          <div className="marquee-track-right gap-3.5 sm:gap-4 pl-4">
            {/* First Set */}
            {ARCHITECTURE_STREAM_B.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-b-1-${idx}`}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-amber-600/30 transition-all duration-200 flex-shrink-0 cursor-default"
                >
                  <span className={`flex h-2 w-2 rounded-full ${item.dotColor} animate-pulse`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px]">
                    <span className="font-bold text-[#0F172A]">{item.title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{item.detail}</span>
                  </div>
                </div>
              );
            })}

            {/* Seamless Duplicate Set for 100% Loop Continuity */}
            {ARCHITECTURE_STREAM_B.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`track-b-2-${idx}`}
                  className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/95 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-md hover:border-amber-600/30 transition-all duration-200 flex-shrink-0 cursor-default"
                >
                  <span className={`flex h-2 w-2 rounded-full ${item.dotColor} animate-pulse`} />
                  <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${item.tagColor}`}>
                    {item.tag}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs sm:text-[13px]">
                    <span className="font-bold text-[#0F172A]">{item.title}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500 font-medium">{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
