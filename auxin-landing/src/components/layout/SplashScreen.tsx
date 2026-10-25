'use client';

/**
 * auxin-landing/src/components/layout/SplashScreen.tsx
 * ============================================================================
 * AUXIN V4.0 — LUXURY SIGNATURE APP PRELOADER
 * 
 * Signature Experience:
 * - High-end 3D porcelain squircle with gold & emerald specular glow
 * - Official golden Auxin botanical monogram (/logo-cropped.png)
 * - Brand wordmark: AUXIN • Direct-From-Farm Protocol
 * - Animated shimmer progress indicator with live percentage
 * - Rotating real-time system status indicators
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

const STATUS_MESSAGES = [
  'Calibrating 25km local farm geofence...',
  'Connecting direct cultivator ledger...',
  'Verifying escrow smart settlement protocol...',
  'Synchronizing zero-emission courier fleet...',
  'Finalizing presentation deck...',
];

export function SplashScreen({ onComplete, forceShow = false }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    // Smooth status message rotation across 5 stages
    const msgInterval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 650);

    // Progress counter: smoothly reaches 100% in 3.0 seconds
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return Math.min(100, prev + 1); // 100 increments * 30ms = 3000ms
      });
    }, 30);

    // Fade out trigger after at least 3.2 seconds
    const timeout = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 700);
    }, 3200);

    return () => {
      clearInterval(interval);
      clearInterval(msgInterval);
      clearTimeout(timeout);
    };
  }, [forceShow, onComplete]);

  if (!visible) return null;

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 350);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FDFBF6] transition-all duration-700 ease-in-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Auxin Loading Screen"
      role="dialog"
    >
      {/* Background Multi-tier Botanical & Solar Glow matching original app */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_40%] from-[#22C55E]/15 via-[#D4AF37]/10 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-radial-[circle_at_50%_75%] from-[#D4AF37]/12 via-transparent to-transparent pointer-events-none" />

      {/* Main Luxury Preloader Card */}
      <div className="relative flex flex-col items-center px-6">
        {/* Glowing Halo */}
        <div className="absolute -inset-10 rounded-full bg-emerald-500/10 blur-3xl animate-pulse pointer-events-none" />

        {/* 3D Porcelain Squircle with Logo */}
        <div className="relative w-24 h-24 rounded-3xl bg-white shadow-[0_20px_50px_rgba(27,67,50,0.12)] border border-[#D4AF37]/30 p-3 flex items-center justify-center mb-6 transition-transform duration-500">
          <div className="absolute -inset-2 bg-gradient-to-tr from-emerald-500/15 to-[#D4AF37]/25 rounded-3xl blur-md pointer-events-none" />
          <Image
            src="/logo-cropped.png"
            alt="Auxin Logo"
            width={72}
            height={72}
            className="object-contain relative z-10"
            priority
          />
        </div>

        {/* Brand Wordmark & Protocol Title */}
        <div className="text-center space-y-1 mb-6">
          <h1
            className="font-extrabold text-3xl tracking-tight text-[#0F172A]"
            style={{ fontFamily: 'var(--font-heading, "Poppins", sans-serif)' }}
          >
            AUXIN
          </h1>
          <p className="text-xs font-bold text-emerald-800 tracking-[0.2em] uppercase">
            Direct-From-Farm Protocol
          </p>
        </div>

        {/* Shimmering Progress Bar */}
        <div className="w-56 h-1.5 bg-slate-200/80 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-emerald-600 via-[#D4AF37] to-emerald-600 rounded-full transition-all duration-100 ease-out animate-shimmer"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Live Rotating Telemetry Status */}
        <div className="h-6 mt-4 flex items-center justify-center">
          <p className="text-xs font-mono font-medium text-[#64748B] tracking-wide animate-fade-in text-center">
            {STATUS_MESSAGES[msgIdx]}
          </p>
        </div>

        <span className="text-[10px] font-mono font-bold text-[#94A3B8] mt-2 tracking-widest uppercase">
          {Math.round(progress)}% Loaded
        </span>
      </div>

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="btn-press absolute bottom-8 right-8 text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-3.5 py-1.5 rounded-full bg-white/80 border border-black/[0.08] shadow-sm backdrop-blur-md cursor-pointer transition-colors"
      >
        Skip Intro →
      </button>
    </div>
  );
}
