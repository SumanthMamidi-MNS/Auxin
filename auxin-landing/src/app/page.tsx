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

import React, { useState, useEffect } from 'react';
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
import { ComingSoonModal } from '@/components/layout/ComingSoonModal';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    // 1. Reading & Scroll Progress Beam
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 2. Scroll-Triggered Reveal Transitions
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* ── Top Reading & Scroll Progress Beam ── */}
      <div className="top-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* ── 00. Animated Sprout & Oxygen Splash Screen ── */}
      <SplashScreen forceShow={showSplash} onComplete={() => setShowSplash(false)} />

      <main className="min-h-screen bg-white text-[#0B0F19] selection:bg-emerald-500/20 selection:text-emerald-900 relative overflow-x-hidden">
        {/* ── 01. Floating Island Navigation ── */}
        <StickyNavbar />

        {/* ── 02. Hero Stage & 3D Titanium Phone Rig ── */}
        <HeroSection heroImage="/screenshots/04_mobile_customer_product_detail.png" />

        {/* ── 03. Mandi vs. Auxin Margin Economics & Household Savings Slider ── */}
        <div className="reveal-on-scroll">
          <ComparisonMatrix />
        </div>

        {/* ── 04. 36-Screen Interactive Ecosystem Explorer (9 Screens x 4 Roles) ── */}
        <div className="reveal-on-scroll">
          <ScreensExplorer />
        </div>

        {/* ── 05. Bento Grid of 4 Core Architectural Breakthroughs ── */}
        <div className="reveal-on-scroll">
          <BentoInnovations />
        </div>

        {/* ── 05. 4-Role Unified Portals Morphing Stage ── */}
        <div className="reveal-on-scroll">
          <RolePortalsStage />
        </div>

        {/* ── 06. Milo AI Agronomic Copilot Typewriter Playground ── */}
        <div className="reveal-on-scroll">
          <MiloPlayground />
        </div>

        {/* ── 07. Full-Stack System Architecture & Interactive API Terminal ── */}
        <div className="reveal-on-scroll">
          <TechArchitecture />
        </div>

        {/* ── 08. Recruiter Fast-Track Dossier & One-Click Sandbox Matrix ── */}
        <div className="reveal-on-scroll">
          <RecruiterDossier />
        </div>

        {/* ── 09. Organic Luxury Conversion Footer & Live Platform Telemetry ── */}
        <AmbientFooter />

        {/* ── 10. Premier Coming Soon Luxury Announcement Modal ── */}
        <ComingSoonModal />
      </main>
    </>
  );
}
