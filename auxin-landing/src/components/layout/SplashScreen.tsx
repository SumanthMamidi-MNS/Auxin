'use client';

/**
 * auxin-landing/src/components/layout/SplashScreen.tsx
 * ============================================================================
 * AUXIN V3.5 — ORGANIC CREAM SPROUT & OXYGEN SPLASH SCREEN
 * 
 * Cinematic Botanical Intro:
 * - Animated SVG seedling emerging from fertile soil node
 * - "Auxin: The Master Plant Growth Hormone • Oxygenating Local Agriculture"
 * - Monogram letter-spacing tracking expansion
 * - Smooth champagne progress indicator & graceful curtain dissolve
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function SplashScreen({ onComplete, forceShow = false }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Check if user already saw the splash screen in this session
    if (!forceShow) {
      const hasSeen = typeof window !== 'undefined' ? sessionStorage.getItem('auxin_splash_seen') : null;
      if (hasSeen === 'true') {
        setVisible(false);
        onComplete?.();
        return;
      }
    }

    // Progress timer
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5; // reaches 100 in ~1.2s
      });
    }, 30);

    // Fade out trigger
    const timeout = setTimeout(() => {
      setFadingOut(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auxin_splash_seen', 'true');
      }
      setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 700); // match fade duration
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [forceShow, onComplete]);

  if (!visible) return null;

  const handleSkip = () => {
    setFadingOut(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('auxin_splash_seen', 'true');
    }
    setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 400);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF7F2] transition-all duration-700 ease-in-out ${
        fadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Auxin Loading Screen"
      role="dialog"
    >
      {/* Background Soft Sunbeam */}
      <div className="absolute inset-0 bg-radial-[circle_at_50%_45%] from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />

      {/* Main Seedling / Sprout SVG Stage */}
      <div className="relative flex flex-col items-center">
        {/* Glowing Halo */}
        <div className="absolute -inset-10 rounded-full bg-emerald-100/50 blur-2xl animate-ring-pulse pointer-events-none" />

        {/* Botanical Sprout Animated SVG */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-6">
          <svg
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_8px_20px_rgba(27,67,50,0.15)]"
          >
            {/* Soil Mound Base */}
            <path
              d="M30 95 C 45 88, 75 88, 90 95 C 75 99, 45 99, 30 95 Z"
              fill="#D4AF37"
              opacity="0.35"
            />
            <ellipse cx="60" cy="94" rx="20" ry="3" fill="#B45309" opacity="0.4" />

            {/* Central Sprout Stem */}
            <path
              d="M60 92 Q 60 62 60 38"
              stroke="#1B4332"
              strokeWidth="4"
              strokeLinecap="round"
              className="animate-sprout"
            />

            {/* Left Leaf (Unfurling) */}
            <path
              d="M60 52 C 40 45, 34 32, 45 28 C 55 24, 60 40, 60 52 Z"
              fill="#2D6A4F"
              className="animate-leaf-left"
            />
            {/* Left Leaf Inner Vein */}
            <path
              d="M58 48 C 50 42, 46 34, 48 30"
              stroke="#D8F3DC"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Right Leaf (Unfurling) */}
            <path
              d="M60 44 C 80 37, 86 24, 75 20 C 65 16, 60 32, 60 44 Z"
              fill="#1B4332"
              className="animate-leaf-right"
            />
            {/* Right Leaf Inner Vein */}
            <path
              d="M62 40 C 70 34, 74 26, 72 22"
              stroke="#D8F3DC"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />

            {/* Oxygenating Micro Droplet / Auxin Molecule (Top Apex) */}
            <circle
              cx="60"
              cy="34"
              r="4"
              fill="#D4AF37"
              className="animate-pulse"
            />
            <circle
              cx="60"
              cy="34"
              r="7"
              stroke="#D4AF37"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
              className="animate-spin"
            />
          </svg>
        </div>

        {/* Wordmark Brand Name */}
        <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-[0.25em] uppercase mb-1 font-['Poppins']">
          A U X I N
        </h1>

        {/* Scientific Subtitle & Oxygen Badge */}
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
          <p className="text-xs uppercase tracking-[0.18em] font-semibold text-[#1B4332]">
            The Master Plant Hormone
          </p>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1B4332]" />
        </div>

        <p className="text-xs text-[#64748B] mt-2 font-medium tracking-wide">
          Oxygenating Local Agriculture & Direct Cultivator Trust
        </p>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1 bg-black/[0.06] rounded-full mt-6 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#D4AF37] rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <span className="text-[10px] font-mono font-semibold text-[#94A3B8] mt-2 tracking-widest">
          {Math.round(progress)}% INITIALIZED
        </span>
      </div>

      {/* Skip Intro Button */}
      <button
        onClick={handleSkip}
        className="btn-press absolute bottom-8 right-8 text-xs font-medium text-[#64748B] hover:text-[#0F172A] px-3.5 py-1.5 rounded-full bg-white/70 border border-black/[0.06] shadow-sm backdrop-blur-md cursor-pointer transition-colors"
      >
        Skip Intro →
      </button>
    </div>
  );
}
