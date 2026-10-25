'use client';

import React, { useState, useEffect } from 'react';
import { Rocket, Sparkles, X, ArrowDown, ShieldCheck, Radio } from 'lucide-react';

export function showComingSoonModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auxin:show-coming-soon-modal'));
  }
}

export function ComingSoonModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('auxin:show-coming-soon-modal', handleOpen);
    return () => window.removeEventListener('auxin:show-coming-soon-modal', handleOpen);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Auto-dismiss after 60 seconds (or manual dismiss via X or outside click)
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 60000);

    // Escape key listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 sm:pt-14 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-lg w-full bg-[#FAF7F2] border-[1.5px] border-[#D4AF37]/50 rounded-3xl p-6 sm:p-7 shadow-[0_25px_70px_-15px_rgba(27,67,50,0.35),0_10px_25px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.05] space-y-4 animate-in slide-in-from-top-6 duration-300"
      >
        {/* Top Badges & Dismiss */}
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-600/25 text-emerald-900 text-xs font-semibold">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
            <span className="font-mono text-[11px] font-bold tracking-wide">
              DELHI NCR • STAGING ACTIVE
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="btn-press p-1.5 rounded-full text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.06] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Headline */}
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit']">
            Auxin Mobile &amp; Web Apps Launching Soon
          </h3>
          <p className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase font-mono">
            Autonomous 25 km Direct-From-Farm Protocol
          </p>
        </div>

        {/* Staging Narrative */}
        <p className="text-xs sm:text-sm text-[#475569] leading-relaxed font-sans">
          We are finalizing high-density autonomous production rollout across Gurugram and Delhi NCR. Pre-production cluster staging is active. For technical evaluations, you can test the full-stack system right now using the instant sandbox credentials.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-white border border-black/[0.06] flex items-center gap-2 text-xs font-medium text-[#1B4332]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>2-Phase Escrow Locked</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-black/[0.06] flex items-center gap-2 text-xs font-medium text-[#1B4332]">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>100% Cultivator Margin</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-black/[0.06]">
          <a
            href="#recruiter"
            onClick={() => setIsOpen(false)}
            className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white text-xs font-bold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <span>Jump to Sandbox Credentials</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setIsOpen(false)}
            className="btn-press text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
