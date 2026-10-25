'use client';

/**
 * auxin-landing/src/components/features/RecruiterDossier.tsx
 * ============================================================================
 * AUXIN V3.5 — RECRUITER FAST-TRACK & TECHNICAL DOSSIER
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * Lead Architect: Sumanth Mamidi (@SumanthMamidi-MNS)
 * - Complete production sandbox credentials
 * - Architectural quality verification matrix
 * - Direct GitHub repository and live application links
 * ============================================================================
 */

import React, { useState } from 'react';
import { Key, ArrowUpRight, Copy, Check, ExternalLink, Award } from 'lucide-react';
import { showDeployedNotice } from '../layout/DeployedNoticeToast';

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

interface CredentialRow {
  role: string;
  portal: string;
  email: string;
  pass: string;
  destination: string;
  description: string;
}

const CREDENTIALS: CredentialRow[] = [
  {
    role: 'Customer',
    portal: 'Marketplace Feed & Cart',
    email: 'customer@auxin.in',
    pass: 'auxin123',
    destination: `${APP_URL}/auth?role=customer`,
    description: 'Explore 25 km geofenced crops, add Alphonso mangoes to cart, test OTP escrow.',
  },
  {
    role: 'Farmer',
    portal: 'Cultivator Enterprise Hub',
    email: 'farmer@auxin.in',
    pass: 'auxin123',
    destination: `${APP_URL}/auth?role=farmer`,
    description: 'Publish morning harvest lots, inspect Milo AI yield suggestions, track instant payouts.',
  },
  {
    role: 'Courier',
    portal: 'Logistics Mission HUD',
    email: 'courier@auxin.in',
    pass: 'auxin123',
    destination: `${APP_URL}/auth?role=courier`,
    description: 'Turn-by-turn Leaflet GPS route vectors, farm gate pickup & doorstep OTP confirmation.',
  },
  {
    role: 'Admin',
    portal: 'System Telemetry & Audits',
    email: 'admin@auxin.in',
    pass: 'auxin123',
    destination: `${APP_URL}/auth?role=admin`,
    description: 'NPOP organic certificate audits, escrow dispute arbitration, live cluster telemetry.',
  },
];

export function RecruiterDossier() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <section id="recruiter" className="relative py-28 bg-[#FAF7F2] overflow-hidden scroll-mt-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Award className="w-3.5 h-3.5 text-[#D4AF37]" />
            Recruiter Fast-Track &amp; Technical Dossier
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Poppins'] leading-[1.25] sm:leading-[1.2] pb-1">
            Engineered by <span className="text-gradient-forest inline-block">Sumanth Mamidi</span>.
          </h2>
          <p className="text-[#475569] text-base sm:text-lg leading-relaxed">
            Complete production sandbox credentials, engineering philosophy, and open-source codebase links for technical evaluators.
          </p>
        </div>

        {/* Architect Bio & Badges Card */}
        <div className="mt-14 bg-white rounded-3xl p-6 sm:p-10 border border-black/[0.08] max-w-5xl mx-auto shadow-[0_20px_50px_rgba(60,45,20,0.06)]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-black/[0.06]">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1B4332] via-[#2D6A4F] to-[#D4AF37] p-[2px] shadow-sm">
                <div className="w-full h-full bg-[#FAF7F2] rounded-[14px] flex items-center justify-center font-extrabold text-2xl text-[#1B4332] font-['Poppins']">
                  SM
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                    Sumanth Mamidi
                  </h3>
                  <span className="text-[11px] font-bold text-[#1B4332] bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-600/15">
                    Lead Architect &amp; Sole Contributor
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-medium mt-1">
                  Full-Stack Distributed Systems • Agritech Infrastructure • 3D Web UI
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="https://github.com/SumanthMamidi-MNS/Auxin"
                target="_blank"
                rel="noreferrer"
                className="btn-press inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAF7F2] hover:bg-black/[0.04] border border-black/[0.08] text-xs font-semibold text-[#0F172A] transition-all"
              >
                <GithubIcon className="w-4 h-4 text-[#1B4332]" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-[#64748B]" />
              </a>
              <button
                onClick={() => showDeployedNotice()}
                className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <span>Launch Live App</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Technical Quality Checklist */}
          <div className="py-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-black/[0.06] text-xs font-medium">
            <div className="flex items-center gap-2 text-[#334155]">
              <Check className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>100% Strict TypeScript</span>
            </div>
            <div className="flex items-center gap-2 text-[#334155]">
              <Check className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>Next.js 16 Turbopack</span>
            </div>
            <div className="flex items-center gap-2 text-[#334155]">
              <Check className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>FastAPI Python 3.12</span>
            </div>
            <div className="flex items-center gap-2 text-[#334155]">
              <Check className="w-4 h-4 text-[#1B4332] shrink-0" />
              <span>Hardware 3D Spatial Rig</span>
            </div>
          </div>

          {/* One-Click Sandbox Credentials Matrix */}
          <div className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#1B4332] font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#D4AF37]" />
                One-Click Sandbox Test Credentials
              </span>
              <span className="text-[11px] text-[#64748B] font-medium hidden sm:inline">
                Click credentials to copy or click Launch to enter
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CREDENTIALS.map((cred) => (
                <div
                  key={cred.role}
                  className="rounded-2xl p-4 bg-[#FAF7F2] border border-black/[0.06] hover:border-emerald-600/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      {cred.role.toUpperCase()} PORTAL
                    </span>
                    <a
                      href={cred.destination}
                      className="btn-press text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] flex items-center gap-1"
                    >
                      <span>Direct Login</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <p className="text-[11px] text-[#64748B] leading-snug">
                    {cred.description}
                  </p>

                  <div className="p-3 rounded-xl bg-white border border-black/[0.06] flex items-center justify-between text-xs font-mono shadow-2xs">
                    <div className="space-y-0.5">
                      <div className="text-[#0F172A] text-[11px] font-semibold">{cred.email}</div>
                      <div className="text-[#64748B] text-[10px]">Password: {cred.pass}</div>
                    </div>
                    <button
                      onClick={() => handleCopy(`${cred.email}:${cred.pass}`, cred.role)}
                      className="btn-press p-1.5 rounded-lg hover:bg-black/[0.05] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                      title="Copy credentials"
                    >
                      {copiedKey === cred.role ? (
                        <Check className="w-4 h-4 text-[#1B4332]" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
