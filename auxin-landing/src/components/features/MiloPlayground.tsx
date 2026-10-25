'use client';

/**
 * auxin-landing/src/components/features/MiloPlayground.tsx
 * ============================================================================
 * AUXIN V3.5 — MILO AI AGRONOMIC COPILOT PARCHMENT CONSOLE
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * Interactive Agronomic Intelligence:
 * - 4 Pre-tuned prompts: Harvest timing, dynamic pricing, escrow handshake, geofence curve
 * - Typewriter text streaming with micro-cursor
 * - Ivory parchment aesthetic with deep botanical forest syntax
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Terminal, CornerDownLeft } from 'lucide-react';

interface PromptPreset {
  id: string;
  question: string;
  answer: string;
  badge: string;
}

const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'harvest',
    question: 'Should I harvest my Alphonso mangoes today or wait for tomorrow\'s forecast?',
    badge: 'Agronomy Telemetry',
    answer:
      'Recommendation: HARVEST NOW (06:00 – 08:30 AM window).\n\n• Micro-Climate Analysis: Sohna weather station registers 82% humidity with sudden rainfall predicted at 15:40 IST.\n• Brix Rating: Current orchard sample reads 18.5° Brix (peak sugar maturity).\n• Post-Harvest Risk: Rain within 12 hours of harvest introduces fungal latent rot and softens peel firmness by 35%.\n• Logistics Status: 4 Electric Cargo Couriers are currently active within your 8 km sector.',
  },
  {
    id: 'pricing',
    question: 'What is the optimal price per kg for organic spinach in Gurugram right now?',
    badge: 'Dynamic Arbitrage',
    answer:
      'Recommended Listing Price: ₹65 / kg (Direct Farmer Settlement: ₹65).\n\n• Azadpur Wholesale Mandi: ₹28 / kg (Cultivator gets ₹16 after commission & transport deductions).\n• Retail Supermarkets: ₹95 / kg (3 days old cold-storage stock).\n• Auxin Recommendation: At ₹65/kg, customer saves 31% over retail, while you earn +306% higher gross margin with zero commission deductions.',
  },
  {
    id: 'escrow',
    question: 'How does Auxin\'s 2-phase Razorpay escrow prevent buyer and farmer fraud?',
    badge: 'Cryptographic Protocol',
    answer:
      'The Auxin Escrow Handshake operates on a deterministic two-phase commit:\n\n1. Phase 1 (Authorization): Customer checkout locks ₹360 in Razorpay Vault. Cultivator is notified that funds are guaranteed.\n2. Phase 2 (Settlement): Courier presents delivery to customer. Customer inspects produce freshness and provides 6-digit OTP.\n3. Upon OTP verification, the escrow smart release triggers: ₹360 transferred instantly to Cultivator bank account, ₹40 courier incentive unlocked.\n4. If produce is rejected before OTP entry, 100% refund reverts automatically.',
  },
  {
    id: 'geofence',
    question: 'Why is the geofence strictly set to 25 km instead of nationwide delivery?',
    badge: 'Spatial Logistics',
    answer:
      'The 25 km limit is governed by the Cellular Respiration Curve of green produce:\n\n• First 120 Minutes: Vitamin C and organic sugars are at 98% retention.\n• After 6 Hours (Standard Logistics): Spoilage enzymes accelerate; long-distance trucking requires wax coating or ethylene inhibitors.\n• 25 km Haversine Radius covers high-density peri-urban agricultural belts (e.g. Sohna, Najafgarh, Doddaballapura) directly to urban kitchens within 45–90 minutes transit time via EV cargo.',
  },
];

export function MiloPlayground() {
  const [selectedPrompt, setSelectedPrompt] = useState<PromptPreset>(PROMPT_PRESETS[0]);
  const [displayedText, setDisplayedText] = useState<string>(PROMPT_PRESETS[0].answer);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const fullText = selectedPrompt.answer;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 3));
        index += 3;
      } else {
        setDisplayedText(fullText);
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [selectedPrompt]);

  return (
    <section id="milo" className="relative py-28 bg-[#FAF7F2] overflow-hidden scroll-mt-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Bot className="w-3.5 h-3.5 text-[#1B4332]" />
            Milo AI Copilot Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Poppins']">
            Consult <span className="text-gradient-forest">Milo AI Copilot</span>.
          </h2>
          <p className="text-[#475569] text-base sm:text-lg leading-relaxed">
            Fine-tuned on Indian agronomy, weather telemetry, Mandi price indexes, and hyper-local supply routing.
          </p>
        </div>

        {/* Prompt Selector Chips */}
        <div className="mt-10 flex flex-wrap justify-center gap-2.5 max-w-4xl mx-auto">
          {PROMPT_PRESETS.map((p) => {
            const isSelected = selectedPrompt.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPrompt(p)}
                className={`btn-press px-4 py-2 rounded-full text-xs font-semibold transition-all text-left flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white border-transparent shadow-sm'
                    : 'bg-white border-black/[0.08] text-[#475569] hover:text-[#0F172A] hover:bg-black/[0.03]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D4AF37]' : 'text-[#64748B]'}`} />
                <span>{p.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Ivory Parchment Console */}
        <div className="mt-8 max-w-4xl mx-auto bg-white rounded-3xl border border-black/[0.08] overflow-hidden shadow-[0_20px_50px_rgba(60,45,20,0.06)]">
          {/* Console Window Header */}
          <div className="px-6 py-3.5 bg-[#FAF7F2] border-b border-black/[0.06] flex items-center justify-between text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 text-[#475569] font-mono font-semibold">milo-agronomy-copilot --v3.5</span>
            </div>
            <div className="flex items-center gap-4 text-[#64748B] text-xs">
              <span className="text-emerald-800 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                LATENCY: 18ms
              </span>
              <span className="hidden sm:inline font-mono">TEMPERATURE: 0.2</span>
            </div>
          </div>

          {/* Console Body */}
          <div className="p-6 sm:p-8 space-y-6 text-left text-sm">
            {/* User Input Prompt */}
            <div className="space-y-2">
              <div className="text-xs text-[#64748B] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Selected Inquiry:</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] text-[#0F172A] font-semibold flex items-start gap-2.5">
                <CornerDownLeft className="w-4 h-4 text-[#1B4332] mt-0.5 shrink-0" />
                <span className="leading-snug">&quot;{selectedPrompt.question}&quot;</span>
              </div>
            </div>

            {/* AI Streaming Response */}
            <div className="space-y-2">
              <div className="text-xs text-[#1B4332] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#1B4332]" />
                <span>Milo Reasoning &amp; Telemetry Recommendation:</span>
              </div>
              <div className="p-5 sm:p-6 rounded-2xl bg-[#FDFCF9] border border-emerald-600/20 text-[#334155] whitespace-pre-wrap leading-relaxed shadow-2xs font-sans">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-[#1B4332] ml-1 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
