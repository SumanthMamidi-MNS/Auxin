'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

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
    <section id="economics" className="relative py-24 bg-[#030705] overflow-hidden scroll-mt-24">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            Zero Commission Mandi Economics
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            The Economics of <span className="text-gradient-chlorophyll">Pure Margin</span>.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Traditional Indian agricultural supply chains consume up to 60% of produce value in commissions and warehouse rot. Auxin redistributes every single rupee directly to the soil.
          </p>
        </div>

        {/* Interactive Spend & Savings Simulator */}
        <div className="mt-14 glass-obsidian-elevated rounded-3xl p-6 sm:p-10 border border-emerald-500/20 max-w-4xl mx-auto shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold tracking-wider">
                Household Produce Allocation Simulator
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                Weekly Farm Spending: <span className="text-emerald-400 font-mono">₹{weeklySpend.toLocaleString('en-IN')}</span>
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs font-mono text-slate-400">Annual Farmer Empowerment</span>
              <div className="text-xl font-bold font-mono text-amber-400">
                +₹{annualFarmerExtra.toLocaleString('en-IN')} Direct
              </div>
            </div>
          </div>

          {/* Range Slider */}
          <div className="py-6 space-y-2">
            <input
              type="range"
              min={500}
              max={10000}
              step={250}
              value={weeklySpend}
              onChange={(e) => setWeeklySpend(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>₹500 / week (Small Household)</span>
              <span>₹5,000 / week</span>
              <span>₹10,000 / week (Community Collective)</span>
            </div>
          </div>

          {/* Side-by-Side Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Left: Traditional Mandis */}
            <div className="rounded-2xl p-5 bg-red-950/20 border border-red-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Legacy Mandi Model
                </span>
                <span className="text-xs text-red-400/80 font-mono">4-Tier Commission</span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Cultivator Realization (22%):</span>
                  <span className="text-white font-semibold">₹{traditionalFarmerGets}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full" style={{ width: '22%' }} />
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Middlemen &amp; Commission Cuts (58%):</span>
                  <span className="text-red-400 font-bold">₹{traditionalMiddlemenGets}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Warehouse Spoilage &amp; Delay:</span>
                  <span className="text-amber-400">48h – 72h Rot</span>
                </div>
              </div>
            </div>

            {/* Right: Auxin Protocol */}
            <div className="rounded-2xl p-5 bg-emerald-950/40 border border-emerald-500/40 space-y-4 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Auxin Protocol v3.0
                </span>
                <span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Zero Commission
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Direct to Cultivator (88%):</span>
                  <span className="text-emerald-400 font-bold text-sm">₹{auxinFarmerGets}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '88%' }} />
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Middleman Extraction:</span>
                  <span className="text-emerald-400 font-bold">₹0 (0.00%)</span>
                </div>

                <div className="flex justify-between items-center text-slate-300">
                  <span>Pluck-to-Doorstep Transit:</span>
                  <span className="text-white font-bold">&lt; 2 Hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Comparison Pill Table */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-mono uppercase text-slate-400">
                <th className="py-4 px-4 font-semibold">Supply Dimension</th>
                <th className="py-4 px-4 font-semibold text-red-400">Traditional Mandi</th>
                <th className="py-4 px-4 font-semibold text-emerald-400">Auxin Hyper-Local Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 font-medium text-white font-sans">Payment Settlement</td>
                <td className="py-4 px-4 text-slate-400">15–45 day cash credit cycles, debt traps</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Immediate 2-Phase Escrow Release via Razorpay</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 font-medium text-white font-sans">Harvest Freshness</td>
                <td className="py-4 px-4 text-slate-400">3–5 days in cold storage &amp; dusty wholesale yards</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Plucked on order • Delivered under 120 minutes</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 font-medium text-white font-sans">Geographic Geofence</td>
                <td className="py-4 px-4 text-slate-400">Long-haul inter-state trucking (&gt;500 km carbon)</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Strict 25 km Haversine Radar (Hyper-Local)</td>
              </tr>
              <tr className="hover:bg-white/[0.02]">
                <td className="py-4 px-4 font-medium text-white font-sans">Quality Assurance</td>
                <td className="py-4 px-4 text-slate-400">Unverified visual inspection at auction yards</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">NPOP Organic Certifications + Milo AI Soil Specs</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
