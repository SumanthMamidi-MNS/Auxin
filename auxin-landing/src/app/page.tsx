'use client';

/**
 * auxin-landing/src/app/page.tsx
 * ============================================================================
 * AUXIN V3.0 — "THE GREATEST OF ALL TIME" (GOAT) LANDING PAGE
 * 
 * Architected & Engineered by Sumanth Mamidi (@SumanthMamidi-MNS)
 * Obsidian Agritech Luxury • 3D Spatial Gyro Perspective • Zero Commission
 * 2-Phase Razorpay Escrow • 25 km Geofenced Radar • Milo AI Copilot
 * ============================================================================
 */

import React from 'react';
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
  return (
    <main className="min-h-screen bg-[#030705] text-white selection:bg-emerald-500/30 selection:text-white relative overflow-x-hidden">
      {/* ── Fixed Floating Specular Navigation ── */}
      <StickyNavbar />

      {/* ── 01. 3D Gyro-Tilt Hero Stage with Topographic Sonar Mesh ── */}
      <HeroSection />

      {/* ── 02. Mandi vs. Auxin Margin Economics & Household Savings Slider ── */}
      <ComparisonMatrix />

      {/* ── 03. Bento Grid of 4 Core Architectural Breakthroughs ── */}
      <BentoInnovations />

      {/* ── 04. 4-Role Unified Portals Morphing Stage (Customer, Farmer, Courier, Admin) ── */}
      <RolePortalsStage />

      {/* ── 05. Milo AI Agronomic Copilot Typewriter Playground ── */}
      <MiloPlayground />

      {/* ── 06. Full-Stack System Architecture & Interactive API Terminal ── */}
      <TechArchitecture />

      {/* ── 07. Recruiter Fast-Track Dossier & One-Click Sandbox Matrix ── */}
      <RecruiterDossier />

      {/* ── 08. Obsidian Ambient Conversion Footer & Portal Status ── */}
      <AmbientFooter />
    </main>
  );
}
