'use client';
/**
 * components/layout/DesktopTopNav.tsx — Auxin v3.0
 * Desktop top navigation bar with page title, notification center, and user avatar.
 */

import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { NotificationCenter } from '@/components/features/NotificationCenter';

interface DesktopTopNavProps {
  title?: string;
  action?: React.ReactNode;
}

export function DesktopTopNav({ title, action }: DesktopTopNavProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'Partner';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="hidden lg:flex items-center justify-between sticky top-0 z-30 w-full h-14 px-8 bg-[var(--surface-overlay)] backdrop-blur-xl border-b border-[var(--border)]">
      <div className="flex items-center min-w-0">
        {title && (
          <h1 
            className="text-lg font-bold truncate text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-4">
        {action}
        
        {/* Notification Bell Dropdown */}
        <NotificationCenter />

        {/* User Identity & Avatar */}
        <div className="flex items-center gap-3 pl-2 border-l border-[var(--divider)]">
          <span className="text-xs font-semibold text-[var(--text-secondary)]">
            Namaste, {firstName}! 🙏
          </span>
          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {initial}
          </div>
        </div>
      </div>
    </header>
  );
}

export default DesktopTopNav;
