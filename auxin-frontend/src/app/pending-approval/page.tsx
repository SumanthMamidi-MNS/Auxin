"use client";

/**
 * auxin-frontend/src/app/pending-approval/page.tsx
 * ---------------------------------------------------
 * Shown to farmers and delivery partners whose accounts are pending
 * admin review. No business functionality — informational only.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, LogOut, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }
    // If the user is now approved, redirect them to their dashboard
    if (user?.status === "approved") {
      if (user.role === "farmer")   router.replace("/farmer/dashboard");
      if (user.role === "delivery") router.replace("/delivery/dashboard");
    }
  }, [isAuthenticated, user, router]);

  async function handleSignOut() {
    await signOut();
    clearAuth();
    toast.success("Signed out.");
    router.replace("/auth");
  }

  const roleName =
    user?.role === "farmer" ? "Farmer" :
    user?.role === "delivery" ? "Delivery Partner" :
    "User";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 p-4">
      <div className="relative w-full max-w-md text-center">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm mb-6">
          <Leaf size={32} className="text-emerald-400" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-400/30 mx-auto mb-5">
            <Clock size={28} className="text-amber-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Pending Approval
          </h2>

          <p className="text-white/60 text-sm leading-relaxed mb-2">
            Your <span className="text-emerald-300 font-medium">{roleName}</span> account
            {user?.name ? ` for ${user.name}` : ""} is under review.
          </p>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            An Auxin admin will verify your application shortly.
            You will gain full access once approved.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
            <p className="text-xs text-white/60 font-medium uppercase tracking-wider mb-2">
              What happens next?
            </p>
            <div className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-emerald-400 mt-0.5">1.</span>
              <span>Admin reviews your registration details</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-emerald-400 mt-0.5">2.</span>
              <span>You receive approval (typically within 24 hours)</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-white/70">
              <span className="text-emerald-400 mt-0.5">3.</span>
              <span>Sign in again to access your dashboard</span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-sm font-medium transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>

        <p className="text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Auxin · Farm-fresh marketplace
        </p>
      </div>
    </div>
  );
}
