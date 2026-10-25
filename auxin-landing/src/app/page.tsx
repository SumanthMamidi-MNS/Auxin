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
import { ScreensExplorer } from '@/components/features/ScreensExplorer';
import { BentoInnovations } from '@/components/features/BentoInnovations';
import { RolePortalsStage } from '@/components/features/RolePortalsStage';
import { MiloPlayground } from '@/components/features/MiloPlayground';
import { TechArchitecture } from '@/components/features/TechArchitecture';
import { RecruiterDossier } from '@/components/features/RecruiterDossier';
import { AmbientFooter } from '@/components/layout/AmbientFooter';
import { DeployedNoticeToast } from '@/components/layout/DeployedNoticeToast';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(false);

  return (
    <>
      {/* ── 00. Animated Sprout & Oxygen Splash Screen ── */}
      <SplashScreen forceShow={showSplash} onComplete={() => setShowSplash(false)} />

      <main className="min-h-screen bg-white text-[#0B0F19] selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-x-hidden">
        {/* ── 01. Floating Island Navigation ── */}
        <StickyNavbar />

        {/* ── 02. Hero Stage & 3D Titanium Phone Rig ── */}
        <HeroSection heroImage="/screenshots/04_mobile_customer_product_detail.png" />

        {/* ── 03. Mandi vs. Auxin Margin Economics & Household Savings Slider ── */}
        <ComparisonMatrix />

        {/* ── 04. 36-Screen Interactive Ecosystem Explorer (9 Screens x 4 Roles) ── */}
        <ScreensExplorer />

        {/* ── 05. Bento Grid of 4 Core Architectural Breakthroughs ── */}
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
        <AmbientFooter />

        {/* ── 10. Deployed Soon Global Feedback Notification ── */}
        <DeployedNoticeToast />
      </main>
    </>
  );
}
