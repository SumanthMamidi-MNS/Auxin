'use client';

import React, { useState } from 'react';
import { Terminal, Layers, ShieldCheck, Database, MapPin, Cpu, Check, Copy } from 'lucide-react';

interface ApiEndpoint {
  method: string;
  url: string;
  description: string;
  statusCode: number;
  responseJson: object;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    url: '/api/v1/produce/live-feed?lat=28.4595&lng=77.0266&radius=25',
    description: 'Queries 25 km geofenced active harvests with Haversine distance triangulation.',
    statusCode: 200,
    responseJson: {
      status: 'success',
      radar: {
        center: { lat: 28.4595, lng: 77.0266 },
        radius_km: 25.0,
        active_farms: 18,
      },
      items: [
        {
          id: 'crop_alphonso_104',
          name: 'Ratnagiri Alphonso Mangoes',
          farmer: {
            id: 'usr_ramesh_k',
            name: 'Ramesh Kumar',
            farm: 'Auxin Green Harvest Farms, Sohna',
            distance_km: 14.2,
            organic_cert: 'NPOP-ORG-2026-IND-0491',
          },
          harvest_timestamp: '2026-10-24T06:30:00+05:30',
          transit_window_minutes: 84,
          unit_price_inr: 360.0,
          escrow_eligible: true,
        },
      ],
    },
  },
  {
    method: 'POST',
    url: '/api/v1/escrow/authorize',
    description: 'Locks order total into 2-phase Razorpay escrow vault with cryptographic transaction token.',
    statusCode: 201,
    responseJson: {
      escrow_id: 'esc_rzp_99482103',
      order_id: 'ord_auxin_8821',
      total_amount_inr: 360.0,
      state: 'FUNDS_LOCKED_IN_VAULT',
      settlement_condition: 'DOORSTEP_6_DIGIT_OTP_HANDSHAKE',
      breakdown: {
        cultivator_settlement_inr: 320.0,
        courier_ev_fee_inr: 40.0,
        auxin_platform_cut_inr: 0.0,
      },
      payout_trigger: 'IMMEDIATE_ON_VERIFY',
    },
  },
  {
    method: 'POST',
    url: '/api/v1/escrow/release-otp',
    description: 'Validates customer OTP at doorstep, instantly executing simultaneous dual bank payouts.',
    statusCode: 200,
    responseJson: {
      status: 'ESCROW_SETTLED_COMPLETED',
      verified_otp: '482103',
      timestamp: '2026-10-24T09:41:22+05:30',
      payouts: [
        { recipient: 'Ramesh Kumar (Cultivator)', amount_inr: 320.0, status: 'CREDITED_IMPS' },
        { recipient: 'Vikram Singh (Courier)', amount_inr: 40.0, status: 'CREDITED_WALLET' },
      ],
      spoilage_status: 'ZERO_COLD_STORAGE_CONFIRMED',
      freshness_rating: 5,
    },
  },
];

export function TechArchitecture() {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoint = API_ENDPOINTS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(endpoint.responseJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="architecture" className="relative py-28 bg-[#030705] overflow-hidden scroll-mt-24">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/3 w-[600px] h-[350px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            Engineering Topology
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Full-Stack <span className="text-gradient-chlorophyll">System Architecture</span>.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Built for 99.99% uptime, microsecond coordinate math, and deterministic bank-grade security.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-obsidian-elevated rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Next.js 16 App Router
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Turbopack compilation, React 19 Server Components, Tailwind CSS v4, hardware-accelerated 3D gyro perspective, Framer Motion springs.
            </p>
          </div>

          <div className="glass-obsidian-elevated rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              FastAPI &amp; Async Engine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Python 3.12 async workers, Pydantic v2 strict models, connection pooling, and sub-15ms response latency under peak batch load.
            </p>
          </div>

          <div className="glass-obsidian-elevated rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              2-Phase Escrow Webhooks
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Razorpay cryptographic escrow hold, dual-signature webhook verification, and automated IMPS instant bank disbursements.
            </p>
          </div>

          <div className="glass-obsidian-elevated rounded-2xl p-6 border border-white/10 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Leaflet 25km Haversine
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time geospatial polygon geofencing, OpenStreetMap vector tiles, GPS vehicle telemetry, and zero cross-zone routing leakage.
            </p>
          </div>
        </div>

        {/* Interactive API Terminal */}
        <div className="mt-14 glass-obsidian-elevated rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-w-5xl mx-auto">
          {/* Header Bar */}
          <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-semibold">Auxin REST API Explorer</span>
            </div>

            <div className="flex items-center gap-2">
              {API_ENDPOINTS.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    activeTab === idx
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-white bg-white/[0.04]'
                  }`}
                >
                  {ep.method} {ep.url.split('?')[0].split('/').pop()}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Details Bar */}
          <div className="px-6 py-3 bg-white/[0.02] border-b border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                {endpoint.method}
              </span>
              <span className="text-slate-300 truncate max-w-md sm:max-w-xl">
                {endpoint.url}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-bold">STATUS: {endpoint.statusCode} OK</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white"
                title="Copy JSON Payload"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* JSON Payload Display */}
          <div className="p-6 bg-[#020503] font-mono text-xs text-left overflow-x-auto max-h-[380px]">
            <pre className="text-emerald-300/90 leading-relaxed">
              {JSON.stringify(endpoint.responseJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
