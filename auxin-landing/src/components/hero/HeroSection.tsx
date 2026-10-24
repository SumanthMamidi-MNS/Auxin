'use client';

import React from 'react';
import Link from 'next/link';
import { Hero3DRig } from './Hero3DRig';
import { TopoMeshCanvas } from './TopoMeshCanvas';
import { ArrowUpRight, ShieldCheck, Zap, Sparkles, Sprout, ChevronRight, Terminal } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] pt-28 pb-16 flex items-center justify-center overflow-hidden bg-[#030705]">
      {/* ── 3D Topographic Sonar Mesh Background Canvas ── */}
      <TopoMeshCanvas />

      {/* ── Ambient Radial Atmosphere ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[350px] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-tactical-grid opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Mission Typography & High-Conversion CTAs */}
          <div className="lg:col-span-7 text-left space-y-6">
            {/* Protocol Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono uppercase tracking-wider text-[11px]">
                Autonomous Direct-From-Farm Protocol
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">v3.0 Production</span>
            </div>

            {/* Main Headline with Obsidian Agritech Typography */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08]">
              Freshness Engineered with{' '}
              <span className="text-gradient-chlorophyll block sm:inline">
                Spatial Precision.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
              Auxin eliminates 4 tiers of commission middlemen. Unifying 
              <span className="text-white font-medium"> 100% cultivator margins</span>, 
              <span className="text-white font-medium"> 2-hour harvest-to-door deliveries</span>, 
              and <span className="text-white font-medium">cryptographic Razorpay escrow</span> over 
              a 25 km geofenced logistics radar.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href={`${APP_URL}/customer/home`}
                className="group relative inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_30px_rgba(34,197,94,0.45)] hover:shadow-[0_0_45px_rgba(34,197,94,0.7)] hover:brightness-105 active:scale-98 transition-all duration-200"
              >
                <span>Launch Live Marketplace</span>
                <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </a>

              <a
                href="#architecture"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] hover:border-emerald-500/40 text-slate-200 font-semibold text-sm transition-all duration-200"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Explore Architecture</span>
              </a>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-[11px] text-slate-500">Fast Sandbox:</span>
              <a
                href={`${APP_URL}/auth?role=customer`}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-mono transition-colors"
              >
                Customer Portal
              </a>
              <a
                href={`${APP_URL}/auth?role=farmer`}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-mono transition-colors"
              >
                Farmer Dashboard
              </a>
              <a
                href={`${APP_URL}/auth?role=courier`}
                className="px-2.5 py-1 rounded-md bg-white/[0.03] hover:bg-emerald-500/10 border border-white/10 hover:border-emerald-500/30 text-slate-300 hover:text-emerald-400 font-mono transition-colors"
              >
                Courier HUD
              </a>
            </div>

            {/* Metrics Ribbon */}
            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  100%
                </div>
                <div className="text-xs text-slate-400">Cultivator Margin</div>
              </div>
              <div>
                <div className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  &lt; 2 hrs
                </div>
                <div className="text-xs text-slate-400">Harvest to Door</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  25 km
                </div>
                <div className="text-xs text-slate-400">Geofence Radar</div>
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono tracking-tight">
                  ₹0
                </div>
                <div className="text-xs text-slate-400">Middleman Cuts</div>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Spatial Gyro Device Rig */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <Hero3DRig imageSrc="/screenshots/06_mobile_customer_order_tracking.png" />
          </div>
        </div>
      </div>
    </section>
  );
}
