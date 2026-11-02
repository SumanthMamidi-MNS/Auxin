'use client';

/**
 * auxin-landing/src/components/layout/StickyNavbar.tsx
 * ============================================================================
 * AUXIN V4.0 — FLOATING LUXURY ISLAND NAVIGATION (CLEAN EMBLEM EDITION)
 * 
 * Master Polish:
 * - Direct golden logo mark without circular border ring, enlarged for prominence
 * - Active section scroll spy automatically toggling as user scrolls
 * - Specular porcelain backdrop-blur with warm gold highlights
 * - Tactile spring-pressed "Launch App" CTA button
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Menu, X, Radio, Sparkles } from 'lucide-react';
import { showComingSoonModal } from './ComingSoonModal';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function StickyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  const navLinks = [
    { label: 'Economics', href: '#economics' },
    { label: 'Screens', href: '#screens' },
    { label: 'Innovations', href: '#innovations' },
    { label: 'Portals', href: '#roles' },
    { label: 'Milo AI', href: '#milo' },
    { label: 'Architecture', href: '#architecture' },
  ];

  useEffect(() => {
    const sections = ['economics', 'screens', 'innovations', 'roles', 'milo', 'architecture'];

    const handleScroll = () => {
      setScrolled(window.scrollY > 15);

      const scrollPos = window.scrollY + 140; // navbar offset
      let current = '';

      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = sec;
            break;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8 pt-4 pb-2 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto transition-all duration-300 rounded-full px-4 sm:px-6 py-2.5 flex items-center justify-between ${
          scrolled
            ? 'bg-white/92 backdrop-blur-2xl border border-black/[0.08] shadow-[0_12px_40px_rgba(60,45,20,0.08)]'
            : 'bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_30px_rgba(60,45,20,0.04)]'
        }`}
      >
        {/* Brand Left: Clean Enlarged Logo without Circular Ring */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 flex-shrink-0">
            <Image
              src="/logo-cropped.png"
              alt="Auxin Logo"
              width={40}
              height={40}
              className="object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)]"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-[#0F172A] group-hover:text-[#1B4332] transition-colors font-['Poppins']">
                AUXIN
              </span>
              <span className="text-xs font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-600/20">
                v4.0
              </span>
            </div>
            <span className="text-xs text-[#475569] hidden md:inline-block leading-tight font-medium">
              Direct-From-Farm Protocol
            </span>
          </div>
        </Link>

        {/* Center Desktop Navigation Links (6 Curated Pillars) */}
        <nav className="hidden lg:flex items-center justify-center gap-1.5 xl:gap-2.5 flex-1 px-3">
          {navLinks.map((link) => {
            const sectionId = link.href.replace('#', '');
            const isActive = activeSection === sectionId;
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative text-xs sm:text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-[#0F172A] bg-black/[0.08] shadow-xs font-bold'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-black/[0.04]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-emerald-700 transition-all duration-300" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action & Utility Cluster (Enforced Spacing, Never Touching) */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 ml-2">
          {/* Discreet Live Network Radar */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-600/20 shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-950 whitespace-nowrap">
              25 km Radar Online
            </span>
          </div>

          {/* Primary Launch App CTA */}
          <button
            onClick={() => showComingSoonModal()}
            className="btn-press shimmer-sheen inline-flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-white bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] hover:from-[#143326] hover:to-[#245741] px-4.5 py-2 rounded-full shadow-[0_4px_14px_rgba(27,67,50,0.25)] hover:shadow-[0_6px_20px_rgba(27,67,50,0.35)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Launch App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full hover:bg-black/[0.05] text-[#0F172A] transition-colors"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-3xl bg-white/95 backdrop-blur-2xl border border-black/[0.08] p-5 shadow-2xl animate-fade-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const sectionId = link.href.replace('#', '');
              const isActive = activeSection === sectionId;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm font-semibold px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-600/20'
                      : 'text-[#475569] hover:bg-black/[0.04]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between">
              <span className="text-xs text-[#64748B]">v4.0 Protocol Active</span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  showComingSoonModal();
                }}
                className="text-xs font-bold text-white bg-[#1B4332] px-4 py-2 rounded-full cursor-pointer"
              >
                Launch App →
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
