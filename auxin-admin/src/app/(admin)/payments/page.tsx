"use client";
/**
 * app/(admin)/payments/page.tsx — Auxin Admin v2.0
 * Complete payments management dashboard.
 * Connected to GET /admin/payments with status filter + pagination.
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  CreditCard,
  TrendingUp,
  CheckCircle,
  XCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { adminApi } from "@/lib/admin";
import { Badge, SectionHeader, StatCard } from "@/components/ui/Card";
import type { Payment, PaymentStatus } from "@/types";

// ── Tab config ────────────────────────────────────────────────────────────────

const STATUS_TABS: { label: string; value: PaymentStatus | "all" }[] = [
  { label: "All",      value: "all"      },
  { label: "Created",  value: "created"  },
  { label: "Paid",     value: "paid"     },
  { label: "Failed",   value: "failed"   },
  { label: "Refunded", value: "refunded" },
];

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<PaymentStatus, string> = {
  created:  "#F59E0B",
  paid:     "#22C55E",
  failed:   "#EF4444",
  refunded: "#3B82F6",
};

const STATUS_ICON: Record<PaymentStatus, React.ReactNode> = {
  created:  <Clock       className="w-3 h-3" />,
  paid:     <CheckCircle className="w-3 h-3" />,
  failed:   <XCircle     className="w-3 h-3" />,
  refunded: <RefreshCw   className="w-3 h-3" />,
};

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [activeTab, setActiveTab]   = useState<PaymentStatus | "all">("all");
  const [search,    setSearch]      = useState("");
  const [page,      setPage]        = useState(1);
  const PAGE_SIZE = 20;

  const statusParam = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-payments", activeTab, page],
    queryFn:  () =>
      adminApi.listPayments({ status: statusParam, page, page_size: PAGE_SIZE }).then((r) => r.data),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const payments: Payment[] = data?.items ?? [];

  // Client-side search by order ID or Razorpay payment ID
  const filtered = search.trim()
    ? payments.filter((p) =>
        String(p.order_id).includes(search) ||
        (p.razorpay_payment_id ?? "").toLowerCase().includes(search.toLowerCase()) ||
        p.razorpay_order_id.toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  // Summary stats from current page
  const totalRevenue = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidCount     = payments.filter((p) => p.status === "paid").length;
  const failedCount   = payments.filter((p) => p.status === "failed").length;
  const refundedCount = payments.filter((p) => p.status === "refunded").length;

  const handleTabChange = useCallback((tab: PaymentStatus | "all") => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Payments"
        subtitle="Monitor all payment transactions on the platform."
      />


      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Paid"
          value={String(paidCount)}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Failed"
          value={String(failedCount)}
          icon={<XCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Refunded"
          value={String(refundedCount)}
          icon={<RefreshCw className="w-5 h-5" />}
          color="blue"
        />

      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Status tabs */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
          style={{ background: "#18181B", border: "1px solid #27272A" }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap"
              style={
                activeTab === tab.value
                  ? { background: "#22C55E", color: "#052E16" }
                  : { color: "#71717A" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="search"
            placeholder="Order ID or Razorpay ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border text-sm w-64 transition-all"
            style={{
              background: "#18181B",
              border: "1px solid #27272A",
              color: "#F4F4F5",
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: "#27272A" }}>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-[#22C55E] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <p className="text-[#71717A] text-sm">Failed to load payments.</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-[#22C55E] hover:underline"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <CreditCard className="w-10 h-10 text-[#27272A]" />
            <p className="text-[#71717A] text-sm">
              {search ? "No payments match your search." : "No payments found."}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order #</th>
                <th>Razorpay Order</th>
                <th>Razorpay Payment</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id}>
                  <td className="font-mono text-xs text-[#A1A1AA]">#{payment.id}</td>
                  <td>
                    <span
                      className="font-semibold text-[#F4F4F5] px-2 py-0.5 rounded-lg text-xs"
                      style={{ background: "#27272A" }}
                    >
                      Order #{payment.order_id}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-[#71717A]">
                    {payment.razorpay_order_id
                      ? payment.razorpay_order_id.slice(0, 20) + "…"
                      : "—"}
                  </td>
                  <td className="font-mono text-xs text-[#71717A]">
                    {payment.razorpay_payment_id
                      ? payment.razorpay_payment_id.slice(0, 20) + "…"
                      : <span className="text-[#52525B]">Pending</span>}
                  </td>
                  <td className="font-semibold text-[#F4F4F5]">
                    {formatCurrency(payment.amount, payment.currency)}
                  </td>
                  <td>
                    <Badge
                      label={payment.status}
                      dot
                    />
                  </td>

                  <td className="text-[#71717A] text-xs">
                    {formatDate(payment.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[#71717A]">
            Showing {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} of{" "}
            {data.total} payments
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: "#18181B", border: "1px solid #27272A", color: "#A1A1AA" }}
            >
              ← Prev
            </button>
            <button
              disabled={page >= data.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
              style={{ background: "#18181B", border: "1px solid #27272A", color: "#A1A1AA" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
