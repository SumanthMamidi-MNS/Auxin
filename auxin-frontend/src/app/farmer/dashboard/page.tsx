"use client";
/**
 * app/farmer/dashboard/page.tsx — Auxin v3.0
 * GOAT-Level Farmer Business Center:
 *  - High-Contrast Hero Revenue Card with Gold/Green Accents
 *  - Operations Alert Panel (Low stock, Pending packing, Courier pickups)
 *  - Refined Sales Chart with Gradient Area Fill
 *  - Quick Action Tiles with micro-motion
 *  - Full bank details modal preservation
 */

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  TrendingUp, Package, ClipboardList, CheckCircle2, AlertTriangle,
  ArrowRight, IndianRupee, Landmark, User as UserIcon, ShieldCheck, Wallet, Bell, Clock, Sparkles
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard, Badge, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionBlock } from "@/components/ui/SectionBlock";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/orders";
import { farmersApi } from "@/lib/farmers";
import { inventoryApi } from "@/lib/inventory";
import { FarmerDashboardSkeleton } from "@/components/ui/Skeletons";
import Link from "next/link";
import { clsx } from "clsx";

export default function FarmerDashboardPage() {
  const { user, token } = useAuthStore();

  // Load orders for statistics
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["farmer-orders-stats"],
    queryFn: () => ordersApi.farmerOrders({ page: 1, page_size: 100 }).then((r) => r.data),
    refetchInterval: 10000,
  });

  // Load inventory list to compute low stock counts and valuation
  const { data: invData } = useQuery({
    queryKey: ["farmer-inventory-stats", token],
    queryFn: () => {
      const api = token ? inventoryApi(token) : null;
      if (!api) return Promise.resolve({ items: [], total: 0 } as any);
      return api.listMy({ page: 1, page_size: 100 }).then((r) => r.data);
    },
    enabled: !!token,
    refetchInterval: 10000,
  });

  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ["farmer-dashboard-profile"],
    queryFn: () => farmersApi.myProfile().then((r) => r.data),
  });

  // Bank Info States (modal fallback)
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [submittingBank, setSubmittingBank] = useState(false);

  const isBankMissing = !profileData || !profileData.bank_account_number || profileData.bank_account_number.startsWith("00000");

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName.trim() || !accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error("Please fill all required bank details.");
      return;
    }
    const acc = bankAccountNumber.trim();
    const confirmAcc = confirmAccountNumber.trim();
    if (acc.length < 9 || acc.length > 18 || !/^\d+$/.test(acc)) {
      toast.error("Bank account number must be between 9 and 18 digits.");
      return;
    }
    if (acc !== confirmAcc) {
      toast.error("Bank account numbers do not match.");
      return;
    }
    const ifsc = ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}[A-Z0-9]{7}$/;
    if (!ifscRegex.test(ifsc)) {
      toast.error("IFSC code must be exactly 11 characters.");
      return;
    }

    setSubmittingBank(true);
    try {
      await farmersApi.updateProfile({
        bank_name: bankName.trim(),
        account_holder_name: accountHolderName.trim(),
        bank_account_number: acc,
        ifsc_code: ifsc,
        upi_id: upiId.trim() || undefined,
      });
      toast.success("Bank details saved successfully!");
      refetchProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save bank details.");
    } finally {
      setSubmittingBank(false);
    }
  };

  const orders = ordersData?.items ?? [];
  const inventoryList = invData?.items ?? [];

  // Calculations
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  const todayOrders = orders.filter((o) => new Date(o.created_at).getTime() >= startOfDay);
  const todaySales = todayOrders
    .filter((o) => o.status === "completed" || o.status === "accepted" || o.status === "packing" || o.status === "ready_for_pickup")
    .reduce((s, o) => s + Number(o.total_amount), 0);

  const pendingPacking = orders.filter((o) => o.status === "accepted" || o.status === "packing");
  const inventoryValue = inventoryList.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const lowStockItems = inventoryList.filter((item: any) => item.quantity <= 10 && item.quantity > 0);
  const lowStockCount = lowStockItems.length;

  const sevenDaysAgo = startOfDay - 7 * 24 * 60 * 60 * 1000;
  const completedOrders = orders.filter((o) => o.status === "completed");
  const weeklyRevenue = completedOrders
    .filter((o) => new Date(o.created_at).getTime() >= sevenDaysAgo)
    .reduce((s, o) => s + Number(o.total_amount), 0);

  // Weekly Chart Points
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfDay - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const amount = completedOrders
      .filter((o) => {
        const time = new Date(o.created_at).getTime();
        return time >= dayStart && time < dayEnd;
      })
      .reduce((s, o) => s + Number(o.total_amount), 0);

    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2),
      amount,
    };
  });

  const maxAmount = Math.max(...last7Days.map((d) => d.amount), 100);
  const chartHeight = 90;
  const chartWidth = 340;
  const padding = 15;

  const points = last7Days.map((d, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / 6;
    const y = chartHeight - padding - (d.amount / maxAmount) * (chartHeight - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.length
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
    : "";

  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`
    : "";

  // Contextual Alerts
  const getNotifications = () => {
    const alerts = [];
    if (pendingPacking.length > 0) {
      alerts.push({
        id: "packing",
        text: `You have ${pendingPacking.length} order(s) waiting to be packed!`,
        type: "warning",
      });
    }
    if (lowStockCount > 0) {
      alerts.push({
        id: "low_stock",
        text: `${lowStockCount} items have reached low stock limits!`,
        type: "danger",
      });
    }
    if (orders.filter((o) => o.status === "ready_for_pickup").length > 0) {
      alerts.push({
        id: "pickup",
        text: "Delivery partners have been notified for ready orders.",
        type: "info",
      });
    }
    if (alerts.length === 0) {
      alerts.push({
        id: "all_clear",
        text: "All clear! Your farm listings are fully operational.",
        type: "success",
      });
    }
    return alerts;
  };
  const notifications = getNotifications();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning 👋";
    if (hr < 17) return "Good Afternoon 👋";
    return "Good Evening 👋";
  };

  const firstName = user?.name?.split(" ")[0] ?? "Farmer";

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <TopBar title="Farmer Business Center" />

      <div className="page-content py-4 sm:py-6 space-y-5 sm:space-y-6">
        {/* Personalized Greeting Card */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[var(--text-secondary)]">{getGreeting()}</p>
            <h1 className="text-[22px] sm:text-[26px] font-bold text-[var(--text-primary)] tracking-tight leading-tight truncate" style={{ fontFamily: "var(--font-heading)" }}>
              Namaste, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 truncate">
              {profileData?.farm_name || "Partner Farm"} · {profileData?.farm_category || "Direct Cultivator"}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-full bg-[var(--primary-muted)] text-[11px] sm:text-xs font-semibold text-[var(--primary-deep)] flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified grower
          </span>
        </div>

        {isLoading ? (
          <FarmerDashboardSkeleton />
        ) : (
          <>
            {/* Operations Alerts Bar */}
            <section aria-label="Alerts" className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {notifications.map((n) => {
                const Icon = n.type === "danger" ? AlertTriangle : n.type === "warning" ? Clock : n.type === "info" ? Bell : CheckCircle2;
                return (
                  <div
                    key={n.id}
                    role="status"
                    className={clsx(
                      "flex items-center gap-3 px-3.5 py-3 rounded-xl border text-[13px] font-medium",
                      n.type === "danger"
                        ? "bg-[var(--danger-bg)] border-[var(--danger-border)] text-[#B91C1C]"
                        : n.type === "warning"
                        ? "bg-[var(--warning-bg)] border-[var(--warning-border)] text-[#92400E]"
                        : n.type === "info"
                        ? "bg-[var(--info-bg)] border-[var(--info-border)] text-[#075985]"
                        : "bg-[var(--primary-muted)]/60 border-[var(--success-border)] text-[var(--primary-deep)]"
                    )}
                  >
                    <span className="w-7 h-7 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="leading-snug">{n.text}</span>
                  </div>
                );
              })}
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                label="Today's Sales"
                value={`₹${todaySales.toFixed(0)}`}
                icon={<IndianRupee className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                label="Pending Packing"
                value={pendingPacking.length}
                icon={<ClipboardList className="w-5 h-5" />}
                color="purple"
              />
              <StatCard
                label="Inventory Value"
                value={`₹${inventoryValue.toLocaleString("en-IN")}`}
                icon={<Wallet className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                label="Low Stock Alerts"
                value={lowStockCount}
                icon={<AlertTriangle className="w-5 h-5" />}
                color="amber"
              />
            </div>

            {/* Analytics & Quick Actions Section: 2 Columns on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 items-start">
              {/* Left Column: Weekly Revenue Chart (7 cols) */}
              <section className="lg:col-span-7 p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Weekly revenue</p>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mt-0.5 tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                      ₹{weeklyRevenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] bg-[var(--surface-2)] px-2.5 py-1 rounded-full">
                    Last 7 days
                  </span>
                </div>

                {/* SVG Chart with Gradient Area */}
                <div className="pt-2">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" role="img" aria-label="Revenue for the last 7 days">
                    <defs>
                      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Line */}
                    <line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="var(--border)" strokeWidth="1" />

                    {/* Gradient Area Fill */}
                    {areaD && <path d={areaD} fill="url(#chartFill)" />}

                    {/* Line Path */}
                    {pathD && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Point Circles & Day Labels */}
                    {points.map((p, idx) => (
                      <g key={idx}>
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="var(--surface)"
                          stroke="var(--primary)"
                          strokeWidth="2.5"
                        />
                        <text
                          x={p.x}
                          y={chartHeight - 2}
                          textAnchor="middle"
                          fontSize="9"
                          fontWeight="bold"
                          fill="var(--text-secondary)"
                        >
                          {p.label}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </section>

              {/* Right Column: Quick Actions (5 cols) */}
              <div className="lg:col-span-5 space-y-2">
                <h2 className="sr-only">Quick actions</h2>
                <p aria-hidden="true" className="text-xs font-medium text-[var(--text-secondary)] px-1">Quick actions</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                  <Link
                    href="/farmer/inventory"
                    className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--card-hover-border)] hover:shadow-md transition-[box-shadow,border-color] flex items-center justify-between shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--primary-muted)] text-[var(--primary-deep)] flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                          My Inventory
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Manage & add produce listings</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
                  </Link>

                  <Link
                    href="/farmer/orders"
                    className="p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--card-hover-border)] hover:shadow-md transition-[box-shadow,border-color] flex items-center justify-between shadow-xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(212,175,55,0.14)] text-[var(--gold-deep)] flex items-center justify-center">
                        <ClipboardList className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                          Incoming Orders
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Prepare, pack & fulfill</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all" />
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bank Details Modal */}
      {isBankMissing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div role="dialog" aria-modal="true" aria-labelledby="bank-modal-title" className="w-full max-w-md bg-[var(--surface)] rounded-2xl p-5 sm:p-6 shadow-2xl border border-[var(--border)] max-h-[90vh] overflow-y-auto space-y-5">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center mx-auto shadow-xs">
                <Landmark className="w-6 h-6" />
              </div>
              <h2 id="bank-modal-title" className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Complete Bank Details
              </h2>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Add your bank account so customer Escrow payments can be deposited directly upon delivery.
              </p>
            </div>

            <form onSubmit={handleBankSubmit} className="space-y-3.5">
              <div>
                <label className="text-overline block mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="SBI, HDFC, ICICI etc."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-overline block mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Name as in passbook"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-overline block mb-1">Bank Account Number *</label>
                <input
                  type="password"
                  required
                  placeholder="Enter account number"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-overline block mb-1">Confirm Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="Re-enter account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-overline block mb-1">IFSC Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0001234"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] uppercase"
                />
              </div>

              <div>
                <label className="text-overline block mb-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  placeholder="farmer@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={submittingBank}
                  type="submit"
                >
                  {submittingBank ? "Saving Bank Info…" : "Save Bank Details"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
