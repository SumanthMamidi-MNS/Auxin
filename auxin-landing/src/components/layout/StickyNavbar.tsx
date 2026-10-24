'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ShieldCheck, Menu, X, Sparkles, Radio } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function StickyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Economics', href: '#economics' },
    { label: 'Innovations', href: '#innovations' },
    { label: 'Role Portals', href: '#roles' },
    { label: 'Milo AI', href: '#milo' },
    { label: 'Architecture', href: '#architecture' },
    { label: 'Dossier', href: '#recruiter' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#030705]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-3'
          : 'bg-transparent py-5 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Left */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden p-[1px] bg-gradient-to-tr from-emerald-500/40 via-emerald-400 to-amber-400/40 transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <div className="w-full h-full bg-[#030705] rounded-[11px] flex items-center justify-center overflow-hidden">
                <Image
                  src="/logo-cropped.png"
                  alt="Auxin Logo"
                  width={28}
                  height={28}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  AUXIN
                </span>
                <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v3.0 GOAT
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                Hyper-Local Agritech Protocol
              </span>
            </div>
          </Link>

          {/* Live Status Radar Pill (Center Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-300 tracking-wide">
              Platform Operational
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-mono text-slate-400">
              25 km Radar Online
            </span>
          </div>

          {/* Nav Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs (Right) */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href={`${APP_URL}/auth`}
              className="text-xs font-semibold px-4 py-2 rounded-lg text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all duration-200"
            >
              Sign In
            </a>
            <a
              href={`${APP_URL}/customer/home`}
              className="group relative inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              <span>Launch App (Go There)</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={`${APP_URL}/customer/home`}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 flex items-center gap-1"
            >
              <span>Launch</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 px-4 pt-4 pb-6 bg-[#030705]/95 backdrop-blur-2xl border-b border-white/10 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <Radio className="w-4 h-4 animate-pulse text-emerald-400" />
            <span>Operational • 25 km Radar Online</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <a
              href={`${APP_URL}/auth`}
              className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-white/[0.05] border border-white/10 text-white"
            >
              Sign In to Auxin
            </a>
            <a
              href={`${APP_URL}/customer/home`}
              className="w-full text-center py-2.5 rounded-lg text-sm font-bold bg-emerald-500 text-slate-950 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              <span>Launch Live Marketplace</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
