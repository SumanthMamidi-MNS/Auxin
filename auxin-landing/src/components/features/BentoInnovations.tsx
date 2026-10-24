'use client';

import React, { useState, useRef } from 'react';
import { 
  Radar, 
  ShieldCheck, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
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

  const colors = ['#22C55E', '#4ADE80', '#D4AF37', '#F59E0B', '#FFFFFF'];
  const particleCount = 70;
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
  const startY = window.innerHeight * 0.65;

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
    <section id="innovations" className="relative py-28 bg-[#030705] overflow-hidden scroll-mt-24">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[350px] bg-emerald-500/5 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Core Agritech Innovations
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            The Bento Grid of <span className="text-gradient-chlorophyll">Architectural Breakthroughs</span>.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg">
            Four structural engineering breakthroughs power Auxin&apos;s hyper-local zero-rot supply chain.
          </p>
        </div>

        {/* 4-Cell Bento Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ── Cell 1: 25 KM Strict Haversine Radar (Span 2 cols) ── */}
          <div className="md:col-span-2 glass-obsidian-elevated rounded-3xl p-6 sm:p-8 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                  <Radar className="w-3.5 h-3.5 animate-spin" />
                  Innovation 01 • Haversine Geofence
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Strict 25.0 km Boundary
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white tracking-tight">
                Autonomous 25 km Radar Logistics
              </h3>

              <p className="text-slate-300 text-sm max-w-xl">
                Every customer order is mathematically bounded by real-time GPS coordinate triangulation. If a farm is outside the 25.0 km radius, it does not appear in your feed. This guarantees produce travels under 120 minutes from soil to kitchen.
              </p>
            </div>

            {/* Interactive Radar Distance Simulator */}
            <div className="mt-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  Selected Farm Distance:
                </span>
                <span className="text-lg font-mono font-bold text-emerald-400">
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
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">0 km (Farm Gate)</span>
                {simDistance <= 25 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> IN RADAR (Instant 2h Dispatch)
                  </span>
                ) : (
                  <span className="text-red-400 font-bold">
                    OUTSIDE GEOFENCE (&gt;25 km Rejected)
                  </span>
                )}
                <span className="text-slate-400">25 km Limit</span>
              </div>
            </div>
          </div>

          {/* ── Cell 2: 3D Cryptographic Escrow Vault OTP Simulator (Span 1 col) ── */}
          <div className="glass-obsidian-elevated rounded-3xl p-6 sm:p-8 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Innovation 02 • Escrow Vault
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                2-Phase Doorstep Escrow
              </h3>

              <p className="text-slate-300 text-xs">
                Funds are locked in a Razorpay escrow vault until you verify produce quality at doorstep with a 6-digit OTP.
              </p>
            </div>

            {/* OTP Simulator */}
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>SIMULATE DELIVERY OTP:</span>
                {vaultUnlocked ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Unlock className="w-3 h-3" /> VAULT OPEN
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> LOCKED (₹360.00)
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
                    className="w-9 h-11 text-center font-mono text-lg font-bold bg-white/[0.05] border border-white/20 rounded-lg text-emerald-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                ))}
              </div>

              {vaultUnlocked ? (
                <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-center space-y-1">
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    ✅ Escrow Settled Instantly
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono">
                    ₹360 to Ramesh Kumar • ₹40 to Courier Vikram
                  </div>
                  <button
                    onClick={resetVault}
                    className="mt-1 text-[10px] text-slate-400 hover:text-white underline font-mono"
                  >
                    Reset Simulator
                  </button>
                </div>
              ) : (
                <button
                  onClick={autoFillOtp}
                  className="w-full py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono transition-colors"
                >
                  Click to Auto-Fill &apos;482103&apos;
                </button>
              )}
            </div>
          </div>

          {/* ── Cell 3: Milo AI Autonomous Copilot (Span 1 col) ── */}
          <div className="glass-obsidian-elevated rounded-3xl p-6 sm:p-8 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />
                  Innovation 03 • Milo AI
                </span>
              </div>

              <h3 className="text-xl font-bold text-white tracking-tight">
                Agronomic Intelligence
              </h3>

              <p className="text-slate-300 text-xs">
                Fine-tuned AI copilot trained on regional Indian soil indices, crop cycles, and real-time wholesale Mandi arbitrage.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" /> Soil Moisture
                </span>
                <span className="text-white font-bold">68% (Optimal)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-white/10">
                <span className="flex items-center gap-1">
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Sunlight Index
                </span>
                <span className="text-white font-bold">8.4 hrs / day</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> Brix Sweetness
                </span>
                <span className="text-emerald-400 font-bold">18.5° Brix</span>
              </div>
            </div>
          </div>

          {/* ── Cell 4: 4:5 Zero Cold-Storage Specimen Card (Span 2 cols) ── */}
          <div className="md:col-span-2 glass-obsidian-elevated rounded-3xl p-6 sm:p-8 border border-emerald-500/20 relative overflow-hidden flex flex-col justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-7 space-y-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20 inline-block">
                  Innovation 04 • Zero Spoilage Specimen
                </span>

                <h3 className="text-2xl font-bold text-white tracking-tight">
                  Transparent Soil Provenance
                </h3>

                <p className="text-slate-300 text-sm">
                  Traditional logistics keeps produce in cold chambers for weeks, eroding nutrients and flavor. Auxin harvests only on demand. Every crate displays soil pH, cultivator identity, and exact harvest minute.
                </p>

                <div className="pt-2 flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-slate-300">
                    NPOP Organic Certified
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-emerald-400">
                    Zero Formalin / Carbides
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/10 text-amber-300">
                    Plucked 06:30 AM
                  </span>
                </div>
              </div>

              <div className="sm:col-span-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 p-4 space-y-3">
                <div className="text-[11px] font-mono text-emerald-400 uppercase">
                  Cultivator Passport
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-lg">
                    RK
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">Ramesh Kumar</div>
                    <div className="text-xs text-slate-400">Sohna Orchards (14.2 km)</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Lifetime Deliveries:</span>
                  <span className="text-white font-bold">1,420 crates</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Customer Rating:</span>
                  <span className="text-amber-400 font-bold">★ 4.96 / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
