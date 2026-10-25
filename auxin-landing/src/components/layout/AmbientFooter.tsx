'use client';

/**
 * auxin-landing/src/components/layout/AmbientFooter.tsx
 * ============================================================================
 * AUXIN V3.5 — AMBIENT CONVERSION FOOTER & TELEMETRY
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * Master Conversion:
 * - Glazed porcelain conversion card with deep forest CTA
 * - Replay Intro Trigger for Sprout & Oxygen splash animation
 * - Live operational network telemetry
 * - Full-stack engineering credits for Sumanth Mamidi
 * ============================================================================
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Radio } from 'lucide-react';
import { showDeployedNotice } from './DeployedNoticeToast';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function AmbientFooter() {
  return (
    <footer className="relative bg-[#FAF7F2] border-t border-black/[0.06] pt-16 pb-12 overflow-hidden text-[#475569]">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Massive Conversion Banner */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-black/[0.08] text-center space-y-6 shadow-[0_20px_50px_rgba(60,45,20,0.06)] max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF7F2] border border-black/[0.06] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            25 km Agro-Logistics Radar Online
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight font-['Poppins']">
            Ready to Experience the{' '}
            <span className="text-gradient-forest">Future of Agritech</span>?
          </h2>

          <p className="text-[#475569] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Zero brokers. 100% direct cultivator settlement. 2-hour harvest-to-kitchen transit. Built from the soil up for India&apos;s agricultural revolution.
          </p>

          <div className="pt-2 flex items-center justify-center">
            <button
              onClick={() => showDeployedNotice()}
              className="btn-press inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white font-bold text-sm shadow-[0_8px_25px_rgba(27,67,50,0.25)] hover:shadow-[0_12px_35px_rgba(27,67,50,0.35)] transition-all duration-200 cursor-pointer"
            >
              <span>Launch Live Marketplace ↗</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="mt-16 pt-12 border-t border-black/[0.06] grid grid-cols-2 md:grid-cols-5 gap-8 text-xs font-sans">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 flex items-center justify-center flex-shrink-0">
                <Image
                  src="/logo-cropped.png"
                  alt="Auxin Logo"
                  width={36}
                  height={36}
                  className="object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-[#0F172A] font-['Poppins']">
                    AUXIN
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-600/20">
                    v4.0
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] font-medium leading-tight">
                  Direct-From-Farm Protocol
                </span>
              </div>
            </div>
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
              India&apos;s flagship direct-from-farm protocol. Eliminating middleman exploitation with 25 km geofenced logistics and 2-phase Razorpay escrow.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping inline-block" />
              <span>Platform Status: Operational (99.98%)</span>
            </div>
          </div>

          {/* Col 1 */}
          <div className="space-y-3">
            <div className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Ecosystem
            </div>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <a href={`${APP_URL}/customer/home`} className="hover:text-[#1B4332] transition-colors">
                  Customer Market
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/farmer/dashboard`} className="hover:text-[#1B4332] transition-colors">
                  Cultivator Hub
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/delivery/dashboard`} className="hover:text-[#1B4332] transition-colors">
                  Courier HUD
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/auth?role=admin`} className="hover:text-[#1B4332] transition-colors">
                  Admin Telemetry
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Protocol
            </div>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <a href="#economics" className="hover:text-[#1B4332] transition-colors">
                  Zero Commission
                </a>
              </li>
              <li>
                <a href="#innovations" className="hover:text-[#1B4332] transition-colors">
                  25km Haversine
                </a>
              </li>
              <li>
                <a href="#innovations" className="hover:text-[#1B4332] transition-colors">
                  2-Phase Escrow
                </a>
              </li>
              <li>
                <a href="#milo" className="hover:text-[#1B4332] transition-colors">
                  Milo AI Copilot
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px]">
              Engineering
            </div>
            <ul className="space-y-2 text-[#475569]">
              <li>
                <a href="#architecture" className="hover:text-[#1B4332] transition-colors">
                  System Architecture
                </a>
              </li>
              <li>
                <a href="#innovations" className="hover:text-[#1B4332] transition-colors">
                  Escrow Protocol Specs
                </a>
              </li>
              <li>
                <a href="#recruiter" className="hover:text-[#1B4332] transition-colors">
                  Recruiter Fast-Track
                </a>
              </li>
              <li>
                <a href="#recruiter" className="hover:text-[#1B4332] transition-colors">
                  Sandbox Credentials
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-black/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div>
            © 2026 Auxin Protocol. Engineered by{' '}
            <span className="text-[#0F172A] font-semibold">Sumanth Mamidi</span>.
          </div>
          <div className="flex items-center gap-4">
            <span>MIT License</span>
            <span>•</span>
            <span>Production v3.5</span>
            <span>•</span>
            <span>Gurugram, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
