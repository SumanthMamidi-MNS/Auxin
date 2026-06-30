"use client";
/**
 * app/(admin)/dashboard/page.tsx — Auxin Admin v2.0
 * Stripe-inspired dark dashboard with live stats, attention section, and quick actions.
 */

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Users, Package, ClipboardList, ShieldAlert,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
  IndianRupee, Zap, ArrowRight, BarChart3, Truck,
} from "lucide-react";
import { adminApi } from "@/lib/admin";
import { StatCard, Card, SectionHeader, Spinner, Badge } from "@/components/ui/Card";
import { hasPermission, isAdminRole, type AdminRole } from "@/types";
import { useAuthStore } from "@/store/authStore";
import type { AdminStats } from "@/types";

/* ── Revenue bar sub-component ─────────────────────────────────────────── */
function RevenueBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-[#A1A1AA] font-medium">{label}</span>
        <span className="text-[#F4F4F5] font-semibold">₹{Number(value ?? 0).toLocaleString("en-IN")}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#27272A" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg,#22C55E,#16A34A)" }}
        />
      </div>
    </div>
  );
}

/* ── Attention item sub-component ───────────────────────────────────────── */
function AttentionItem({
  icon: Icon, count, label, href, color, bg,
}: {
  icon: React.ElementType; count: number; label: string;
  href: string; color: string; bg: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#27272A] last:border-b-0">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F4F4F5]">
          {count} {label}{count !== 1 ? "s" : ""} awaiting action
        </p>
        <Link
          href={href}
          className="text-xs font-medium transition-colors hover:underline"
          style={{ color: "#22C55E" }}
        >
          Review →
        </Link>
      </div>
      <span
        className="text-xs font-black px-2 py-0.5 rounded-lg"
        style={{ background: bg, color }}
      >
        {count}
      </span>
    </div>
  );
}

