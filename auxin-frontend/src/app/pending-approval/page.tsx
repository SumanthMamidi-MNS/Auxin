"use client";

/**
 * auxin-frontend/src/app/pending-approval/page.tsx — Auxin v3.0
 * Shown to farmers and delivery partners whose accounts are pending
 * admin review or have been rejected.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clock, LogOut, Leaf, AlertTriangle, Edit2, CheckCircle2, RotateCw } from "lucide-react";
import toast from "react-hot-toast";
import { signOut } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { profileApi } from "@/lib/profile";
import { Button } from "@/components/ui/Button";

export default function PendingApprovalPage() {
  const { user, isAuthenticated, clearAuth, setAuth } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Sync / poll latest status on mount and state changes
  const checkLatestStatus = async (silent = false) => {
    if (!isAuthenticated) return;
    if (!silent) setChecking(true);
    try {
      const res = await profileApi.getProfile();
      const latestUser = res.data;
      setAuth(latestUser);

      if (latestUser.status === "approved") {
        toast.success("Your application has been approved! Welcome to Auxin 🎉");
        if (latestUser.role === "farmer") router.replace("/farmer/dashboard");
        if (latestUser.role === "delivery") router.replace("/delivery/dashboard");
      }
    } catch (err) {
      console.error("Failed to check status:", err);
    } finally {
      if (!silent) setChecking(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/auth");
      return;
    }

    if (user?.status === "approved") {
      if (user.role === "farmer") router.replace("/farmer/dashboard");
      if (user.role === "delivery") router.replace("/delivery/dashboard");
    }

    checkLatestStatus(true);
    const interval = setInterval(() => {
      checkLatestStatus(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.status, router]);

  async function handleSignOut() {
    await signOut();
    clearAuth();
    toast.success("Signed out.");
    router.replace("/auth");
  }

  async function handleResubmit() {
    setLoading(true);
    try {
      const res = await profileApi.resubmitProfile();
      setAuth(res.data);
      toast.success("Application resubmitted successfully!");
    } catch (err: any) {
      const detail = err.response?.data?.detail ?? "Failed to resubmit application.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  const roleName =
    user?.role === "farmer" ? "Farmer Producer" :
    user?.role === "delivery" ? "Delivery Partner" :
    "Marketplace Member";

  const isRejected = user?.status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="relative w-full max-w-md text-center space-y-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center space-y-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center relative shadow-xs border-2 border-[var(--gold)]"
          >
            <Image
              src="/logo-cropped.png"
              alt="Auxin Logo"
              fill
              className="object-cover scale-110"
              priority
            />
          </div>
          <span className="text-xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
            Auxin
          </span>
        </div>

        {/* Status Card */}
        <div className="p-7 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm space-y-6">
          {isRejected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--danger-bg)] border border-[var(--danger-border)] mx-auto">
                <AlertTriangle size={28} className="text-[var(--danger)] animate-pulse" />
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Verification Update Required
              </h2>
              <div className="p-4 bg-[var(--surface-2)] border border-[var(--divider)] rounded-2xl text-left">
                <p className="text-[10px] text-[var(--danger)] font-bold uppercase tracking-wider mb-1">
                  Admin Feedback:
                </p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  {user?.rejection_reason || "Information provided did not meet our regional verification standards."}
                </p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Please edit your credentials and resubmit for approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-glow)] mx-auto">
                <Clock size={28} className="text-[var(--primary)]" />
              </div>
              <h2 className="text-xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Application Under Review
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Your <span className="text-[var(--primary-deep)] font-bold">{roleName}</span> application
                {user?.name ? ` for ${user.name}` : ""} is currently in verification.
              </p>
              <div className="p-3 bg-[var(--surface-2)] rounded-2xl border border-[var(--divider)] text-xs text-[var(--text-secondary)]">
                ⏱️ Review turnaround: usually within a few hours. An Auxin admin verifies farm documents directly.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {isRejected ? (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => router.push("/profile/create")}
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit Details
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={loading}
                  loading={loading}
                  onClick={handleResubmit}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Resubmit
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="md"
                fullWidth
                disabled={checking}
                onClick={() => checkLatestStatus(false)}
                icon={<RotateCw className={checking ? "w-3.5 h-3.5 animate-spin" : "w-3.5 h-3.5"} />}
              >
                {checking ? "Checking..." : "Refresh Approval Status"}
              </Button>
            )}

            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl text-xs font-bold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--text-tertiary)] font-medium">
          © {new Date().getFullYear()} Auxin · Direct Farm Marketplace
        </p>
      </div>
    </div>
  );
}
