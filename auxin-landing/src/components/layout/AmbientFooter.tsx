'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ShieldCheck, Heart, Radio } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function AmbientFooter() {
  return (
    <footer className="relative bg-[#020503] border-t border-white/10 pt-20 pb-12 overflow-hidden text-slate-400">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Massive Conversion Banner */}
        <div className="glass-obsidian-elevated rounded-3xl p-8 sm:p-12 border border-emerald-500/30 text-center space-y-6 shadow-[0_25px_80px_rgba(0,0,0,0.9)] max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            25 km Agro-Logistics Radar Online
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to Experience the{' '}
            <span className="text-gradient-chlorophyll">Future of Agritech</span>?
          </h2>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Zero brokers. 100% direct cultivator settlement. 2-hour harvest-to-kitchen transit. Built from the soil up for India&apos;s agricultural revolution.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={`${APP_URL}/customer/home`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-sm shadow-[0_0_25px_rgba(34,197,94,0.4)] hover:shadow-[0_0_35px_rgba(34,197,94,0.6)] hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              <span>Launch Live Marketplace (Go There)</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>

            <a
              href="https://github.com/SumanthMamidi-MNS/Auxin-Agritech"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-semibold text-sm transition-all duration-200"
            >
              <GithubIcon className="w-4 h-4 text-emerald-400" />
              <span>Inspect Source on GitHub</span>
            </a>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="mt-20 pt-12 border-t border-white/[0.08] grid grid-cols-2 md:grid-cols-5 gap-8 text-xs font-mono">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4 font-sans">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#030705] border border-emerald-500/40 p-1 flex items-center justify-center">
                <Image
                  src="/logo-cropped.png"
                  alt="Auxin Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                AUXIN
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm font-sans leading-relaxed">
              India&apos;s flagship direct-from-farm protocol. Eliminating middleman exploitation with 25 km geofenced logistics and 2-phase Razorpay escrow.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>Platform Status: Operational (99.98%)</span>
            </div>
          </div>

          {/* Col 1 */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Ecosystem
            </div>
            <ul className="space-y-2">
              <li>
                <a href={`${APP_URL}/customer/home`} className="hover:text-emerald-400 transition-colors">
                  Customer Market
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/farmer/dashboard`} className="hover:text-emerald-400 transition-colors">
                  Cultivator Hub
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/delivery/dashboard`} className="hover:text-emerald-400 transition-colors">
                  Courier HUD
                </a>
              </li>
              <li>
                <a href={`${APP_URL}/auth?role=admin`} className="hover:text-emerald-400 transition-colors">
                  Admin Telemetry
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Protocol
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#economics" className="hover:text-emerald-400 transition-colors">
                  Zero Commission
                </a>
              </li>
              <li>
                <a href="#innovations" className="hover:text-emerald-400 transition-colors">
                  25km Haversine
                </a>
              </li>
              <li>
                <a href="#innovations" className="hover:text-emerald-400 transition-colors">
                  2-Phase Escrow
                </a>
              </li>
              <li>
                <a href="#milo" className="hover:text-emerald-400 transition-colors">
                  Milo AI Copilot
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div className="font-bold text-white uppercase tracking-wider text-[11px]">
              Engineering
            </div>
            <ul className="space-y-2">
              <li>
                <a href="#architecture" className="hover:text-emerald-400 transition-colors">
                  System Architecture
                </a>
              </li>
              <li>
                <a href="https://github.com/SumanthMamidi-MNS/Auxin-Agritech" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href="#recruiter" className="hover:text-emerald-400 transition-colors">
                  Recruiter Fast-Track
                </a>
              </li>
              <li>
                <a href="#recruiter" className="hover:text-emerald-400 transition-colors">
                  Sandbox Credentials
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div>
            © 2026 Auxin Protocol. Engineered by{' '}
            <span className="text-slate-300 font-semibold">Sumanth Mamidi</span>.
          </div>
          <div className="flex items-center gap-4">
            <span>MIT License</span>
            <span>•</span>
            <span>Production v3.0</span>
            <span>•</span>
            <span>Gurugram, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