/* ── Quick Action card ──────────────────────────────────────────────────── */
function QuickAction({
  href, icon: Icon, label, description, color, bg,
}: {
  href: string; icon: React.ElementType; label: string;
  description: string; color: string; bg: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-4 rounded-xl border border-[#27272A] transition-all duration-150 hover:border-[#3F3F46]"
      style={{ background: "#18181B" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-150 group-hover:scale-105"
        style={{ background: bg }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F4F4F5]">{label}</p>
        <p className="text-xs text-[#71717A]">{description}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-[#52525B] transition-transform duration-150 group-hover:translate-x-0.5" />
    </Link>
  );
}

/* ── Main Dashboard Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role as AdminRole | undefined;

  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  /* ── Permission gates ───────────────────────────────────────────────── */
  const canViewFinances   = role && isAdminRole(role) && hasPermission(role, "manage_finances");
  const canManageUsers    = role && isAdminRole(role) && hasPermission(role, "manage_users");
  const canManageFarmers  = role && isAdminRole(role) && hasPermission(role, "manage_farmers");
  const canManageDisputes = role && isAdminRole(role) && hasPermission(role, "manage_disputes");
  const canManageOrders   = role && isAdminRole(role) && hasPermission(role, "manage_orders");
  const canManageDelivery = role && isAdminRole(role) && hasPermission(role, "manage_delivery");

  /* ── Attention items ───────────────────────────────────────────────── */
  const attentionItems: React.ReactNode[] = [];
  if (canManageFarmers && (stats?.pending_farmers ?? 0) > 0) {
    attentionItems.push(
      <AttentionItem
        key="farmers"
        icon={Clock}
        count={stats!.pending_farmers}
        label="farmer pending approval"
        href="/farmers"
        color="#F59E0B"
        bg="rgba(245,158,11,0.12)"
      />
    );
  }
  if (canManageDisputes && (stats?.open_disputes ?? 0) > 0) {
    attentionItems.push(
      <AttentionItem
        key="disputes"
        icon={ShieldAlert}
        count={stats!.open_disputes}
        label="open dispute"
        href="/disputes"
        color="#EF4444"
        bg="rgba(239,68,68,0.12)"
      />
    );
  }

  /* ── Quick actions ─────────────────────────────────────────────────── */
  const quickActions = [
    ...(canManageFarmers  ? [{ href: "/farmers",   icon: Users,        label: "Review Farmers",  description: "Approve or reject applicants", color: "#22C55E", bg: "rgba(34,197,94,0.1)"  }] : []),
    ...(canManageDisputes ? [{ href: "/disputes",  icon: ShieldAlert,  label: "Resolve Disputes",description: "Handle open disputes",         color: "#EF4444", bg: "rgba(239,68,68,0.1)"  }] : []),
    ...(canManageOrders   ? [{ href: "/orders",    icon: ClipboardList,label: "All Orders",       description: "Browse and filter orders",     color: "#3B82F6", bg: "rgba(59,130,246,0.1)" }] : []),
    ...(canManageUsers    ? [{ href: "/users",     icon: Users,        label: "Manage Users",    description: "Suspend or reinstate accounts", color: "#A855F7", bg: "rgba(168,85,247,0.1)"}] : []),
    ...(canManageDelivery ? [{ href: "/deliveries",icon: Truck,        label: "Deliveries",      description: "Track active deliveries",       color: "#F59E0B", bg: "rgba(245,158,11,0.1)" }] : []),
    { href: "/products", icon: Package, label: "Products",   description: "View and moderate listings", color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
  ].slice(0, 6);

  /* ── Loading state ──────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-[#71717A]">Loading platform stats…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fade-in">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#F4F4F5] tracking-tight">Platform Overview</h2>
          <p className="text-[#71717A] text-sm mt-1">
            Real-time metrics · auto-refreshes every 30s
          </p>
        </div>
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live
        </div>
      </div>

      {/* ── Stat grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Users"
          value={stats?.total_users ?? "—"}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Total Orders"
          value={stats?.total_orders ?? "—"}
          icon={<ClipboardList className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Total Products"
          value={stats?.total_products ?? "—"}
          icon={<Package className="w-5 h-5" />}
          color="purple"
        />
        <StatCard
          label="Open Disputes"
          value={stats?.open_disputes ?? "—"}
          icon={<ShieldAlert className="w-5 h-5" />}
          color="red"
          trendLabel={(stats?.open_disputes ?? 0) > 0 ? "Needs attention" : "All clear"}
          trend={(stats?.open_disputes ?? 0) > 0 ? "down" : "up"}
        />
        <StatCard
          label="Pending Farmers"
          value={stats?.pending_farmers ?? "—"}
          icon={<Clock className="w-5 h-5" />}
          color="amber"
          trendLabel={(stats?.pending_farmers ?? 0) > 0 ? "Awaiting review" : "None pending"}
          trend={(stats?.pending_farmers ?? 0) > 0 ? "neutral" : "up"}
        />
        {canViewFinances && (
          <StatCard
            label="Total Revenue"
            value={stats ? `₹${Number(stats.total_revenue ?? 0).toLocaleString("en-IN")}` : "—"}
            icon={<IndianRupee className="w-5 h-5" />}
            color="green"
            trendLabel="Escrow settled"
            trend="up"
          />
        )}
      </div>

      {/* ── Attention + Quick Actions row ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Attention Needed */}
        <Card>
          <SectionHeader
            title="Attention Needed"
            subtitle="Items requiring immediate action"
            action={
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            }
          />
          {attentionItems.length > 0 ? (
            <div>{attentionItems}</div>
          ) : (
            <div className="flex items-center gap-3 py-6">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#F4F4F5]">All clear!</p>
                <p className="text-xs text-[#71717A] mt-0.5">No pending actions required.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <SectionHeader
            title="Quick Actions"
            subtitle="Navigate to key sections"
            action={<Zap className="w-4 h-4 text-[#22C55E]" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickActions.map((qa) => (
              <QuickAction key={qa.href} {...qa} />
            ))}
          </div>
        </Card>
      </div>

      {/* ── Revenue Snapshot (finance roles only) ────────────────────── */}
      {canViewFinances && stats && (
        <Card>
          <SectionHeader
            title="Revenue Snapshot"
            subtitle="Escrow-settled revenue breakdown"
            action={<TrendingUp className="w-4 h-4 text-[#22C55E]" />}
          />
          <div className="space-y-5">
            <RevenueBar
              label="Total Settled Revenue"
              value={stats.total_revenue}
              max={stats.total_revenue * 1.5 || 1}
            />
            <RevenueBar
              label="Estimated Pending (orders × avg)"
              value={stats.total_orders * 200}
              max={stats.total_revenue * 1.5 || 1}
            />
            <RevenueBar
              label="Dispute Exposure"
              value={stats.open_disputes * 500}
              max={stats.total_revenue * 1.5 || 1}
            />
          </div>
          <p className="text-xs text-[#52525B] mt-5 flex items-center gap-1.5">
            <BarChart3 className="w-3 h-3" />
            Revenue is held in escrow until delivery is confirmed by OTP.
          </p>
        </Card>
      )}
    </div>
  );
}
