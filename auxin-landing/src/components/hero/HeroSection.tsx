'use client';

/**
 * auxin-landing/src/components/hero/HeroSection.tsx
 * ============================================================================
 * AUXIN V3.5 — HERO STAGE (ORGANIC CREAM LUXURY EDITION)
 * 
 * Editorial Elegance & 3D Spatial Device Frame:
 * - High-contrast graphite typography on warm organic cream
 * - Deep botanical forest green accents and solar harvest gold
 * - Generous top breathing room (pt-36 to pt-40) preventing navbar overlap
 * - Tactile spring-press actions and live sandbox access links
 * ============================================================================
 */

import React from 'react';
import { Hero3DRig } from './Hero3DRig';
import { CountUpTicker } from '@/components/ui/CountUpTicker';
import { TopoMeshCanvas } from './TopoMeshCanvas';
import { ArrowUpRight, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { showComingSoonModal } from '../layout/ComingSoonModal';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

interface HeroSectionProps {
  heroImage?: string;
}

export function HeroSection({ heroImage }: HeroSectionProps) {
  return (
    <section id="hero" className="relative min-h-[88vh] pt-20 sm:pt-24 pb-16 flex items-center justify-center overflow-hidden bg-white">
      {/* ── Organic Cartography Topo Mesh Canvas ── */}
      <TopoMeshCanvas />

      {/* ── Soft Sunbeam Atmosphere ── */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-radial from-amber-500/10 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[350px] bg-radial from-emerald-500/8 via-transparent to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-alabaster-grid opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission Typography & High-Conversion CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Protocol Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              <span className="font-semibold text-xs text-emerald-800 tracking-wider uppercase">
                Autonomous Direct-From-Farm Protocol
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs font-medium text-slate-500">v4.0 Production</span>
            </div>

            {/* Main Headline with Editorial Elegance */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1] font-['Outfit']">
              Fresh from the Earth.{' '}
              <span className="text-gradient-forest block sm:inline">
                Delivered in Under 120 Minutes.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-[#475569] max-w-2xl font-normal leading-relaxed">
              Auxin eliminates 4 tiers of commission middlemen. Unifying{' '}
              <strong className="text-[#0F172A] font-semibold">100% cultivator margins</strong>,{' '}
              <strong className="text-[#0F172A] font-semibold">2-hour harvest-to-door deliveries</strong>, and{' '}
              <strong className="text-[#0F172A] font-semibold">cryptographic Razorpay escrow</strong> over a strict 25 km geofenced logistics radar.
            </p>

            {/* CTAs with Tactile Press Animation */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <button
                onClick={() => showComingSoonModal()}
                className="btn-press group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(27,67,50,0.25)] hover:shadow-[0_12px_35px_rgba(27,67,50,0.35)] transition-all duration-200 cursor-pointer"
              >
                <span>Launch Live Marketplace</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>

              <a
                href="#architecture"
                className="btn-press inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-black/[0.08] text-[#0F172A] font-semibold text-sm shadow-sm transition-all duration-200"
              >
                <Terminal className="w-4 h-4 text-[#1B4332]" />
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Fast Sandbox Access Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 text-xs text-[#475569]">
              <span className="font-bold text-xs uppercase tracking-wide text-[#334155]">One-Click Portals:</span>
              <a
                href={`${APP_URL}/customer/home`}
                className="btn-press px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50/80 border border-slate-200/90 hover:border-emerald-600/40 text-slate-700 hover:text-[#1B4332] text-xs sm:text-[13px] font-semibold shadow-2xs transition-colors"
              >
                Customer Portal
              </a>
              <a
                href={`${APP_URL}/auth?role=farmer`}
                className="btn-press px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50/80 border border-slate-200/90 hover:border-emerald-600/40 text-slate-700 hover:text-[#1B4332] text-xs sm:text-[13px] font-semibold shadow-2xs transition-colors"
              >
                Farmer Portal
              </a>
              <a
                href={`${APP_URL}/auth?role=delivery`}
                className="btn-press px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50/80 border border-slate-200/90 hover:border-emerald-600/40 text-slate-700 hover:text-[#1B4332] text-xs sm:text-[13px] font-semibold shadow-2xs transition-colors"
              >
                Rider Portal
              </a>
              <a
                href={`${ADMIN_URL}/auth`}
                className="btn-press px-3.5 py-1.5 rounded-full bg-white hover:bg-emerald-50/80 border border-slate-200/90 hover:border-emerald-600/40 text-slate-700 hover:text-[#1B4332] text-xs sm:text-[13px] font-semibold shadow-2xs transition-colors"
              >
                Admin Portal
              </a>
            </div>

            {/* Metrics Ribbon with Dynamic Numeric Counters */}
            <div className="pt-6 border-t border-black/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <CountUpTicker
                  end={100}
                  suffix="%"
                  className="text-3xl font-extrabold text-[#1B4332] font-['Outfit'] tracking-tight"
                />
                <div className="text-xs sm:text-[13px] text-[#475569] font-medium mt-1">
                  Direct Margin to Cultivator
                </div>
              </div>

              <div>
                <CountUpTicker
                  end={120}
                  suffix=" min"
                  className="text-3xl font-extrabold text-[#0F172A] font-['Outfit'] tracking-tight"
                />
                <div className="text-xs sm:text-[13px] text-[#475569] font-medium mt-1">
                  Pluck-to-Plate Window
                </div>
              </div>

              <div>
                <CountUpTicker
                  end={25}
                  suffix=" km"
                  className="text-3xl font-extrabold text-[#0F172A] font-['Outfit'] tracking-tight"
                />
                <div className="text-xs sm:text-[13px] text-[#475569] font-medium mt-1">
                  Haversine Logistics Radar
                </div>
              </div>

              <div>
                <CountUpTicker
                  end={0}
                  prefix="₹"
                  className="text-3xl font-extrabold text-[#B45309] font-['Outfit'] tracking-tight"
                />
                <div className="text-xs sm:text-[13px] text-[#475569] font-medium mt-1">
                  Mandi Broker Deductions
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Champagne Device Canvas + High-Tech Radar Atmosphere */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Cyber Radar Pulse Backdrop */}
            <div className="absolute -inset-10 flex items-center justify-center pointer-events-none opacity-40">
              <div className="relative w-96 h-96 rounded-full border border-emerald-500/20 flex items-center justify-center">
                <div className="absolute w-72 h-72 rounded-full border border-emerald-500/25" />
                <div className="absolute w-48 h-48 rounded-full border border-emerald-500/30" />
                {/* Rotating Radar Sweep Beam */}
                <div className="absolute inset-0 rounded-full animate-radar-sweep bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.25)_360deg)]" />
                {/* Geofence GPS Coordinates Ping */}
                <div className="absolute top-8 right-8 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-emerald-600/20 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-beacon-ping" />
                  <span className="text-[11px] font-mono font-bold text-emerald-900">GPS: 17.3850° N, 78.4867° E</span>
                </div>
              </div>
            </div>

            <Hero3DRig imageSrc={heroImage} />
          </div>
        </div>
      </div>
    </section>
  );
}
