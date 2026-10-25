'use client';

/**
 * auxin-landing/src/components/hero/Hero3DRig.tsx
 * ============================================================================
 * AUXIN V3.5 — 3D TITANIUM PHONE RIG (ORGANIC CREAM LUXURY)
 * 
 * Master Engineering:
 * - Champagne titanium chassis with beveled specular highlights
 * - Real 3D gyro tilt tracking with perspective perspective:1400px
 * - Dynamic Island notch with lens reflection
 * - Exact iPhone ratio aspect-[9/19.5] (393x852)
 * - Zero dev indicator overlay
 * ============================================================================
 */

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { FloatingBadges } from './FloatingBadges';
import { Sparkles, MapPin, ShieldCheck, ArrowRight, Battery, Wifi, Signal } from 'lucide-react';

interface Hero3DRigProps {
  imageSrc?: string;
  onLaunchClick?: () => void;
}

export function Hero3DRig({ imageSrc, onLaunchClick }: Hero3DRigProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [specularPos, setSpecularPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // 3D Tilt angles (soft natural tilt, max 12 deg)
    const rX = -(y - 0.5) * 14;
    const rY = (x - 0.5) * 18;

    setRotateX(rX);
    setRotateY(rY);
    setSpecularPos({ x: x * 100, y: y * 100 });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
    setSpecularPos({ x: 50, y: 50 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[320px] sm:max-w-[360px] mx-auto py-6 [perspective:1400px] select-none"
    >
      {/* ── Parallax Floating Satellites (Re-anchored) ── */}
      <FloatingBadges
        mouseXRatio={specularPos.x / 100}
        mouseYRatio={specularPos.y / 100}
      />

      {/* ── 3D Titanium Phone Body ── */}
      <div
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${
            isHovered ? 1.02 : 1
          }, ${isHovered ? 1.02 : 1}, 1)`,
          transition: isHovered
            ? 'transform 0.1s ease-out'
            : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d',
        }}
        className="relative mx-auto rounded-[48px] p-2.5 bg-gradient-to-b from-[#E7E0D2] via-[#C8BDAB] to-[#B0A38E] shadow-[0_25px_60px_-10px_rgba(60,45,20,0.18),0_10px_20px_rgba(0,0,0,0.06)] border-[2px] border-[#DDD5C5]"
      >
        {/* Specular Edge Highlight */}
        <div className="absolute inset-0 rounded-[46px] border border-white/60 pointer-events-none" />

        {/* Volume Buttons & Power Mock on Rim */}
        <div className="absolute -left-[3.5px] top-28 w-[2px] h-10 bg-[#B5A995] rounded-l-md" />
        <div className="absolute -left-[3.5px] top-42 w-[2px] h-10 bg-[#B5A995] rounded-l-md" />
        <div className="absolute -right-[3.5px] top-32 w-[2px] h-14 bg-[#B5A995] rounded-r-md" />

        {/* Device Glass Bezel & Screen Canvas */}
        <div className="relative rounded-[40px] overflow-hidden bg-[#FAF7F2] border border-black/10 aspect-[9/19.5] shadow-inner">
          {/* Dynamic Island Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 h-6 w-24 bg-[#0F172A] rounded-full flex items-center justify-between px-2.5 shadow-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 border border-slate-700" />
          </div>

          {/* iOS Status Bar */}
          <div className="absolute top-3 left-6 right-6 z-30 flex items-center justify-between text-[11px] font-semibold text-[#0F172A] font-sans">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-[#0F172A]">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {/* Gorilla Glass Dynamic Specular Light Flare */}
          <div
            style={{
              background: `radial-gradient(circle at ${specularPos.x}% ${specularPos.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 50%, transparent 70%)`,
            }}
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          />

          {/* Screen Content */}
          {imageSrc ? (
            <div className="relative w-full h-full">
              <Image
                src={imageSrc}
                alt="Auxin Live App Experience"
                fill
                priority
                className="object-cover object-top"
              />
            </div>
          ) : (
            /* High-Fidelity Porcelain Preview inside Phone Screen */
            <div className="relative w-full h-full pt-12 pb-5 px-4 flex flex-col justify-between text-left overflow-hidden bg-gradient-to-b from-[#FDFCF9] via-[#FAF7F2] to-[#F5F2EB]">
              {/* Top Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-xs font-semibold text-[#0F172A]">
                      Palm Grove, Gurugram
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-600/15">
                    25 KM RADAR
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-black/[0.06] shadow-sm">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#D4AF37]" /> MORNING HARVEST
                    </span>
                    <span className="text-[#64748B] font-mono">06:30 AM</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A] tracking-tight">
                    Ratnagiri Alphonso Mangoes
                  </h4>
                  <p className="text-[11px] text-[#475569] line-clamp-1 mt-0.5">
                    Direct from Ramesh Kumar Farm, Sohna
                  </p>
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-black/[0.05]">
                    <span className="text-xs font-extrabold text-[#1B4332]">
                      ₹360 / dozen
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                      100% Margin to Farmer
                    </span>
                  </div>
                </div>

                {/* Live Dispatch Feed */}
                <div className="p-3 rounded-2xl bg-white/80 border border-black/[0.05] shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-semibold text-[#64748B]">
                    <span>LIVE COURIER DISPATCH</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      EN ROUTE
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-600/20 flex items-center justify-center text-emerald-800 text-xs font-bold">
                      VS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">
                        Vikram Singh (Cargo EV)
                      </div>
                      <div className="text-[10px] text-[#64748B] font-medium">
                        Speed: 28 km/h • ETA: 12 mins
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Escrow Card inside Device */}
              <div className="space-y-2 pt-2">
                <div className="p-2.5 rounded-2xl bg-white border border-emerald-600/20 shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <div>
                      <div className="text-[11px] font-bold text-[#0F172A]">
                        Escrow Locked: ₹360
                      </div>
                      <div className="text-[9px] text-[#64748B]">
                        Release on 6-digit OTP delivery
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    PROTECTED
                  </div>
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/customer/home'}
                  className="btn-press w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <span>Experience Live App</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
