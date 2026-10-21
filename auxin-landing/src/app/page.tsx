"use client";

/**
 * auxin-landing/src/app/page.tsx
 * ============================================================================
 * AUXIN V3.0 — FLAGSHIP SHOWCASE & MARKETING LANDING PAGE
 * 
 * Architected & Engineered by Sumanth Mamidi (@SumanthMamidi-MNS)
 * High-conversion presentation for customers, farmers, logistics partners,
 * investors, and production Vercel deployment.
 * ============================================================================
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Sparkles,
  ShoppingBag,
  Tractor,
  Truck,
  Bot,
  ExternalLink,
  Lock,
  ChevronDown,
  CheckCircle2,
  Users,
  Store,
  Navigation,
  KeyRound,
  Check,
  Award
} from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Configurable production and development destinations
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";
const GITHUB_REPO_URL = "https://github.com/SumanthMamidi-MNS/Auxin";

// ── Role Interactive Portals Data ───────────────────────────────────────────
const PORTAL_TABS = [
  {
    id: "customer",
    title: "Customer Marketplace",
    icon: ShoppingBag,
    badge: "Discovery & Freshness",
    headline: "Pure Farm-Fresh Produce, Delivered in 2 Hours",
    description:
      "Browse neighboring harvest fields within 25 km. Compare organic certification, exact harvest timestamps, and cultivator pricing with zero retail markups.",
    features: [
      "Real-time 25 km hyper-local farm provenance tags",
      "4:5 vertical portrait crop imagery with soil context",
      "Two-phase atomic escrow protection on every order",
      "Live 5-milestone journey tracking with ETA badge"
    ],
    screenshot: "/screenshots/03_mobile_customer_home.png",
    mobileScreenshotAlt: "Auxin Customer Mobile App",
    linkText: "Shop Fresh Produce →",
    targetRoute: `${APP_URL}/customer/home`
  },
  {
    id: "farmer",
    title: "Farmer Business Center",
    icon: Tractor,
    badge: "100% Direct Margins",
    headline: "Run a Thriving Digital Farm Business",
    description:
      "Eliminate local commission agents and wholesale mandis. Set your own prices, track real-time stock health, and receive daily automated bank payouts.",
    features: [
      "Operations Radar with 2-hour packing countdown SLA",
      "Visual crop stock capacity gauges & master catalogue picker",
      "Direct Escrow payouts to verified IFSC bank accounts",
      "7-day revenue velocity charts & gross margin analytics"
    ],
    screenshot: "/screenshots/08_mobile_farmer_dashboard.png",
    mobileScreenshotAlt: "Auxin Farmer Operations Mobile App",
    linkText: "Launch Farmer Portal →",
    targetRoute: `${APP_URL}/farmer/dashboard`
  },
  {
    id: "delivery",
    title: "Delivery Partner HUD",
    icon: Truck,
    badge: "₹40 / Drop Guaranteed",
    headline: "Distraction-Free Two-Wheeler Navigation",
    description:
      "A turn-by-turn mission heads-up display built for riders under bright sunlight. GPS route mapping, 25 km discovery radar, and doorstep cryptographic OTP proof.",
    features: [
      "Stage color shift: Amber (Farm Pickup) → Emerald (Doorstep Drop)",
      "Live Leaflet GPS route map with zero layout thrashing",
      "6-digit cryptographic handshake OTP verification",
      "Immediate trip completion payout & transparent logs"
    ],
    screenshot: "/screenshots/12_mobile_delivery_mission_hud.png",
    mobileScreenshotAlt: "Auxin Delivery Mission HUD Mobile App",
    linkText: "Open Delivery HUD →",
    targetRoute: `${APP_URL}/delivery/dashboard`
  },
  {
    id: "admin",
    title: "Super Admin Control Room",
    icon: ShieldCheck,
    badge: "Desktop Operations",
    headline: "City-Scale Agricultural Command Center",
    description:
      "Full administrative governance. Real-time platform health telemetry, farmer KYC land document verification, master 120-produce catalogue, and live delivery dispatch.",
    features: [
      "Instant farmer & delivery partner document approval desk",
      "Master 120-crop catalogue with seasonal pricing guidelines",
      "Real-time order escrow status & platform commission metrics",
      "One-click Sandbox Reset for testing and investor demos"
    ],
    screenshot: "/screenshots/18_desktop_admin_dashboard.png",
    mobileScreenshotAlt: "Auxin Super Admin PC Dashboard",
    linkText: "Access Admin Portal →",
    targetRoute: `${ADMIN_URL}/dashboard`
  }
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const currentPortal = PORTAL_TABS[activeTab];

  return (
    <div className="min-h-screen bg-[#FDFBF6] text-[#0F172A] selection:bg-[#22C55E] selection:text-white">
      {/* ───────────────────────────────────────────────────────────────────────
          1. FLOATING GLASS NAVIGATION BAR
          ─────────────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3 rounded-2xl glass-panel shadow-sm">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-[#E8E5DF] group-hover:scale-105 transition-transform">
              <Image
                src="/logo-cropped.png"
                alt="Auxin Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-[#052E16]">
                  AUXIN
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/30 hidden sm:inline-block">
                  v3.0 Live
                </span>
              </div>
              <p className="text-[10px] text-[#64748B] font-medium hidden sm:block">
                Direct-From-Farm Marketplace
              </p>
            </div>
          </Link>

          {/* Quick Anchor Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-7 text-xs font-semibold text-[#475569]">
            <a href="#problem" className="hover:text-[#22C55E] transition-colors">
              The Middleman Crisis
            </a>
            <a href="#portals" className="hover:text-[#22C55E] transition-colors">
              3 Role Portals
            </a>
            <a href="#mobile-showcase" className="hover:text-[#22C55E] transition-colors">
              Mobile App Showcase
            </a>
            <a href="#technology" className="hover:text-[#22C55E] transition-colors">
              Core Tech
            </a>
            <a href="#milo-ai" className="hover:text-[#22C55E] transition-colors">
              Milo AI
            </a>
            <a href="#faq" className="hover:text-[#22C55E] transition-colors">
              FAQ
            </a>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#475569] hover:text-[#0F172A] bg-[#FAF8F3] border border-[#E8E5DF] hover:border-[#CBD5E1] transition-all"
            >
              <GithubIcon className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </a>

            {/* HIGH IMPACT PRIMARY 'GO THERE' REDIRECT CTA */}
            <a
              href={`${APP_URL}/customer/home`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-md shadow-[#22C55E]/25 hover:shadow-lg hover:shadow-[#22C55E]/35 active:scale-95 transition-all"
            >
              <span>Launch App (Go There)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      {/* ───────────────────────────────────────────────────────────────────────
          2. CINEMATIC HERO SECTION
          ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-8 hero-mesh grid-pattern overflow-hidden">
        {/* Glow ambient backdrops */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10 space-y-7">
          {/* Top verified banner tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-[#22C55E]/30 shadow-xs backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
            <span className="text-xs font-bold text-[#15803D] tracking-wide uppercase">
              100% Farm Direct &bull; 25 KM Hyper-Local &bull; Zero Middlemen
            </span>
          </div>

          {/* Main Giant Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#052E16] tracking-tight leading-[1.08] max-w-5xl mx-auto">
            Pure Farm-to-Doorstep Freshness. <br className="hidden sm:inline" />
            <span className="text-gradient">Zero Brokers. 100% Direct.</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-xl text-[#475569] max-w-3xl mx-auto leading-relaxed font-normal">
            Auxin eliminates the 75% margin lost to agricultural middlemen by connecting
            regional cultivators directly with urban consumers within a strict <strong>25 km radius</strong>.
            Harvested at dawn, delivered within 2 hours, and verified with cryptographic doorstep OTP.
          </p>

          {/* Dual Main High-Conversion CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <a
              href={`${APP_URL}/customer/home`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-[#22C55E] hover:bg-[#16A34A] shadow-xl shadow-[#22C55E]/30 hover:shadow-2xl hover:shadow-[#22C55E]/40 hover:-translate-y-0.5 active:translate-y-0 transition-all group"
            >
              <span>Explore Marketplace (Go There)</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>

            <a
              href="#mobile-showcase"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-base font-bold text-[#052E16] bg-white hover:bg-[#FAF8F3] border-2 border-[#E8E5DF] hover:border-[#22C55E] shadow-sm transition-all"
            >
              <span>See Live Mobile App</span>
              <ChevronDown className="w-4 h-4 text-[#22C55E]" />
            </a>
          </div>

          {/* Real-time platform KPI metrics bar */}
          <div className="pt-12 sm:pt-16 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#E8E5DF] shadow-xs backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-[#22C55E] tabular-nums">
                &lt; 2 Hrs
              </p>
              <p className="text-xs font-semibold text-[#64748B] mt-1">
                Harvest to Doorstep
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#E8E5DF] shadow-xs backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-[#052E16] tabular-nums">
                25 KM
              </p>
              <p className="text-xs font-semibold text-[#64748B] mt-1">
                Strict Haversine Radius
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#E8E5DF] shadow-xs backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-[#D4AF37] tabular-nums">
                100%
              </p>
              <p className="text-xs font-semibold text-[#64748B] mt-1">
                Margin to Cultivators
              </p>
            </div>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/80 border border-[#E8E5DF] shadow-xs backdrop-blur-sm">
              <p className="text-3xl sm:text-4xl font-black text-[#15803D] tabular-nums">
                Zero
              </p>
              <p className="text-xs font-semibold text-[#64748B] mt-1">
                Middleman Spoilage
              </p>
            </div>
          </div>
        </div>

        {/* ── HERO MOBILE PHONE SHOWCASE PREVIEW ──────────────────────────────── */}
        <div className="max-w-5xl mx-auto mt-16 sm:mt-24 relative">
          <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] rounded-[48px] p-4 bg-[#1E293B] shadow-2xl shadow-[#052E16]/30 border-4 border-[#334155]">
            {/* Phone Speaker & Dynamic Island */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 rounded-full bg-black z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#1E293B] ml-14" />
            </div>

            {/* Screen Viewport with live screenshot */}
            <div className="relative rounded-[36px] overflow-hidden aspect-[9/19] bg-[#FDFBF6] shadow-inner">
              <Image
                src="/screenshots/03_mobile_customer_home.png"
                alt="Auxin Live Mobile Experience"
                fill
                className="object-cover object-top"
                priority
              />
            </div>

            {/* Floating Live Badge 1: Courier Mission */}
            <div className="absolute -left-12 sm:-left-24 top-28 p-3.5 rounded-2xl glass-panel shadow-xl border border-[#22C55E]/30 max-w-[210px] hidden md:block animate-float">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#22C55E]/15 flex items-center justify-center text-[#15803D]">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#0F172A]">
                    Courier En Route
                  </p>
                  <p className="text-[9px] text-[#22C55E] font-semibold">
                    12 mins away (Live GPS)
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Live Badge 2: Tree-Ripened Freshness */}
            <div className="absolute -right-12 sm:-right-24 bottom-36 p-3.5 rounded-2xl glass-panel shadow-xl border border-[#D4AF37]/30 max-w-[220px] hidden md:block animate-float-reverse">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 flex items-center justify-center text-[#B45309]">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#0F172A]">
                    Tree-Ripened Organic
                  </p>
                  <p className="text-[9px] text-[#B45309] font-semibold">
                    Harvested 06:30 AM Today
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Live Badge 3: Escrow Shield */}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 px-4 py-2 rounded-full glass-panel-dark text-white shadow-xl flex items-center gap-2 text-xs font-bold whitespace-nowrap">
              <Lock className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Razorpay 2-Phase Escrow Locked</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          3. THE PROBLEM & THE PARADIGM SHIFT
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="problem" className="py-24 px-4 sm:px-8 bg-white border-y border-[#E8E5DF]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
              The Agricultural Dilemma
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#052E16]">
              Why Indian Mandis Are Failing Both Sides
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Traditional wholesale mandis force produce through four tiers of commission agents.
              Produce rots in warehouses while farmers take loans to survive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* The Old Broken Way */}
            <div className="p-8 rounded-3xl bg-[#FEF2F2] border border-[#FECACA] space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EF4444]/15 text-[#DC2626]">
                  Broken Legacy System
                </span>
                <span className="text-xs text-[#991B1B] font-semibold">75% Margin Loss</span>
              </div>
              <h3 className="text-xl font-bold text-[#991B1B]">
                Mandi Brokers & Wholesale Chains
              </h3>
              <ul className="space-y-3 text-sm text-[#7F1D1D]">
                <li className="flex items-start gap-2.5">
                  <span className="text-[#DC2626] font-bold">✕</span>
                  <span><strong>48 to 72 Hour Delays</strong>: Harvest sits in mandis losing freshness, nutrition, and natural cellular firmness.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#DC2626] font-bold">✕</span>
                  <span><strong>Artificial Chemical Ripening</strong>: Ethylene gas chambers and calcium carbide replace natural sunlight ripening.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-[#DC2626] font-bold">✕</span>
                  <span><strong>Farmer Exploitation</strong>: Cultivators receive only ₹15/kg while city consumers pay ₹60/kg for substandard crops.</span>
                </li>
              </ul>
            </div>

            {/* The Auxin Paradigm */}
            <div className="p-8 rounded-3xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#15803D]">
                  The Auxin Protocol
                </span>
                <span className="text-xs text-[#15803D] font-bold">100% Margin Flow</span>
              </div>
              <h3 className="text-xl font-bold text-[#052E16]">
                Hyper-Local 25 KM Direct Marketplace
              </h3>
              <ul className="space-y-3 text-sm text-[#14532D]">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                  <span><strong>Delivered in &lt; 2 Hours</strong>: Picked in regional fields at 6 AM and delivered to customer kitchens by 8 AM.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                  <span><strong>Tree-Ripened & Chemical Free</strong>: 100% organic, sunlight-ripened produce preserving maximum phytonutrients.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#22C55E] flex-shrink-0 mt-0.5" />
                  <span><strong>Fair Escrow Commerce</strong>: Cultivator gets ₹45/kg, customer pays ₹50/kg, and courier gets ₹40/drop.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          4. INTERACTIVE 3 ROLE-ADAPTIVE PORTALS SHOWCASE
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="portals" className="py-24 px-4 sm:px-8 bg-[#FAF8F3]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#15803D] uppercase tracking-widest">
              One Unified Ecosystem
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#052E16]">
              Three Purpose-Built Role Experiences
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Auxin is not a generic clone. The interface intelligently adapts to the user&apos;s role:
              discovery for consumers, operational control for farmers, and rapid mission HUD for couriers.
            </p>
          </div>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 p-1.5 rounded-2xl bg-white border border-[#E8E5DF] max-w-3xl mx-auto shadow-xs">
            {PORTAL_TABS.map((tab, idx) => {
              const Icon = tab.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#22C55E] text-white shadow-md shadow-[#22C55E]/30"
                      : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#FAF8F3]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.title}</span>
                </button>
              );
            })}
          </div>

          {/* Active Tab Content Card */}
          <div className="p-6 sm:p-10 rounded-3xl bg-white border border-[#E8E5DF] shadow-md grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left info column */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#22C55E]/15 text-[#15803D] border border-[#22C55E]/20">
                {currentPortal.badge}
              </span>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#052E16] leading-snug">
                {currentPortal.headline}
              </h3>

              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                {currentPortal.description}
              </p>

              {/* Feature bullet list */}
              <div className="space-y-3 pt-2">
                {currentPortal.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs sm:text-sm text-[#1E293B]">
                    <div className="w-5 h-5 rounded-full bg-[#22C55E]/20 flex items-center justify-center text-[#15803D] flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* Action redirect button */}
              <div className="pt-4">
                <a
                  href={currentPortal.targetRoute}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-bold text-white bg-[#052E16] hover:bg-[#14532D] shadow-sm hover:shadow-md transition-all group"
                >
                  <span>{currentPortal.linkText}</span>
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* Right preview column */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] rounded-[36px] p-3 bg-[#0F172A] shadow-2xl border-4 border-[#334155]">
                <div className="relative rounded-[28px] overflow-hidden aspect-[9/18] bg-[#FDFBF6]">
                  <Image
                    src={currentPortal.screenshot}
                    alt={currentPortal.mobileScreenshotAlt}
                    fill
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          5. FULL MOBILE APP SCREENSHOTS GALLERY
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="mobile-showcase" className="py-24 px-4 sm:px-8 bg-white border-t border-[#E8E5DF]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
              Real-Time UI Showcase
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#052E16]">
              Every Mobile Screen. Hand-Crafted & Tested.
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Inspected on actual mobile viewports. Designed with disciplined spacing,
              zero layout thrashing, and high tactile feedback.
            </p>
          </div>

          {/* 4-Card Phone Carousel/Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Screen 1: Customer Discovery */}
            <div className="p-4 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-4 hover:shadow-lg transition-all text-center">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/18] bg-black/5 shadow-inner">
                <Image
                  src="/screenshots/03_mobile_customer_home.png"
                  alt="Customer Discovery Screen"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Customer Discovery</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Category rails & 4:5 crop grid</p>
              </div>
            </div>

            {/* Screen 2: Harvest Supplier Selection */}
            <div className="p-4 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-4 hover:shadow-lg transition-all text-center">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/18] bg-black/5 shadow-inner">
                <Image
                  src="/screenshots/04_mobile_customer_product_detail.png"
                  alt="Harvest Product Details"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Farmer Supplier Select</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Harvest timestamp & live stock</p>
              </div>
            </div>

            {/* Screen 3: Order Milestones & OTP */}
            <div className="p-4 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-4 hover:shadow-lg transition-all text-center">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/18] bg-black/5 shadow-inner">
                <Image
                  src="/screenshots/06_mobile_customer_order_tracking.png"
                  alt="Live Order Tracking & OTP"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Live Milestone Tracking</h4>
                <p className="text-xs text-[#64748B] mt-0.5">ETA & 6-digit doorstep OTP</p>
              </div>
            </div>

            {/* Screen 4: Delivery Mission HUD */}
            <div className="p-4 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-4 hover:shadow-lg transition-all text-center">
              <div className="relative rounded-2xl overflow-hidden aspect-[9/18] bg-black/5 shadow-inner">
                <Image
                  src="/screenshots/12_mobile_delivery_mission_hud.png"
                  alt="Delivery Mission HUD"
                  fill
                  className="object-cover object-top"
                />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Courier Mission HUD</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Leaflet GPS map & turn steps</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          6. MILO AI: AUTONOMOUS AGRITECH COPILOT
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="milo-ai" className="py-24 px-4 sm:px-8 bg-[#052E16] text-white relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#22C55E]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold border border-[#22C55E]/30">
              <Bot className="w-3.5 h-3.5" />
              <span>Domain Agricultural Intelligence</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight">
              Meet Milo: Your Autonomous Agritech Copilot
            </h2>

            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              Milo is not a generic wrapper. Powered by a specialized 7-stage agricultural
              RAG engine with Gemini 2.5 Flash, Milo answers regional crop shelf life queries,
              calculates storage humidity, and provides live parcel telemetry.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xl font-bold text-[#22C55E]">120+ Chunks</p>
                <p className="text-xs text-white/70 mt-1">Verified Agro-Science Vectors</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xl font-bold text-[#D4AF37]">Zero Hallucination</p>
                <p className="text-xs text-white/70 mt-1">Strict Grounding Shield</p>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`${APP_URL}/customer/home`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#052E16] bg-[#22C55E] hover:bg-[#16A34A] transition-all"
              >
                <span>Ask Milo Live in App</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Column: Chat Mockup */}
          <div className="lg:col-span-6">
            <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-xl shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#22C55E] text-[#052E16] flex items-center justify-center font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Milo Assistant</p>
                    <p className="text-[10px] text-[#22C55E]">Active & Grounded</p>
                  </div>
                </div>
                <span className="text-[10px] text-white/50 font-mono">Gemini 2.5 RAG</span>
              </div>

              {/* Message Dialogue */}
              <div className="space-y-3 text-xs leading-relaxed">
                <div className="p-3 rounded-2xl bg-white/10 max-w-[85%] text-white/90">
                  How should I store Ratnagiri Alphonso mangoes to keep them fresh for a week?
                </div>

                <div className="p-3.5 rounded-2xl bg-[#22C55E]/20 border border-[#22C55E]/30 text-white max-w-[90%] ml-auto space-y-1.5">
                  <p className="font-semibold text-[#22C55E]">Milo Agritech Copilot:</p>
                  <p>
                    Alphonso mangoes from our Ratnagiri farmers are tree-ripened without calcium carbide!
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-white/80">
                    <li>Keep at room temperature (22–25°C) until fragrant.</li>
                    <li>Never refrigerate before full ripeness to prevent chilling injury.</li>
                    <li>Once ripe, store at 10–12°C for 5–7 days peak sweetness. 🥭</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          7. CORE TECHNOLOGY & ENGINEERING MATRIX
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="technology" className="py-24 px-4 sm:px-8 bg-white border-t border-[#E8E5DF]">
        <div className="max-w-6xl mx-auto space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold text-[#15803D] uppercase tracking-widest">
              Engineering Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#052E16]">
              Built for Scale, Trust, and Precision
            </h2>
            <p className="text-sm sm:text-base text-[#475569]">
              Auxin pairs Python async performance with modern Next.js 16 micro-frontends
              and mathematical geospatial boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-7 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 text-[#15803D] flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">25 KM Haversine Geofence</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Calculates spherical great-circle coordinates directly in SQL:
                <code className="block my-2 p-2 rounded-xl bg-white border border-[#E8E5DF] font-mono text-[11px] text-[#0F172A] overflow-x-auto">
                  d = 2R · arcsin(√(sin²(Δφ/2) + cos φ₁ · cos φ₂ · sin²(Δλ/2)))
                </code>
                Guarantees hyper-local dispatch within 25 km.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 text-[#B45309] flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">Two-Phase Atomic Escrow</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Customer funds are held in reserve during transit. Courier and farmer are credited
                simultaneously only when the customer provides their private 6-digit OTP code.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F3] border border-[#E8E5DF] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#052E16]/10 text-[#052E16] flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F172A]">73 Automated Regressions</h3>
              <p className="text-xs text-[#64748B] leading-relaxed">
                100% verified test suite covering RBAC authorization, commerce state transitions,
                spatial boundaries, and Super Admin privilege immutability.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          8. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)
          ─────────────────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-24 px-4 sm:px-8 bg-[#FAF8F3] border-t border-[#E8E5DF]">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">
              Answers & Clarifications
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#052E16]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3.5">
            {[
              {
                q: "How does Auxin guarantee 100% farmer margins?",
                a: "Unlike traditional APMC mandis where commission agents deduct up to 75% of sales, Auxin allows registered farmers to set their own live prices per harvest. 100% of customer produce payments flow directly to the cultivator's verified bank account."
              },
              {
                q: "What is the 25 KM geofenced delivery model?",
                a: "To prevent food spoilage and eliminate cold-storage chemicals, Auxin algorithmically bounds customers, farmers, and couriers within a 25 km spherical radius calculated using the Haversine formula. Orders are picked and delivered in under 2 hours."
              },
              {
                q: "How does the doorstep OTP escrow release work?",
                a: "When a customer places an order, funds are held securely in the Auxin Escrow Reserve. When the courier arrives, the customer inspects the produce. Only when satisfied, the customer shares a unique 6-digit OTP which triggers atomic payment release."
              },
              {
                q: "Can I run Auxin locally or deploy to Vercel?",
                a: "Yes! Auxin is fully modular. The consumer frontend (auxin-frontend) and marketing landing page (auxin-landing) deploy seamlessly to Vercel with zero config, while the FastAPI core runs on any container host or VPS."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E8E5DF] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-[#0F172A] cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#64748B] transition-transform ${
                      openFaq === idx ? "rotate-180 text-[#22C55E]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          9. MASSIVE BOTTOM CALL TO ACTION
          ─────────────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-8 bg-gradient-to-br from-[#052E16] via-[#14532D] to-[#052E16] text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="w-16 h-16 rounded-3xl bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center mx-auto border border-[#22C55E]/40">
            <Sparkles className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            Ready to Experience Real Farm Freshness?
          </h2>

          <p className="text-base sm:text-xl text-white/80 max-w-2xl mx-auto">
            Join thousands of families supporting regional farmers and eating crops harvested at dawn.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            {/* PRIMARY GO THERE REDIRECT BUTTON */}
            <a
              href={`${APP_URL}/customer/home`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl text-base font-extrabold text-[#052E16] bg-[#22C55E] hover:bg-[#4ADE80] shadow-2xl shadow-[#22C55E]/50 hover:scale-105 active:scale-100 transition-all cursor-pointer"
            >
              <span>Launch Marketplace (Go There)</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-5 rounded-2xl text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
            >
              <GithubIcon className="w-5 h-5" />
              <span>Inspect Code on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────────────
          10. FOOTER WITH AUTHOR ATTRIBUTION
          ─────────────────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-8 bg-[#021A0C] text-white/60 border-t border-white/10 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden relative border border-white/20">
              <Image src="/logo-cropped.png" alt="Auxin Logo" fill className="object-cover" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">AUXIN</p>
              <p className="text-[10px] text-white/40">Direct-From-Farm Marketplace Ecosystem</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-white/70">
            <a href="#portals" className="hover:text-white transition-colors">Portals</a>
            <a href="#mobile-showcase" className="hover:text-white transition-colors">Mobile App</a>
            <a href="#technology" className="hover:text-white transition-colors">Engineering</a>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-white/80 font-medium">
              Architected & Engineered by{" "}
              <a
                href="https://github.com/SumanthMamidi-MNS"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#22C55E] font-bold hover:underline"
              >
                Sumanth Mamidi
              </a>
            </p>
            <p className="text-[11px] text-white/40 mt-0.5">
              &copy; {new Date().getFullYear()} Auxin. Distributed under the MIT License.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
