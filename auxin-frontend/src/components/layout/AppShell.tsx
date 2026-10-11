'use client';

import React from 'react';
import { clsx } from 'clsx';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopTopNav } from './DesktopTopNav';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  action?: React.ReactNode;
  topBarClassName?: string;
  noPadding?: boolean;
  noTopBar?: boolean;
  fullWidth?: boolean;
}

export function AppShell({ 
  children, 
  title = '', 
  showBack, 
  action, 
  topBarClassName, 
  noPadding, 
  noTopBar,
  fullWidth = false
}: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Desktop fixed sidebar */}
      <DesktopSidebar />

      {/* Main content wrapper with desktop sidebar offset */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-[240px]">
        {/* Mobile TopBar - hidden on desktop */}
        {!noTopBar && (
          <div className="lg:hidden">
            <TopBar title={title} showBack={showBack} action={action} className={topBarClassName} />
          </div>
        )}

        {/* Desktop TopNav - hidden on mobile */}
        <div className="hidden lg:block">
          <DesktopTopNav title={title} action={action} />
        </div>

        {/* Page Content */}
        <main className={clsx(
          'flex-1 w-full mx-auto animate-fade-in',
          noPadding ? '' : 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6',
          fullWidth ? 'max-w-full' : 'max-w-full md:max-w-4xl lg:max-w-6xl',
          'pb-24 lg:pb-12'
        )}>
          {children}
        </main>
      </div>

      {/* Mobile / Tablet Bottom Navigation */}
      <BottomNav />
    </div>
  );
}

export default AppShell;

