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
import { TopoMeshCanvas } from './TopoMeshCanvas';
import { ArrowUpRight, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface HeroSectionProps {
  heroImage?: string;
}

export function HeroSection({ heroImage }: HeroSectionProps) {
  return (
    <section className="relative min-h-[92vh] pt-36 sm:pt-40 pb-20 flex items-center justify-center overflow-hidden bg-white">
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1] font-['Poppins']">
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
              <a
                href={`${APP_URL}/customer/home`}
                className="btn-press group relative inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white font-bold text-sm tracking-wide shadow-[0_8px_25px_rgba(27,67,50,0.25)] hover:shadow-[0_12px_35px_rgba(27,67,50,0.35)] transition-all duration-200"
              >
                <span>Launch Live Marketplace</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>

              <a
                href="#architecture"
                className="btn-press inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] border border-black/[0.08] text-[#0F172A] font-semibold text-sm shadow-sm transition-all duration-200"
              >
                <Terminal className="w-4 h-4 text-[#1B4332]" />
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Fast Sandbox Access Chips */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span className="font-semibold text-[11px] text-[#475569]">One-Click Portals:</span>
              <a
                href={`${APP_URL}/auth?role=customer`}
                className="btn-press px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-black/[0.06] hover:border-emerald-600/30 text-[#475569] hover:text-[#1B4332] font-medium shadow-2xs transition-colors"
              >
                Customer Portal
              </a>
              <a
                href={`${APP_URL}/auth?role=farmer`}
                className="btn-press px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-black/[0.06] hover:border-emerald-600/30 text-[#475569] hover:text-[#1B4332] font-medium shadow-2xs transition-colors"
              >
                Farmer Dashboard
              </a>
              <a
                href={`${APP_URL}/auth?role=courier`}
                className="btn-press px-3 py-1 rounded-full bg-white hover:bg-emerald-50 border border-black/[0.06] hover:border-emerald-600/30 text-[#475569] hover:text-[#1B4332] font-medium shadow-2xs transition-colors"
              >
                Courier HUD
              </a>
            </div>

            {/* Metrics Ribbon */}
            <div className="pt-6 border-t border-black/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-extrabold text-[#1B4332] font-['Poppins'] tracking-tight">
                  100%
                </div>
                <div className="text-xs text-[#64748B] font-medium mt-0.5">
                  Direct Margin to Cultivator
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] font-['Poppins'] tracking-tight">
                  &lt; 2h
                </div>
                <div className="text-xs text-[#64748B] font-medium mt-0.5">
                  Pluck-to-Plate Window
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] font-['Poppins'] tracking-tight">
                  25 km
                </div>
                <div className="text-xs text-[#64748B] font-medium mt-0.5">
                  Haversine Logistics Radar
                </div>
              </div>

              <div>
                <div className="text-3xl font-extrabold text-[#B45309] font-['Poppins'] tracking-tight">
                  ₹0
                </div>
                <div className="text-xs text-[#64748B] font-medium mt-0.5">
                  Mandi Broker Deductions
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Champagne Device Canvas */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <Hero3DRig imageSrc={heroImage} />
          </div>
        </div>
      </div>
    </section>
  );
}
