"use client";
/**
 * app/delivery/earnings/page.tsx — Auxin v3.0
 * GOAT-Level Delivery Partner Financial Hub:
 *  - Lifetime Payouts Hero Card with Green/Gold Accents
 *  - 4-Stat Grid (Today's Earnings, Weekly Payout, Pending Settlements, Settled)
 *  - SVG Earnings Trend Area Chart
 *  - ₹40 / drop transparent escrow payout model
 */

import { useQuery } from "@tanstack/react-query";
import { Wallet, Calendar, CheckCircle2, Clock, Landmark, ArrowUpRight, IndianRupee, TrendingUp, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard, EmptyState, Badge } from "@/components/ui/Card";
import { DeliveryEarningsSkeleton } from "@/components/ui/Skeletons";
import { deliveryApi } from "@/lib/delivery";
import { useAuthStore } from "@/store/authStore";

export default function DeliveryEarningsPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["my-deliveries-earnings"],
    queryFn: () => deliveryApi.myDeliveries().then((r) => r.data),
  });

  const deliveries = data?.items ?? (Array.isArray(data) ? data : []);
  const delivered = deliveries.filter((d) => d.status === "delivered");

  const PER_DELIVERY = 40;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = startOfDay - 7 * 24 * 60 * 60 * 1000;
  const twoDaysAgo = startOfDay - 2 * 24 * 60 * 60 * 1000;

  const totalEarnings = delivered.length * PER_DELIVERY;

  const todayEarnings = delivered
    .filter((d) => d.delivered_at && new Date(d.delivered_at).getTime() >= startOfDay)
    .length * PER_DELIVERY;

  const weeklyEarnings = delivered
    .filter((d) => d.delivered_at && new Date(d.delivered_at).getTime() >= sevenDaysAgo)
    .length * PER_DELIVERY;

  const pendingSettlementCount = delivered.filter(
    (d) => d.delivered_at && new Date(d.delivered_at).getTime() >= twoDaysAgo
  ).length;
  const pendingSettlements = pendingSettlementCount * PER_DELIVERY;
  const settledEarnings = totalEarnings - pendingSettlements;

  // SVG Chart data
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfDay - (6 - i) * 24 * 60 * 60 * 1000);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const count = delivered.filter((o) => {
      if (!o.delivered_at) return false;
      const time = new Date(o.delivered_at).getTime();
      return time >= dayStart && time < dayEnd;
    }).length;

    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }).slice(0, 2),
      amount: count * PER_DELIVERY,
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

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <TopBar title="Courier Earnings" />

      <div className="page-content py-4 sm:py-6 space-y-6 sm:space-y-8">
        {/* Lifetime Earnings Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-warm)] text-center shadow-xs space-y-2">
          <p className="text-overline flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
            Lifetime Delivery Payouts
          </p>
          <p className="text-4xl sm:text-5xl font-black text-[var(--text-primary)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            ₹{totalEarnings.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            {delivered.length} completed doorstep drops at ₹{PER_DELIVERY}.00 fixed compensation per run
          </p>
        </div>

        {/* Stats Grid */}
        {isLoading ? (
          <DeliveryEarningsSkeleton />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              label="Today's Earnings"
              value={`₹${todayEarnings}`}
              icon={<Wallet className="w-5 h-5" />}
              color="green"
            />
            <StatCard
              label="Weekly Payout"
              value={`₹${weeklyEarnings}`}
              icon={<Calendar className="w-5 h-5" />}
              color="blue"
            />
            <StatCard
              label="Pending Settlement"
              value={`₹${pendingSettlements}`}
              icon={<Landmark className="w-5 h-5" />}
              color="purple"
            />
            <StatCard
              label="Settled to Bank"
              value={`₹${settledEarnings}`}
              icon={<CheckCircle2 className="w-5 h-5" />}
              color="green"
            />
          </div>
        )}

        {/* Daily Velocity Chart */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-overline">7-Day Trip Velocity</h3>
              <p className="text-xl font-black text-[var(--text-primary)] mt-0.5" style={{ fontFamily: "var(--font-heading)" }}>
                ₹{weeklyEarnings} earned
              </p>
            </div>
            <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary-subtle)] px-3 py-1 rounded-full border border-[var(--primary-glow)]">
              Daily Volume
            </span>
          </div>

          <div className="pt-2">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-28">
              <defs>
                <linearGradient id="deliveryChartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <line x1="0" y1={chartHeight - padding} x2={chartWidth} y2={chartHeight - padding} stroke="var(--border)" strokeWidth="1" />
              {areaD && <path d={areaD} fill="url(#deliveryChartFill)" />}
              {pathD && <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="4" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" />
                  <text x={p.x} y={chartHeight - 2} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--text-secondary)">
                    {p.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
