'use client';

/**
 * auxin-landing/src/components/layout/StickyNavbar.tsx
 * ============================================================================
 * AUXIN V3.5 — FLOATING LUXURY ISLAND NAVIGATION (ORGANIC CREAM EDITION)
 * 
 * Master Polish:
 * - Floating centered pill navbar with generous breathing room
 * - Specular porcelain backdrop-blur with warm gold highlights
 * - Animated botanical logo mark with organic pulse
 * - Discreet live network status (no bulky green bubbles)
 * - Tactile spring-pressed "Launch App" CTA button
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Menu, X, Radio, Sparkles } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function StickyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Economics', href: '#economics' },
    { label: 'Screens', href: '#screens' },
    { label: 'Innovations', href: '#innovations' },
    { label: 'Portals', href: '#roles' },
    { label: 'Milo AI', href: '#milo' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Dossier', href: '#recruiter' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-all duration-300">
      <div
        className={`max-w-6xl mx-auto transition-all duration-300 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between ${
          scrolled
            ? 'bg-white/92 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_40px_rgba(60,45,20,0.08)]'
            : 'bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_30px_rgba(60,45,20,0.04)]'
        }`}
      >
        {/* Brand Left */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden p-[1.5px] bg-gradient-to-tr from-[#1B4332] via-[#2D6A4F] to-[#D4AF37] transition-transform duration-300 group-hover:scale-105 shadow-sm">
            <div className="w-full h-full bg-[#FAF7F2] rounded-full flex items-center justify-center overflow-hidden">
              <Image
                src="/logo-cropped.png"
                alt="Auxin Logo"
                width={26}
                height={26}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#0F172A] group-hover:text-[#1B4332] transition-colors font-['Poppins']">
                AUXIN
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-600/20">
                v4.0
              </span>
            </div>
            <span className="text-[11px] text-[#64748B] hidden md:inline-block leading-tight font-medium">
              Direct-From-Farm Protocol
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-1.5 rounded-full hover:bg-black/[0.04] transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Discreet Live Network Radar */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50/80 border border-emerald-600/15">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
          </span>
          <span className="text-[11px] font-medium text-emerald-900">
            25 km Radar Online
          </span>
        </div>

        {/* Right Action CTAs */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`${APP_URL}/auth`}
            className="hidden sm:inline-flex text-xs font-semibold text-[#475569] hover:text-[#0F172A] px-3 py-2 rounded-full hover:bg-black/[0.04] transition-all"
          >
            Sign In
          </Link>

          <Link
            href={`${APP_URL}/customer/home`}
            className="btn-press inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#143326] hover:to-[#245741] px-4 py-2 rounded-full shadow-[0_4px_14px_rgba(27,67,50,0.25)] transition-all"
          >
            <span>Launch App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="btn-press p-2 rounded-full text-[#0F172A] hover:bg-black/[0.05] lg:hidden transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-6xl mx-auto rounded-3xl bg-white/95 backdrop-blur-2xl border border-black/[0.08] p-5 shadow-[0_20px_50px_rgba(60,45,20,0.12)] animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-black/[0.03] px-4 py-2.5 rounded-xl transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-black/[0.06] flex flex-col gap-2">
              <Link
                href={`${APP_URL}/auth`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-center text-xs font-semibold text-[#475569] py-2 rounded-xl hover:bg-black/[0.03]"
              >
                Sign In to Account
              </Link>
              <Link
                href={`${APP_URL}/customer/home`}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-press text-center text-xs font-bold text-white bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] py-2.5 rounded-xl shadow-sm"
              >
                Launch Live Marketplace ↗
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
