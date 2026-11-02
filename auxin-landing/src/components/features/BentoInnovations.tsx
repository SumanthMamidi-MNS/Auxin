'use client';

/**
 * auxin-landing/src/components/features/BentoInnovations.tsx
 * ============================================================================
 * AUXIN V3.5 — 4-CELL BENTO GRID OF CORE AGRITECH INNOVATIONS
 * (ORGANIC CREAM LUXURY EDITION)
 * 
 * Master Breakthroughs:
 * - 01. Autonomous 25 km Strict Haversine Radar with Interactive Distance Dial
 * - 02. 3D Cryptographic Escrow Vault OTP Simulator with Canvas Confetti Burst
 * - 03. Milo AI Agronomic Telemetry (Soil Moisture, Sunlight, Brix Sweetness)
 * - 04. Zero Cold-Storage Soil Provenance Specimen Card & Cultivator Passport
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { CountUpTicker } from '@/components/ui/CountUpTicker';
import { 
  Radar, 
  ShieldCheck, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Thermometer, 
  Droplets, 
  Sun 
} from 'lucide-react';

// Standalone Canvas Confetti Burst (Zero External Dependencies)
function triggerConfettiBurst() {
  if (typeof window === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const colors = ['#1B4332', '#2D6A4F', '#D4AF37', '#F59E0B', '#10B981'];
  const particleCount = 75;
  const particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotSpeed: number;
    alpha: number;
  }> = [];

  const startX = window.innerWidth * 0.5;
  const startY = window.innerHeight * 0.6;

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 6,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      alpha: 1,
    });
  }

  let animationFrameId: number;
  let frame = 0;

  function render() {
    frame++;
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    let active = 0;

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.rotation += p.rotSpeed;
      p.alpha = Math.max(0, 1 - frame / 80);

      if (p.alpha > 0) {
        active++;
        ctx?.save();
        ctx?.translate(p.x, p.y);
        ctx?.rotate((p.rotation * Math.PI) / 180);
        if (ctx) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx?.restore();
      }
    }

    if (active > 0 && frame < 90) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animationFrameId);
      canvas.remove();
    }
  }

  render();
}

export function BentoInnovations() {
  // Escrow Vault State
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      triggerUnlock();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const triggerUnlock = () => {
    setVaultUnlocked(true);
    triggerConfettiBurst();
  };

  const autoFillOtp = () => {
    setOtpDigits(['4', '8', '2', '1', '0', '3']);
    triggerUnlock();
  };

  const resetVault = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setVaultUnlocked(false);
  };

  // Interactive 25 km Radar Distance Calculator
  const [simDistance, setSimDistance] = useState<number>(14.2);

  return (
    <section id="innovations" className="relative py-8 sm:py-10 bg-[#FAF7F2] overflow-hidden scroll-mt-24">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Core Agritech Innovations
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Outfit']">
            The Bento Grid of <span className="text-gradient-forest">Architectural Breakthroughs</span>.
          </h2>
          <p className="text-[#475569] text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto">
            Four foundational engineering milestones power Auxin&apos;s hyper-local zero-rot supply chain.
          </p>
        </div>

        {/* 4-Cell Bento Grid */}
        <div className="mt-5 sm:mt-6 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
          {/* ── Cell 1: 25 KM Strict Haversine Radar (Span 2 cols) ── */}
          <SpotlightCard className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-[0_10px_25px_rgba(60,45,20,0.03)] card-3d-highlight relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-600/20 flex items-center gap-1.5">
                  <Radar className="w-3 h-3 text-emerald-700 animate-spin" />
                  Innovation 01 • Haversine Geofence
                </span>
                <span className="text-xs text-[#475569] font-semibold">
                  Strict 25.0 km Boundary
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                Autonomous 25 km Radar Logistics
              </h3>

              <p className="text-[#475569] text-sm max-w-xl leading-relaxed">
                Every customer order is mathematically bounded by real-time GPS coordinate triangulation. If a farm is outside the 25.0 km radius, it does not appear in your feed. This guarantees produce travels under 120 minutes from soil to kitchen.
              </p>
            </div>

            {/* Interactive Radar Distance Simulator */}
            <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#475569]">
                  Selected Farm Distance:
                </span>
                <span className="text-sm font-mono font-extrabold text-[#1B4332]">
                  {simDistance} km
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={30}
                step={0.5}
                value={simDistance}
                onChange={(e) => setSimDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#1B4332]"
              />

              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#64748B]">0 km (Farm Gate)</span>
                {simDistance <= 25 ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" /> IN RADAR (Instant 2h Dispatch)
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">
                    OUTSIDE GEOFENCE (&gt;25 km Rejected)
                  </span>
                )}
                <span className="text-[#64748B]">25 km Limit</span>
              </div>
            </div>
          </SpotlightCard>

          {/* ── Cell 2: 3D Cryptographic Escrow Vault OTP Simulator (Span 1 col) ── */}
          <SpotlightCard spotlightColor="rgba(217, 119, 6, 0.12)" className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-[0_10px_25px_rgba(60,45,20,0.03)] card-3d-highlight-gold relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-600/25 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-amber-700" />
                  Innovation 02 • Escrow Vault
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                2-Phase Doorstep Escrow
              </h3>

              <p className="text-[#475569] text-sm leading-relaxed">
                Funds remain locked in a Razorpay cryptographic escrow vault until you inspect produce at your doorstep and verify the 6-digit OTP.
              </p>
            </div>

            {/* OTP Simulator */}
            <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#475569]">
                <span>DELIVERY OTP SIMULATOR:</span>
                {vaultUnlocked ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <Unlock className="w-3 h-3 text-emerald-700" /> VAULT OPEN
                  </span>
                ) : (
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-700" /> LOCKED (₹360.00)
                  </span>
                )}
              </div>

              {/* 6 Digit Inputs - Tightly Grouped OTP Simulator */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5 py-1">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-9 sm:w-10 h-11 text-center font-mono text-lg font-bold bg-white border border-black/[0.15] rounded-xl text-[#1B4332] focus:border-[#1B4332] focus:ring-2 focus:ring-[#1B4332]/20 outline-none shadow-2xs transition-all"
                  />
                ))}
              </div>

              {vaultUnlocked ? (
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-600/30 text-center space-y-0.5">
                  <div className="text-xs font-bold text-emerald-900 font-mono">
                    ✅ Escrow Settled Instantly
                  </div>
                  <div className="text-xs text-emerald-800 font-mono">
                    ₹360 to Ramesh Kumar • ₹40 to Courier Vikram
                  </div>
                  <button
                    onClick={resetVault}
                    className="btn-press text-xs text-[#64748B] hover:text-[#0F172A] underline font-medium cursor-pointer"
                  >
                    Reset Simulator
                  </button>
                </div>
              ) : (
                <button
                  onClick={autoFillOtp}
                  className="btn-press w-full py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-600/30 text-emerald-900 text-xs font-bold font-mono transition-colors shadow-2xs cursor-pointer"
                >
                  Click to Auto-Fill &apos;482103&apos;
                </button>
              )}
            </div>
          </SpotlightCard>

          {/* ── Cell 3: Milo AI Autonomous Copilot (Span 1 col) ── */}
          <SpotlightCard spotlightColor="rgba(217, 119, 6, 0.12)" className="bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-[0_10px_25px_rgba(60,45,20,0.03)] card-3d-highlight-gold relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-600/20 flex items-center gap-1.5">
                  <Bot className="w-3 h-3 text-emerald-700" />
                  Innovation 03 • Milo AI
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                Agronomic Intelligence
              </h3>

              <p className="text-[#475569] text-sm leading-relaxed">
                Fine-tuned AI copilot trained on regional Indian soil indices, crop harvest cycles, and real-time wholesale Mandi arbitrage.
              </p>
            </div>

            <div className="mt-3 p-3 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#475569] pb-1 border-b border-black/[0.05]">
                <span className="flex items-center gap-1.5 font-medium text-xs font-medium">
                  <Droplets className="w-3 h-3 text-blue-600" /> Soil Moisture
                </span>
                <span className="text-[#0F172A] font-bold font-mono text-xs font-medium">68% (Optimal)</span>
              </div>
              <div className="flex items-center justify-between text-[#475569] pb-1 border-b border-black/[0.05]">
                <span className="flex items-center gap-1.5 font-medium text-xs font-medium">
                  <Sun className="w-3 h-3 text-amber-600" /> Sunlight Index
                </span>
                <span className="text-[#0F172A] font-bold font-mono text-xs font-medium">8.4 hrs / day</span>
              </div>
              <div className="flex items-center justify-between text-[#475569]">
                <span className="flex items-center gap-1.5 font-medium text-xs font-medium">
                  <Thermometer className="w-3 h-3 text-[#1B4332]" /> Brix Sweetness
                </span>
                <span className="text-[#1B4332] font-bold font-mono text-xs font-medium">18.5° Brix</span>
              </div>
            </div>
          </SpotlightCard>

          {/* ── Cell 4: 4:5 Zero Cold-Storage Specimen Card (Span 2 cols) ── */}
          <SpotlightCard className="md:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-black/[0.08] shadow-[0_10px_25px_rgba(60,45,20,0.03)] card-3d-highlight relative overflow-hidden flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <div className="sm:col-span-7 space-y-2">
                <span className="text-xs font-medium font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-600/20 inline-block">
                  Innovation 04 • Zero Spoilage Specimen
                </span>

                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                  Transparent Soil Provenance
                </h3>

                <p className="text-[#475569] text-xs leading-relaxed">
                  Traditional logistics keeps produce in cold chambers for weeks, eroding nutrients and flavor. Auxin harvests only on demand. Every crate displays soil pH, cultivator identity, and exact harvest minute.
                </p>

                <div className="pt-1 flex flex-wrap gap-1.5 text-xs font-medium">
                  <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-black/[0.06] text-[#475569] text-xs">
                    NPOP Organic Certified
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-600/20 text-emerald-800 text-xs">
                    Zero Formalin / Carbides
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-600/20 text-amber-800 text-xs">
                    Plucked 06:30 AM
                  </span>
                </div>
              </div>

              <div className="sm:col-span-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.08] p-3 space-y-2 shadow-2xs">
                <div className="text-xs font-bold text-[#1B4332] uppercase tracking-wider">
                  Cultivator Passport
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white border border-black/[0.08] flex items-center justify-center font-bold text-[#1B4332] text-xs shadow-2xs">
                    RK
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] text-xs">Ramesh Kumar</div>
                    <div className="text-xs text-[#64748B]">Sohna Orchards (14.2 km)</div>
                  </div>
                </div>
                <div className="pt-1 border-t border-black/[0.05] flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Lifetime Deliveries:</span>
                  <span className="text-[#0F172A] font-bold font-mono"><CountUpTicker end={1420} suffix=" crates" /></span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-[#64748B]">Customer Rating:</span>
                  <span className="text-amber-700 font-bold font-mono">★ 4.96 / 5.0</span>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}
