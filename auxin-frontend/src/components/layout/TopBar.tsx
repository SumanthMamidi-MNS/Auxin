"use client";
/**
 * components/layout/TopBar.tsx — Auxin v2.0
 * Dark theme app header: sticky, frosted glass, neon active state.
 */

import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut, Leaf, UserCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { clsx } from "clsx";
import { signOut } from "@/lib/auth";
import toast from "react-hot-toast";
import Link from "next/link";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  action?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}

export function TopBar({
  title,
  showBack = false,
  action,
  className,
  transparent = false,
}: TopBarProps) {
  const router = useRouter();
  const { clearAuth } = useAuthStore();

  const handleLogout = async () => {
    await signOut();
    clearAuth();
    toast.success("Signed out.");
    router.push("/auth");
  };

  return (
    <header
      className={clsx(
        "sticky top-0 z-40",
        transparent
          ? "bg-transparent"
          : "bg-[#0A0A0B]/90 backdrop-blur-lg border-b border-[#1A1A1D]",
        className
      )}
    >
      <div className="max-w-lg mx-auto flex items-center h-14 px-4 gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 -ml-1 rounded-xl flex items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-white/5 transition-all duration-150"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        <h1 className="flex-1 text-base font-bold text-[#FAFAFA] truncate">
          {title}
        </h1>

        {action}

        {!action && (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52525B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}

/** Brand header for home page */
export function BrandHeader() {
  return (
    <div className="flex items-center justify-between h-14 px-4 sticky top-0 z-40 bg-[#0A0A0B]/90 backdrop-blur-lg border-b border-[#1A1A1D]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-[#22C55E]" />
        </div>
        <span className="font-black text-[#FAFAFA] tracking-tight text-lg">Auxin</span>
      </div>
      <Link
        href="/profile"
        title="My Profile"
        className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52525B] hover:text-[#22C55E] hover:bg-[#22C55E]/10 transition-all duration-150"
      >
        <UserCircle className="w-5 h-5 text-[#A1A1AA]" />
      </Link>
    </div>
  );
}
