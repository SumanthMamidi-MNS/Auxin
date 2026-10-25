'use client';

/**
 * auxin-landing/src/app/page.tsx
 * ============================================================================
 * AUXIN V3.5 — "THE GREATEST OF ALL TIME" (GOAT) LANDING PAGE
 * ORGANIC CREAM LUXURY EDITION
 * 
 * Lead Architect: Sumanth Mamidi (@SumanthMamidi-MNS)
 * Warm Organic Cream • Champagne Titanium 3D Rig • Zero Middleman Mandi
 * 2-Phase Razorpay Escrow • 25 km Geofenced Radar • Milo AI Copilot
 * ============================================================================
 */

import React, { useState } from 'react';
import { SplashScreen } from '@/components/layout/SplashScreen';
import { StickyNavbar } from '@/components/layout/StickyNavbar';
import { HeroSection } from '@/components/hero/HeroSection';
import { ComparisonMatrix } from '@/components/features/ComparisonMatrix';
import { BentoInnovations } from '@/components/features/BentoInnovations';
import { RolePortalsStage } from '@/components/features/RolePortalsStage';
import { MiloPlayground } from '@/components/features/MiloPlayground';
import { TechArchitecture } from '@/components/features/TechArchitecture';
import { RecruiterDossier } from '@/components/features/RecruiterDossier';
import { AmbientFooter } from '@/components/layout/AmbientFooter';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(false);

  const handleReplayIntro = () => {
    setShowSplash(true);
  };

  return (
    <>
      {/* ── 00. Animated Sprout & Oxygen Splash Screen ── */}
      <SplashScreen forceShow={showSplash} onComplete={() => setShowSplash(false)} />

      <main className="min-h-screen bg-[#FAF7F2] text-[#0F172A] selection:bg-[#D4AF37]/25 selection:text-[#1B4332] relative overflow-x-hidden">
        {/* ── 01. Floating Island Navigation ── */}
        <StickyNavbar />

        {/* ── 02. Hero Stage & 3D Titanium Phone Rig ── */}
        <HeroSection heroImage="/screenshots/04_mobile_customer_product_detail.png" />

        {/* ── 03. Mandi vs. Auxin Margin Economics & Household Savings Slider ── */}
        <ComparisonMatrix />

        {/* ── 04. Bento Grid of 4 Core Architectural Breakthroughs ── */}
        <BentoInnovations />

        {/* ── 05. 4-Role Unified Portals Morphing Stage ── */}
        <RolePortalsStage />

        {/* ── 06. Milo AI Agronomic Copilot Typewriter Playground ── */}
        <MiloPlayground />

        {/* ── 07. Full-Stack System Architecture & Interactive API Terminal ── */}
        <TechArchitecture />

        {/* ── 08. Recruiter Fast-Track Dossier & One-Click Sandbox Matrix ── */}
        <RecruiterDossier />

        {/* ── 09. Organic Luxury Conversion Footer & Live Platform Telemetry ── */}
        <AmbientFooter onReplayIntro={handleReplayIntro} />
      </main>
    </>
  );
}
