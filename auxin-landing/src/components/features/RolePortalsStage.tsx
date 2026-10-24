'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  ShoppingBag, 
  Sprout, 
  Truck, 
  ShieldCheck, 
  ArrowUpRight, 
  MapPin, 
  Clock, 
  Coins, 
  Cpu, 
  CheckCircle2, 
  Activity 
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface RolePortal {
  id: string;
  name: string;
  roleTitle: string;
  badge: string;
  icon: React.ElementType;
  heading: string;
  description: string;
  route: string;
  screenshot: string;
  features: { title: string; desc: string; icon: React.ElementType }[];
  metrics: { label: string; value: string }[];
  accentColor: string;
}

const ROLES: RolePortal[] = [
  {
    id: 'customer',
    name: 'Customer',
    roleTitle: 'The Consumer Experience',
    badge: 'Hyper-Local Gourmet & Organic',
    icon: ShoppingBag,
    heading: 'Pluck-to-Plate in Under 120 Minutes.',
    description:
      'Browse farm-fresh fruits, vegetables, and artisan staples harvested hours ago within your local 25 km radius. Complete transparency with farmer bios and doorstep OTP delivery escrow.',
    route: `${APP_URL}/customer/home`,
    screenshot: '/screenshots/03_mobile_customer_home.png',
    accentColor: 'emerald',
    features: [
      {
        title: 'Strict 25 KM Radar',
        desc: 'Calculated using real-time Haversine distance from your GPS coordinates.',
        icon: MapPin,
      },
      {
        title: 'Cryptographic Escrow',
        desc: 'Funds held in Razorpay vault until you confirm 6-digit OTP delivery.',
        icon: ShieldCheck,
      },
      {
        title: 'Zero Cold Storage',
        desc: 'All produce is harvested post-order. Zero chemicals, zero warehouse hold.',
        icon: Clock,
      },
    ],
    metrics: [
      { label: 'Avg Delivery Time', value: '47 mins' },
      { label: 'Freshness Index', value: '99.4%' },
      { label: 'Active Regional Farms', value: '18 Hubs' },
    ],
  },
  {
    id: 'farmer',
    name: 'Farmer',
    roleTitle: 'Cultivator Enterprise Hub',
    badge: '100% Direct Settlement',
    icon: Sprout,
    heading: 'Run Your Agritech Business with Zero Commission.',
    description:
      'List morning harvest batches, set your own fair prices, receive automated courier pick-ups directly at your farm gate, and enjoy instant bank payouts upon customer OTP confirmation.',
    route: `${APP_URL}/farmer/dashboard`,
    screenshot: '/screenshots/06_mobile_farmer_inventory.png',
    accentColor: 'amber',
    features: [
      {
        title: 'Autonomous Lot Control',
        desc: 'Publish harvests in kilograms or crates with real-time stock deductions.',
        icon: Activity,
      },
      {
        title: 'Milo Yield Intelligence',
        desc: 'AI copilot suggests optimal pricing based on rainfall, soil and demand.',
        icon: Cpu,
      },
      {
        title: 'Instant Escrow Release',
        desc: 'Zero 30-day Mandi credit cycles. Direct bank credit on delivery handshake.',
        icon: Coins,
      },
    ],
    metrics: [
      { label: 'Farmer Gross Margin', value: '100%' },
      { label: 'Settlement Latency', value: '< 2.4s' },
      { label: 'Spoilage Rate', value: '0.0%' },
    ],
  },
  {
    id: 'courier',
    name: 'Courier',
    roleTitle: 'Hyperlocal Logistics HUD',
    badge: 'Electric Cargo Transit',
    icon: Truck,
    heading: 'High-Density Missions. Zero Highway Fatigue.',
    description:
      'Operate within an ultra-efficient 25 km geofenced polygon. Benefit from Leaflet route vectors, turn-by-turn navigation, and automated verification codes at farm gates and doorsteps.',
    route: `${APP_URL}/delivery/dashboard`,
    screenshot: '/screenshots/09_mobile_delivery_mission.png',
    accentColor: 'emerald',
    features: [
      {
        title: 'Turn-by-Turn Leaflet GPS',
        desc: 'Optimized routing vectors between farm gate pickups and customer doorsteps.',
        icon: MapPin,
      },
      {
        title: 'Dual Handshake Protocol',
        desc: 'Secure pickup OTP from cultivator, and doorstep release OTP from customer.',
        icon: ShieldCheck,
      },
      {
        title: 'Guaranteed Payout per Run',
        desc: 'Fair mileage rates plus instant incentives credited to in-app wallet.',
        icon: Coins,
      },
    ],
    metrics: [
      { label: 'Average Radius', value: '11.4 km' },
      { label: 'Pickup-to-Drop', value: '28 mins' },
      { label: 'Courier Retention', value: '96%' },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    roleTitle: 'Governance & Telemetry',
    badge: 'Protocol Overseer',
    icon: ShieldCheck,
    heading: 'Real-Time Oversight Across the Agritech Grid.',
    description:
      'Manage regional polygon boundaries, approve cultivator organic certifications, monitor Razorpay escrow health, and resolve logistics anomalies in real time.',
    route: `${APP_URL}/auth?role=admin`,
    screenshot: '/screenshots/01_mobile_auth.png',
    accentColor: 'emerald',
    features: [
      {
        title: 'KYC & Farm Gate Audits',
        desc: 'Verify NPOP organic certificates and geo-coordinate farm boundaries.',
        icon: CheckCircle2,
      },
      {
        title: 'Dispute Arbitration Vault',
        desc: 'Review damaged goods claims with photo evidence before escrow settlement.',
        icon: ShieldCheck,
      },
      {
        title: 'Live Telemetry Dashboard',
        desc: 'Track active runs, GMV velocity, and radar density across all micro-clusters.',
        icon: Activity,
      },
    ],
    metrics: [
      { label: 'Dispute Rate', value: '0.04%' },
      { label: 'Audit Compliance', value: '100%' },
      { label: 'API Uptime', value: '99.98%' },
    ],
  },
];

export function RolePortalsStage() {
  const [activeRole, setActiveRole] = useState<string>('customer');
  const role = ROLES.find((r) => r.id === activeRole) || ROLES[0];

  return (
    <section id="roles" className="relative py-28 bg-[#040A07] overflow-hidden scroll-mt-24">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[350px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" />
            4 Unified Ecosystem Roles
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for <span className="text-gradient-chlorophyll">Every Participant</span>.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Auxin unifies customers, cultivators, couriers, and administrators into a synchronized, single-platform operating system.
          </p>
        </div>

        {/* Morphing Role Tabs */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{r.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Showcase Display */}
        <div className="mt-12 glass-obsidian-elevated rounded-3xl p-6 sm:p-10 border border-emerald-500/20 shadow-[0_25px_70px_rgba(0,0,0,0.8)] transition-all duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Role Details & Specs */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {role.badge}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {role.roleTitle}
                </span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                {role.heading}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {role.description}
              </p>

              {/* 3 Pillar Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {role.features.map((feat, idx) => {
                  const FeatIcon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5"
                    >
                      <FeatIcon className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        {feat.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {feat.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Metrics Bar */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-6">
                {role.metrics.map((m, idx) => (
                  <div key={idx}>
                    <div className="text-xl font-black text-white font-mono">
                      {m.value}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {m.label}
                    </div>
                  </div>
                ))}

                <div className="sm:ml-auto">
                  <a
                    href={role.route}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs tracking-wide shadow-[0_0_20px_rgba(34,197,94,0.35)] hover:brightness-110 active:scale-95 transition-all duration-200"
                  >
                    <span>Launch {role.name} Experience</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Role Mockup Graphic with Certified Screen */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden bg-[#030705] border border-emerald-500/30 p-4 shadow-2xl space-y-3">
                {/* Top Bar of Role Device */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE PRODUCTION CLUSTER
                  </span>
                  <span>25 KM GEOFENCE</span>
                </div>

                {/* Real-time Screen Mockup Window */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 bg-black/60 shadow-inner group">
                  <Image
                    src={role.screenshot}
                    alt={`${role.name} live experience`}
                    fill
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030705] via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] font-mono">
                    <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 font-semibold">
                      Verified 100% Real-Time
                    </span>
                    <span className="bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-slate-300">
                      Zero Dummy Residue
                    </span>
                  </div>
                </div>

                {/* Protocol State Strip */}
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-left">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold">
                    Active State Telemetry
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">
                    {role.id === 'customer' && '🛒 Active Cart: Ratnagiri Alphonso Mangoes (₹180)'}
                    {role.id === 'farmer' && '🌾 Active Listings: 23 Harvest Lots Available'}
                    {role.id === 'courier' && '🚴 Active Run #1: Sohna Farm Gate → Palm Grove Enclave'}
                    {role.id === 'admin' && '🛡️ System Security: 2-Phase Escrow Authorization Vault'}
                  </div>
                </div>

                <a
                  href={role.route}
                  className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-emerald-500/20 hover:border-emerald-500/40 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all"
                >
                  <span>Launch Live {role.name} Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
