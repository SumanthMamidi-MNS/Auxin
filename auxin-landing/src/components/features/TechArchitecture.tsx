'use client';

/**
 * auxin-landing/src/components/features/TechArchitecture.tsx
 * ============================================================================
 * AUXIN V3.5 — FULL-STACK SYSTEM ARCHITECTURE & INTERACTIVE REST API TERMINAL
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * 4 Architectural Pillars:
 * - Next.js 16 App Router & Turbopack
 * - FastAPI & Async Python Engine
 * - 2-Phase Escrow Webhook Handshake
 * - Leaflet 25km Haversine Geofencing
 * ============================================================================
 */

import React, { useState } from 'react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { BorderBeam } from '@/components/ui/BorderBeam';
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
    <section id="architecture" className="relative py-28 bg-[#F5F2EB] overflow-hidden scroll-mt-24 border-y border-black/[0.05]">
      {/* Background glow */}
      <div className="absolute top-1/3 right-1/3 w-[600px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-[#1B4332]" />
            Engineering Topology
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Poppins']">
            Full-Stack <span className="text-gradient-forest">System Architecture</span>.
          </h2>
          <p className="text-[#475569] text-base sm:text-lg leading-relaxed">
            Engineered for 99.99% uptime, microsecond coordinate mathematics, and deterministic bank-grade security.
          </p>
        </div>

        {/* 4 Architectural Pillars Grid */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SpotlightCard className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-[0_15px_35px_rgba(60,45,20,0.04)] card-3d-highlight space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-[#1B4332]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
              Next.js 16 App Router
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Turbopack compilation, React 19 Server Components, Tailwind CSS v4, hardware-accelerated 3D spatial gyro perspective, Framer Motion springs.
            </p>
          </SpotlightCard>

          <SpotlightCard className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-[0_15px_35px_rgba(60,45,20,0.04)] card-3d-highlight space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-[#1B4332]">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
              FastAPI Async Engine
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Python 3.12 async workers, Pydantic v2 strict models, connection pooling, and sub-15ms response latency under peak batch load.
            </p>
          </SpotlightCard>

          <SpotlightCard className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-[0_15px_35px_rgba(60,45,20,0.04)] card-3d-highlight space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-600/20 flex items-center justify-center text-amber-800">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
              2-Phase Escrow Webhooks
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Razorpay cryptographic escrow hold, dual-signature webhook verification, and automated IMPS instant bank disbursements.
            </p>
          </SpotlightCard>

          <SpotlightCard className="bg-white rounded-3xl p-6 sm:p-7 border border-black/[0.08] shadow-[0_15px_35px_rgba(60,45,20,0.04)] card-3d-highlight space-y-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-[#1B4332]">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
              Leaflet 25km Haversine
            </h3>
            <p className="text-sm text-[#475569] leading-relaxed">
              Real-time geospatial polygon geofencing, OpenStreetMap vector tiles, GPS vehicle telemetry, and zero cross-zone routing leakage.
            </p>
          </SpotlightCard>
        </div>

        {/* Interactive API Terminal */}
        <div className="relative mt-14 bg-white rounded-3xl border border-black/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(60,45,20,0.06)] card-3d-highlight max-w-5xl mx-auto">
          <BorderBeam duration={12} colorFrom="#10B981" colorTo="#2D6A4F" borderWidth={1.5} />
          {/* Header Bar */}
          <div className="px-6 py-4 bg-[#FAF7F2] border-b border-black/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold">
              <Terminal className="w-4 h-4 text-[#1B4332]" />
              <span>Auxin REST API Explorer</span>
            </div>

            <div className="flex items-center gap-2">
              {API_ENDPOINTS.map((ep, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`btn-press px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
                    activeTab === idx
                      ? 'bg-[#1B4332] text-white shadow-2xs'
                      : 'text-[#475569] hover:text-[#0F172A] bg-white border border-black/[0.06]'
                  }`}
                >
                  {ep.method} {ep.url.split('?')[0].split('/').pop()}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Details Bar */}
          <div className="px-6 py-3 bg-[#FDFCF9] border-b border-black/[0.06] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                endpoint.method === 'GET' 
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-600/20' 
                  : 'bg-amber-100 text-amber-900 border border-amber-600/20'
              }`}>
                {endpoint.method}
              </span>
              <span className="text-[#334155] truncate max-w-md sm:max-w-xl font-semibold">
                {endpoint.url}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-emerald-800 font-bold hidden sm:inline">STATUS: {endpoint.statusCode} OK</span>
              <button
                onClick={handleCopy}
                className="btn-press p-1.5 rounded-lg hover:bg-black/[0.05] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                title="Copy JSON Payload"
              >
                {copied ? <Check className="w-4 h-4 text-[#1B4332]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* JSON Payload Display */}
          <div className="p-6 sm:p-8 bg-[#0F172A] font-mono text-xs sm:text-[13px] text-left overflow-x-auto max-h-[380px]">
            <pre className="text-emerald-300 leading-relaxed">
              {JSON.stringify(endpoint.responseJson, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
