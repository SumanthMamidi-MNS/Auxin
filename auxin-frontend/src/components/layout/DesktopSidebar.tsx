'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { 
  Home, Grid3X3, Heart, ClipboardList, ShoppingCart, User as UserIcon,
  Package, Wallet, Truck, Bot, LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { isAdminRole } from '@/types';
import { signOut } from '@/lib/auth';
import toast from 'react-hot-toast';

export function DesktopSidebar() {
  const { user, clearAuth } = useAuthStore();
  const itemCount = useCartStore((s) => s.itemCount);
  const pathname = usePathname();
  const router = useRouter();

  if (!user || isAdminRole(user.role)) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // Ignore network failures on sign out
    }
    clearAuth();
    toast.success('Signed out.');
    router.push('/auth');
  };

  const handleOpenMilo = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-milo'));
    }
  };

  const role = user.role;

  const getCustomerNav = () => (
    <>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Shop</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/customer/home" icon={Home} label="Home" active={pathname === '/customer/home'} />
          <NavItem href="/customer/wishlist" icon={Heart} label="Wishlist" active={pathname === '/customer/wishlist'} />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Orders</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/customer/orders" icon={ClipboardList} label="My Orders" active={pathname === '/customer/orders'} />
          <NavItem 
            href="/customer/cart" 
            icon={ShoppingCart} 
            label="Cart" 
            badge={itemCount > 0 ? itemCount : undefined}
            active={pathname === '/customer/cart'} 
          />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Account</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/profile" icon={UserIcon} label="Profile" active={pathname === '/profile'} />
        </nav>
      </div>
    </>
  );

  const getFarmerNav = () => (
    <>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Business</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/farmer/dashboard" icon={Home} label="Dashboard" active={pathname === '/farmer/dashboard'} />
          <NavItem href="/farmer/inventory" icon={Package} label="Inventory" active={pathname === '/farmer/inventory'} />
          <NavItem href="/farmer/orders" icon={ClipboardList} label="Orders" active={pathname === '/farmer/orders'} />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Finance</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/farmer/earnings" icon={Wallet} label="Earnings" active={pathname === '/farmer/earnings'} />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Account</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/farmer/profile" icon={UserIcon} label="Profile" active={pathname === '/farmer/profile'} />
        </nav>
      </div>
    </>
  );

  const getDeliveryNav = () => (
    <>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Operations</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/delivery/dashboard" icon={Truck} label="Active Runs" active={pathname === '/delivery/dashboard'} />
          <NavItem href="/delivery/history" icon={ClipboardList} label="History" active={pathname === '/delivery/history'} />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Finance</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/delivery/earnings" icon={Wallet} label="Earnings" active={pathname === '/delivery/earnings'} />
        </nav>
      </div>
      <div className="mb-6">
        <h3 className="uppercase text-[10px] font-bold text-[var(--text-tertiary)] tracking-wider px-4 mb-2">Account</h3>
        <nav className="flex flex-col gap-1">
          <NavItem href="/delivery/profile" icon={UserIcon} label="Profile" active={pathname === '/delivery/profile'} />
        </nav>
      </div>
    </>
  );

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 w-[240px] h-full bg-[var(--surface)] border-r border-[var(--border)] z-40">
      {/* Top: Brand Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-[var(--border)] mb-4">
        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-[var(--border)]">
          <img src="/logo-cropped.png" alt="Auxin Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-bold text-base leading-none text-[var(--text-primary)]">Auxin</span>
          <span className="text-[11px] text-[var(--text-secondary)] capitalize mt-1 font-medium">{role} Portal</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
        {role === 'customer' && getCustomerNav()}
        {role === 'farmer' && getFarmerNav()}
        {role === 'delivery' && getDeliveryNav()}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-[var(--border)] flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleOpenMilo}
          className="flex items-center gap-3 py-2 px-3 rounded-xl text-[var(--primary)] bg-[var(--primary-subtle)] hover:bg-[var(--primary-glow)] border border-[var(--primary-glow-sm)] transition-colors text-xs font-semibold w-full text-left cursor-pointer"
        >
          <Bot className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
          <span>Ask Milo AI</span>
        </button>
        <button 
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-3 py-2 px-3 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 transition-colors text-xs font-medium w-full text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default DesktopSidebar;

function NavItem({ 
  href, icon: Icon, label, active, disabled, badge 
}: { 
  href: string; icon: any; label: string; active?: boolean; disabled?: boolean; badge?: number;
}) {
  const content = (
    <div className={clsx(
      "flex items-center gap-3 py-2.5 px-4 rounded-r-xl transition-all border-l-[3px]",
      active 
        ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-glow)] font-semibold shadow-xs" 
        : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] font-medium",
      disabled && "opacity-50 cursor-not-allowed"
    )}>
      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 2} />
      <span className="text-xs flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[var(--primary)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
          {badge}
        </span>
      )}
    </div>
  );

  if (disabled) {
    return <div className="cursor-not-allowed">{content}</div>;
  }

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
