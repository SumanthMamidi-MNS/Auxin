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
    <section id="innovations" className="relative py-28 bg-[#FAF7F2] overflow-hidden scroll-mt-24">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[350px] bg-radial from-[#D4AF37]/10 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-black/[0.08] text-[#1B4332] text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            Core Agritech Innovations
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight font-['Poppins']">
            The Bento Grid of <span className="text-gradient-forest">Architectural Breakthroughs</span>.
          </h2>
          <p className="text-[#475569] text-base sm:text-lg leading-relaxed">
            Four foundational engineering milestones power Auxin&apos;s hyper-local zero-rot supply chain.
          </p>
        </div>

        {/* 4-Cell Bento Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Cell 1: 25 KM Strict Haversine Radar (Span 2 cols) ── */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-[0_15px_40px_rgba(60,45,20,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-600/15 flex items-center gap-1.5">
                  <Radar className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                  Innovation 01 • Haversine Geofence
                </span>
                <span className="text-xs text-[#64748B] font-medium">
                  Strict 25.0 km Boundary
                </span>
              </div>

              <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                Autonomous 25 km Radar Logistics
              </h3>

              <p className="text-[#475569] text-sm max-w-xl leading-relaxed">
                Every customer order is mathematically bounded by real-time GPS coordinate triangulation. If a farm is outside the 25.0 km radius, it does not appear in your feed. This guarantees produce travels under 120 minutes from soil to kitchen.
              </p>
            </div>

            {/* Interactive Radar Distance Simulator */}
            <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#475569]">
                  Selected Farm Distance:
                </span>
                <span className="text-lg font-mono font-extrabold text-[#1B4332]">
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
                className="w-full h-2.5 bg-white rounded-lg appearance-none cursor-pointer accent-[#1B4332]"
              />

              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#64748B]">0 km (Farm Gate)</span>
                {simDistance <= 25 ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> IN RADAR (Instant 2h Dispatch)
                  </span>
                ) : (
                  <span className="text-red-600 font-bold">
                    OUTSIDE GEOFENCE (&gt;25 km Rejected)
                  </span>
                )}
                <span className="text-[#64748B]">25 km Limit</span>
              </div>
            </div>
          </div>

          {/* ── Cell 2: 3D Cryptographic Escrow Vault OTP Simulator (Span 1 col) ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-[0_15px_40px_rgba(60,45,20,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-600/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  Innovation 02 • Escrow Vault
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                2-Phase Doorstep Escrow
              </h3>

              <p className="text-[#475569] text-xs leading-relaxed">
                Funds remain locked in a Razorpay cryptographic escrow vault until you inspect produce at your doorstep and verify the 6-digit OTP.
              </p>
            </div>

            {/* OTP Simulator */}
            <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-4">
              <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
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

              {/* 6 Digit Inputs */}
              <div className="flex justify-between gap-1">
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
                    className="w-9 h-11 text-center font-mono text-lg font-bold bg-white border border-black/[0.12] rounded-lg text-[#1B4332] focus:border-[#1B4332] focus:ring-1 focus:ring-[#1B4332] outline-none shadow-2xs"
                  />
                ))}
              </div>

              {vaultUnlocked ? (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-600/30 text-center space-y-1">
                  <div className="text-xs font-bold text-emerald-900 font-mono">
                    ✅ Escrow Settled Instantly
                  </div>
                  <div className="text-[10px] text-emerald-800 font-mono">
                    ₹360 to Ramesh Kumar • ₹40 to Courier Vikram
                  </div>
                  <button
                    onClick={resetVault}
                    className="btn-press mt-1 text-[11px] text-[#64748B] hover:text-[#0F172A] underline font-medium cursor-pointer"
                  >
                    Reset Simulator
                  </button>
                </div>
              ) : (
                <button
                  onClick={autoFillOtp}
                  className="btn-press w-full py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-600/30 text-emerald-900 text-xs font-bold font-mono transition-colors shadow-2xs cursor-pointer"
                >
                  Click to Auto-Fill &apos;482103&apos;
                </button>
              )}
            </div>
          </div>

          {/* ── Cell 3: Milo AI Autonomous Copilot (Span 1 col) ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-[0_15px_40px_rgba(60,45,20,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-600/15 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                  Innovation 03 • Milo AI
                </span>
              </div>

              <h3 className="text-xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                Agronomic Intelligence
              </h3>

              <p className="text-[#475569] text-xs leading-relaxed">
                Fine-tuned AI copilot trained on regional Indian soil indices, crop harvest cycles, and real-time wholesale Mandi arbitrage.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#FAF7F2] border border-black/[0.06] space-y-3 text-xs">
              <div className="flex items-center justify-between text-[#475569] pb-2 border-b border-black/[0.05]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" /> Soil Moisture
                </span>
                <span className="text-[#0F172A] font-bold font-mono">68% (Optimal)</span>
              </div>
              <div className="flex items-center justify-between text-[#475569] pb-2 border-b border-black/[0.05]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-600" /> Sunlight Index
                </span>
                <span className="text-[#0F172A] font-bold font-mono">8.4 hrs / day</span>
              </div>
              <div className="flex items-center justify-between text-[#475569]">
                <span className="flex items-center gap-1.5 font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-[#1B4332]" /> Brix Sweetness
                </span>
                <span className="text-[#1B4332] font-bold font-mono">18.5° Brix</span>
              </div>
            </div>
          </div>

          {/* ── Cell 4: 4:5 Zero Cold-Storage Specimen Card (Span 2 cols) ── */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.08] shadow-[0_15px_40px_rgba(60,45,20,0.05)] relative overflow-hidden flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7 space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-600/20 inline-block">
                  Innovation 04 • Zero Spoilage Specimen
                </span>

                <h3 className="text-2xl font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                  Transparent Soil Provenance
                </h3>

                <p className="text-[#475569] text-sm leading-relaxed">
                  Traditional logistics keeps produce in cold chambers for weeks, eroding nutrients and flavor. Auxin harvests only on demand. Every crate displays soil pH, cultivator identity, and exact harvest minute.
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs font-medium">
                  <span className="px-3 py-1 rounded-full bg-[#FAF7F2] border border-black/[0.06] text-[#475569]">
                    NPOP Organic Certified
                  </span>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-600/20 text-emerald-800">
                    Zero Formalin / Carbides
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-600/20 text-amber-800">
                    Plucked 06:30 AM
                  </span>
                </div>
              </div>

              <div className="sm:col-span-5 rounded-2xl bg-[#FAF7F2] border border-black/[0.08] p-5 space-y-3 shadow-2xs">
                <div className="text-[11px] font-bold text-[#1B4332] uppercase tracking-wider">
                  Cultivator Passport
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-black/[0.08] flex items-center justify-center font-bold text-[#1B4332] text-base shadow-2xs">
                    RK
                  </div>
                  <div>
                    <div className="font-bold text-[#0F172A] text-sm">Ramesh Kumar</div>
                    <div className="text-xs text-[#64748B]">Sohna Orchards (14.2 km)</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-black/[0.05] flex justify-between text-xs">
                  <span className="text-[#64748B]">Lifetime Deliveries:</span>
                  <span className="text-[#0F172A] font-bold font-mono">1,420 crates</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748B]">Customer Rating:</span>
                  <span className="text-amber-700 font-bold font-mono">★ 4.96 / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
