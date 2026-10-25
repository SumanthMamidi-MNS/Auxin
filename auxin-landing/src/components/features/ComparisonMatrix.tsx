'use client';

/**
 * auxin-landing/src/components/features/ComparisonMatrix.tsx
 * ============================================================================
 * AUXIN V3.5 — MANDI VS. AUXIN ECONOMICS & HOUSEHOLD SAVINGS SIMULATOR
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * Interactive Economic Proof:
 * - Dynamic Household Spend Slider (₹500 to ₹10,000 / week)
 * - Live Annual Cultivator Enrichment Metric
 * - Side-by-side Terracotta vs. Botanical Pine comparative cards
 * - Zero middleman deductions verified breakdown
 * ============================================================================
 */

import React, { useState } from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export function ComparisonMatrix() {
  const [weeklySpend, setWeeklySpend] = useState<number>(2500);

  // Economic computations
  const annualSpend = weeklySpend * 52;
  const traditionalFarmerGets = Math.round(weeklySpend * 0.22);
  const traditionalMiddlemenGets = Math.round(weeklySpend * 0.58);
  const traditionalSpoilageCost = Math.round(weeklySpend * 0.20);

  const auxinFarmerGets = Math.round(weeklySpend * 0.88);
  const auxinLogisticsFee = Math.round(weeklySpend * 0.12);
  const auxinMiddlemenGets = 0;

  const annualFarmerExtra = (auxinFarmerGets - traditionalFarmerGets) * 52;

  return (
    <section id="economics" className="relative py-12 sm:py-14 bg-[#F5F2EB] overflow-hidden scroll-mt-24 border-y border-black/[0.05]">
      {/* Background Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 text-[#1B4332]" />
            Zero Commission Mandi Economics
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit']">
            The Economics of <span className="text-gradient-forest">Pure Cultivator Margin</span>.
          </h2>
          <p className="text-[#475569] text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Traditional Indian agricultural supply chains consume up to 60% of produce value in commission agent cuts and warehouse rot. Auxin redistributes every single rupee directly back to the cultivator.
          </p>
        </div>

        {/* Interactive Spend & Savings Simulator */}
        <div className="mt-6 sm:mt-8 bg-white rounded-3xl p-5 sm:p-7 border border-black/[0.08] max-w-4xl mx-auto shadow-[0_15px_35px_rgba(60,45,20,0.05)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-black/[0.06]">
            <div>
              <span className="text-xs uppercase text-[#1B4332] font-bold tracking-wider">
                Household Produce Allocation Simulator
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-0.5 font-['Poppins']">
                Weekly Farm Budget: <span className="text-[#1B4332] font-mono">₹{weeklySpend.toLocaleString('en-IN')}</span>
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-[#64748B] font-medium">Direct Cultivator Enrichment</span>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-[#B45309]">
                +₹{annualFarmerExtra.toLocaleString('en-IN')} / year
              </div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="py-3 space-y-1.5">
            <input
              type="range"
              min={500}
              max={10000}
              step={250}
              value={weeklySpend}
              onChange={(e) => setWeeklySpend(Number(e.target.value))}
              className="w-full h-2 bg-[#FAF7F2] rounded-lg appearance-none cursor-pointer accent-[#1B4332]"
            />
            <div className="flex justify-between text-[11px] text-[#64748B] font-medium">
              <span>₹500 / week (Small Household)</span>
              <span className="hidden sm:inline">₹5,000 / week</span>
              <span>₹10,000 / week (Large Family)</span>
            </div>
          </div>

          {/* Side-by-Side Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
            {/* Left: Traditional Mandis (Terracotta / Alert) */}
            <div className="rounded-2xl p-4 bg-amber-50/60 border border-amber-600/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  Legacy Mandi Model
                </span>
                <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  4-Tier Commission
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Cultivator Realization (22%):</span>
                    <span className="text-[#0F172A] font-bold font-mono">₹{traditionalFarmerGets}</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-600 h-full rounded-full" style={{ width: '22%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Middlemen &amp; Commission Cuts (58%):</span>
                    <span className="text-red-700 font-bold font-mono">₹{traditionalMiddlemenGets}</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: '58%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Warehouse Rot &amp; Freight Spoilage (20%):</span>
                    <span className="text-[#64748B] font-bold font-mono">₹{traditionalSpoilageCost}</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#94A3B8] h-full rounded-full" style={{ width: '20%' }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-600/15 text-[10px] text-amber-900 space-y-0.5">
                <p>• 48h to 72h transit lag in uncooled Mandi sheds</p>
                <p>• 15–45 day delayed credit cycles for farmers</p>
                <p>• Zero verifiable soil or chemical traceability</p>
              </div>
            </div>

            {/* Right: Auxin Protocol (Botanical Pine / Emerald) */}
            <div className="rounded-2xl p-4 bg-emerald-50/70 border border-emerald-600/25 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Auxin Hyper-Local Protocol
                </span>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  100% Direct Margin
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Cultivator Realization (88%–100%):</span>
                    <span className="text-[#1B4332] font-extrabold font-mono text-xs">₹{auxinFarmerGets}</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#1B4332] h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Direct EV Courier Dispatch (12%):</span>
                    <span className="text-[#0F172A] font-bold font-mono text-xs">₹{auxinLogisticsFee}</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[#475569] mb-0.5 font-medium">
                    <span>Middleman Cut &amp; Commission:</span>
                    <span className="text-emerald-800 font-extrabold font-mono text-xs">₹0 (Eliminated)</span>
                  </div>
                  <div className="w-full bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-300 h-full rounded-full" style={{ width: '0%' }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-600/15 text-[10px] text-emerald-900 space-y-0.5">
                <p>• Under 2h pluck-to-doorstep direct delivery</p>
                <p>• Instant Razorpay 2-phase cryptographic escrow release</p>
                <p>• NPOP Certified Organic soil telemetry via Milo AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
