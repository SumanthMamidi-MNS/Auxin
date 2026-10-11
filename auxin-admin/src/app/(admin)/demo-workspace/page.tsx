"use client";
/**
 * app/(admin)/demo-workspace/page.tsx
 * -------------------------------------
 * Dedicated super admin workspace displaying analytics/statistics
 * calculated EXCLUSIVELY from records where: is_demo == true.
 * Isolated from production data. Includes Super Admin demo reset controls.
 */
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Leaf,
  Truck,
  ClipboardList,
  IndianRupee,
  Activity,
  RotateCcw,
  ShieldAlert,
  Loader2,
  ShieldCheck,
  Key,
} from "lucide-react";
import { adminApi } from "@/lib/admin";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  highlight?: boolean;
}

function DemoStatCard({ label, value, icon, subtitle, highlight }: StatCardProps) {
  return (
    <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${highlight ? "bg-[#22C55E]" : "bg-[#3B82F6]"} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-in-out`} />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-[#A1A1AA] tracking-wider uppercase">{label}</span>
        <div className="p-2 rounded-xl bg-[#161618] border border-[#27272A] group-hover:bg-[#22C55E]/10 group-hover:border-[#22C55E]/20 transition-all duration-200">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3
          className="text-2xl font-black text-[#FAFAFA] tracking-tight leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </h3>
        <p className="text-[11px] text-[#71717A] font-medium">{subtitle}</p>
      </div>
    </div>
  );
}

export default function DemoWorkspacePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [isResetting, setIsResetting] = useState(false);
  const [currentDateString, setCurrentDateString] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    setCurrentDateString(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // Fetch real aggregate stats exclusively for demo records
  const { data: stats, isLoading: loadingStats, refetch } = useQuery({
    queryKey: ["admin-stats-demo"],
    queryFn: () => adminApi.stats(true).then((r) => r.data),
    refetchInterval: 15_000,
  });

  const handleResetDemo = () => {
    setShowConfirmModal(true);
  };

  const confirmReset = async () => {
    setShowConfirmModal(false);
    setIsResetting(true);
    try {
      const res = await adminApi.resetDemoEnvironment();
      if (res.data.success) {
        toast.success("Demo sandbox reset! All demo orders, payments, and activity cleared. Baseline accounts ready.", {
          duration: 5000,
          style: { background: "#111113", color: "#FAFAFA", border: "1px solid #22C55E" },
          icon: "🔄"
        });
        await queryClient.invalidateQueries();
        await refetch();
      } else {
        toast.error(res.data.message || "Failed to reset demo environment.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || "Failed to reset demo environment. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-[#FAFAFA] bg-[#09090B] min-h-screen pb-12">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1F1F23]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
              Demo Workspace
            </h1>
            <span className="text-[10px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Isolated Sandbox
            </span>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-1 font-medium">
            Super Admin presentation environment. All statistics and operations are strictly isolated to <code className="text-[#22C55E] font-mono">is_demo == true</code> records.
          </p>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div className="flex flex-col">
            <span className="text-xs text-[#A1A1AA] font-bold">{currentDateString}</span>
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#22C55E]">Sandbox Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* STATISTICS CARDS */}
      {loadingStats ? (
        <div className="h-44 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#22C55E]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <DemoStatCard
            label="Demo Accounts"
            value={(stats?.total_users ?? 0).toLocaleString("en-IN")}
            icon={<Users className="w-5 h-5 text-[#3B82F6]" />}
            subtitle="Permanent demo identities"
          />
          <DemoStatCard
            label="Demo Producers"
            value={(stats?.total_farmers ?? 0).toLocaleString("en-IN")}
            icon={<Leaf className="w-5 h-5 text-[#22C55E]" />}
            subtitle="Approved mock farmers"
          />
          <DemoStatCard
            label="Demo Orders"
            value={(stats?.total_orders ?? 0).toLocaleString("en-IN")}
            icon={<ClipboardList className="w-5 h-5 text-[#D4AF37]" />}
            subtitle="Simulated checkouts"
            highlight={Boolean(stats?.total_orders && stats.total_orders > 0)}
          />
          <DemoStatCard
            label="Demo Escrow Volume"
            value={`₹${(stats?.total_revenue ?? 0).toLocaleString("en-IN")}`}
            icon={<IndianRupee className="w-5 h-5 text-[#22C55E]" />}
            subtitle="Settled sales payments"
            highlight={Boolean(stats?.total_revenue && stats.total_revenue > 0)}
          />
          <DemoStatCard
            label="Demo Disputes"
            value={(stats?.total_disputes ?? 0).toLocaleString("en-IN")}
            icon={<ShieldAlert className="w-5 h-5 text-[#EF4444]" />}
            subtitle="Active simulated complaints"
          />
          <DemoStatCard
            label="Catalogue Baseline"
            value="Active (6 Items)"
            icon={<Truck className="w-5 h-5 text-[#A855F7]" />}
            subtitle="Fresh produce inventory"
          />
        </div>
      )}

      {/* DEMO ENVIRONMENT RESET CONTROL PANEL */}
      <div className="p-6 rounded-2xl bg-[#111113] border border-[#1F1F23] space-y-5">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex-shrink-0">
            <RotateCcw className="w-6 h-6 text-[#22C55E]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Reset Demonstration Sandbox</h3>
            <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
              Purges all simulated demonstration orders, payments, transactions, delivery histories, reviews, and disputes. 
              Restores permanent demo accounts (<span className="text-[#FAFAFA] font-medium">Customer, Farmer, Courier, Admin</span>) with valid default profile addresses and re-populates clean baseline farmer inventory.
            </p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-[#22C55E] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Impact Guarantee: Production users, orders, and real payments are completely unaffected.</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1F1F23] pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <button
            onClick={handleResetDemo}
            disabled={isResetting}
            className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] disabled:opacity-40 disabled:hover:bg-[#22C55E] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-lg shadow-[#22C55E]/10"
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Resetting Sandbox...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                Reset Sandbox
              </>
            )}
          </button>
          <span className="text-[11px] text-[#71717A]">
            Authorized Operator: <strong className="text-[#FAFAFA] font-medium">{user?.name || "Super Admin"}</strong> ({user?.is_super_admin ? "Super Admin 👑" : "Admin"})
          </span>
        </div>
      </div>

      {/* DEMONSTRATION WORKFLOW & CREDENTIALS REFERENCE */}
      <div className="p-6 rounded-2xl bg-[#111113] border border-[#1F1F23] space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-900/30 flex-shrink-0">
            <Activity className="w-6 h-6 text-[#3B82F6]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#FAFAFA]">Investor Demonstration Walkthrough</h3>
            <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
              Step-by-step guidance to demonstrate the complete farm-to-doorstep direct commerce and delivery lifecycle in under 3 minutes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
          {/* Step-by-step Walkthrough */}
          <div className="lg:col-span-7 p-4 rounded-xl bg-[#161618] border border-[#1F1F23] space-y-3">
            <h4 className="font-bold text-[#3B82F6] uppercase tracking-wider text-[10px]">Standard Lifecycle Scenario</h4>
            <ol className="space-y-2.5 text-[#A1A1AA] font-medium">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold flex items-center justify-center border border-[#3B82F6]/30">1</span>
                <div>
                  <strong className="text-[#FAFAFA]">Clean Reset:</strong> Click <span className="text-[#22C55E] font-semibold">Reset Sandbox</span> above to zero all active orders and return metrics to baseline.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold flex items-center justify-center border border-[#3B82F6]/30">2</span>
                <div>
                  <strong className="text-[#FAFAFA]">Customer Placement:</strong> Sign in as Customer on the main portal, browse fresh produce, add to cart, and checkout with <span className="text-[#22C55E] font-semibold">Cash on Delivery</span>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold flex items-center justify-center border border-[#3B82F6]/30">3</span>
                <div>
                  <strong className="text-[#FAFAFA]">Farmer Packaging:</strong> Sign in as Farmer, inspect the incoming order in the Farmer Dashboard, and click <span className="text-[#3B82F6] font-semibold">Accept & Pack</span>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-bold flex items-center justify-center border border-[#3B82F6]/30">4</span>
                <div>
                  <strong className="text-[#FAFAFA]">Courier OTP Handshake:</strong> Sign in as Courier, accept the delivery route, click <span className="text-[#A855F7] font-semibold">Picked Up</span>, and confirm drop-off with the 6-digit code shown to the customer under <span className="text-[#22C55E] font-semibold">Orders</span> (it is generated fresh for each delivery).
                </div>
              </li>
            </ol>
          </div>

          {/* Permanent Demo Credentials Reference */}
          <div className="lg:col-span-5 p-4 rounded-xl bg-[#161618] border border-[#1F1F23] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#22C55E] uppercase tracking-wider text-[10px]">Permanent Demo Accounts</h4>
              <span className="text-[9px] text-[#71717A] font-mono flex items-center gap-1">
                <Key className="w-3 h-3 text-[#22C55E]" />
                Bypass OTP: 111111
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#1F1F23] flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#FAFAFA]">Customer</p>
                  <p className="text-[10px] text-[#71717A] font-mono">demo.customer@auxin.app</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 font-semibold border border-blue-900/40">Buyer</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#1F1F23] flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#FAFAFA]">Farmer</p>
                  <p className="text-[10px] text-[#71717A] font-mono">demo.farmer@auxin.app</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-semibold border border-emerald-900/40">Producer</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#1F1F23] flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#FAFAFA]">Courier</p>
                  <p className="text-[10px] text-[#71717A] font-mono">demo.delivery@auxin.app</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-950/40 text-purple-400 font-semibold border border-purple-900/40">Logistics</span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#111113] border border-[#1F1F23] flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-[#FAFAFA]">Admin</p>
                  <p className="text-[10px] text-[#71717A] font-mono">demo.admin@auxin.app</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 font-semibold border border-amber-900/40">Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#1F1F23]">
              <div className="p-2.5 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#FAFAFA]">Reset Demo Sandbox?</h3>
            </div>
            
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              This will purge all simulated demonstration orders, payments, deliveries, and reviews, returning metrics to <strong className="text-[#FAFAFA]">0 Orders</strong> and <strong className="text-[#FAFAFA]">₹0 Revenue</strong>. Permanent demo accounts will remain ready for immediate login.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[#161618] border border-[#27272A] hover:bg-[#1C1C1E] text-xs font-semibold text-[#A1A1AA] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-xs font-bold text-white transition-all cursor-pointer active:scale-95 shadow-md shadow-[#22C55E]/10"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
