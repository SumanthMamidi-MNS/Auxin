'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, Terminal, ArrowRight, CornerDownLeft } from 'lucide-react';

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
    <section id="milo" className="relative py-28 bg-[#040A07] overflow-hidden scroll-mt-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/3 w-[600px] h-[350px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Bot className="w-3.5 h-3.5" />
            Milo AI Copilot Engine
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ask <span className="text-gradient-chlorophyll">Milo AI</span>.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
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
                className={`px-4 py-2 rounded-xl text-xs font-mono transition-all text-left flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                    : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{p.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Obsidian Terminal */}
        <div className="mt-8 max-w-4xl mx-auto glass-obsidian-elevated rounded-3xl border border-emerald-500/30 overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9)]">
          {/* Terminal Window Header */}
          <div className="px-5 py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 text-slate-400">milo-agritech-runtime --v3.0.4</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LATENCY: 18ms
              </span>
              <span>TEMPERATURE: 0.2</span>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-6 sm:p-8 space-y-6 text-left font-mono text-sm">
            {/* User Input Prompt */}
            <div className="space-y-1.5">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>USER PROMPT INVOCATION:</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-medium flex items-start gap-2">
                <CornerDownLeft className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>&quot;{selectedPrompt.question}&quot;</span>
              </div>
            </div>

            {/* AI Streaming Response */}
            <div className="space-y-1.5">
              <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" />
                <span>MILO REASONING OUTPUT:</span>
              </div>
              <div className="p-4 sm:p-5 rounded-xl bg-black/50 border border-emerald-500/30 text-slate-200 whitespace-pre-wrap leading-relaxed shadow-inner">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
