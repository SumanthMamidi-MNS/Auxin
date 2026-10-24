'use client';

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
    const x = (e.clientX - rect.left) / rect.width; // 0 to 1
    const y = (e.clientY - rect.top) / rect.height; // 0 to 1

    // 3D Tilt angles (max 14 degrees)
    const rX = -(y - 0.5) * 16;
    const rY = (x - 0.5) * 20;

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
      className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto py-8 [perspective:1400px] select-none"
    >
      {/* ── Parallax Floating Satellites ── */}
      <FloatingBadges
        mouseXRatio={specularPos.x / 100}
        mouseYRatio={specularPos.y / 100}
      />

      {/* ── Outer 3D Gyro Device Body ── */}
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
        className="relative mx-auto rounded-[48px] p-3 bg-gradient-to-b from-slate-700 via-slate-900 to-black shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(34,197,94,0.25)] border-[2.5px] border-slate-600/50"
      >
        {/* Device Rim Bezel Highlights */}
        <div className="absolute inset-0 rounded-[46px] border border-white/20 pointer-events-none" />

        {/* Volume Buttons & Power Button Mock */}
        <div className="absolute -left-[4.5px] top-28 w-[2.5px] h-10 bg-slate-600 rounded-l-md" />
        <div className="absolute -left-[4.5px] top-42 w-[2.5px] h-10 bg-slate-600 rounded-l-md" />
        <div className="absolute -right-[4.5px] top-32 w-[2.5px] h-14 bg-slate-600 rounded-r-md" />

        {/* Glass Screen Canvas */}
        <div className="relative rounded-[38px] overflow-hidden bg-[#06120B] border border-white/10 aspect-[9/19.5]">
          {/* Dynamic Island Notch */}
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 h-6 w-24 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
          </div>

          {/* iOS Status Bar */}
          <div className="absolute top-3 left-6 right-6 z-30 flex items-center justify-between text-[11px] font-semibold text-slate-300 font-mono">
            <span>09:41</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Gorilla Glass Dynamic Specular Light Flare */}
          <div
            style={{
              background: `radial-gradient(circle at ${specularPos.x}% ${specularPos.y}%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 45%, transparent 65%)`,
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
            /* High-Fidelity Interactive Preview inside Phone Screen */
            <div className="relative w-full h-full pt-12 pb-6 px-4 flex flex-col justify-between text-left overflow-hidden bg-gradient-to-b from-[#06150D] via-[#040A07] to-[#020503]">
              {/* Top Banner */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-200">
                      Palm Grove Enclave, Gurugram
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    25 KM RADAR
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-emerald-900/20 border border-emerald-500/30 shadow-inner">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold mb-1">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> MORNING HARVEST
                    </span>
                    <span className="text-slate-400 font-mono">06:30 AM</span>
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-tight">
                    Ratnagiri Alphonso Mangoes
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">
                    Direct from Ramesh Kumar Farm, Sohna
                  </p>
                  <div className="mt-2 flex items-center justify-between pt-2 border-t border-emerald-500/20">
                    <span className="text-xs font-bold text-emerald-400">
                      ₹360 / dozen
                    </span>
                    <span className="text-[10px] font-medium text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      100% Margin to Farmer
                    </span>
                  </div>
                </div>

                {/* Live Dispatch Feed */}
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>LIVE COURIER STATUS</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      MOVING
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-xs font-bold">
                      VS
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        Vikram Singh (Cargo EV)
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Speed: 28 km/h • ETA: 12 mins
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Escrow Card inside Device */}
              <div className="space-y-2 pt-2">
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-[11px] font-bold text-white">
                        Escrow Locked: ₹360
                      </div>
                      <div className="text-[9px] text-slate-400">
                        Release on 6-digit OTP verification
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    PROTECTED
                  </div>
                </div>

                <a
                  href={process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000/customer/home'}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all duration-200"
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
