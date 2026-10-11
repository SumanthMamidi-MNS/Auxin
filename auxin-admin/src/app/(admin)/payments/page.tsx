"use client";
/**
 * app/(admin)/payments/page.tsx — Auxin Admin v2.0
 * Premium Financial Reconciliation Dashboard & Transaction Ledger.
 * Integrates real revenue summation, escrow state sorting, date filters, and CSV downloads.
 * Keeps all queries, API clients, and database interactions fully intact.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, CreditCard, TrendingUp, CheckCircle, XCircle, RefreshCw, Clock, ChevronLeft, ChevronRight, Download, Calendar, DollarSign } from "lucide-react";
import { adminApi } from "@/lib/admin";
import { Badge, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Payment, PaymentStatus, Order, PaginatedResponse } from "@/types";
import toast from "react-hot-toast";

export default function PaymentsReconciliationPage() {
  const [activeTab, setActiveTab] = useState<PaymentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  // Date filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const statusParam = activeTab === "all" ? undefined : activeTab;

  // Query 1: Payments list
  const { data: paymentsData, isLoading: loadingPayments } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ["admin-payments", statusParam, page],
    queryFn: () =>
      adminApi.listPayments({ status: statusParam, page, page_size: 50 }).then((r) => r.data),
    staleTime: 20_000,
  });

  // Query 2: Orders list (to check if payment is settled / order completed)
  const { data: ordersData, isLoading: loadingOrders } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders-payments-sync"],
    queryFn: () => adminApi.listOrders({ page: 1 }).then((r) => r.data),
    staleTime: 30_000,
  });

  const payments = paymentsData?.items ?? [];
  const orders = ordersData?.items ?? [];
  const isLoading = loadingPayments || loadingOrders;
  const totalPages = paymentsData?.total_pages ?? 1;

  // Create lookup map for order status
  const ordersMap = Object.fromEntries((orders ?? []).map((o) => [o?.id ?? 0, o]));

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneWeekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  // Calculate balances from payments
  const allPaidPayments = (payments ?? []).filter((p) => p?.status === "paid");

  const todayRevenue = allPaidPayments
    .filter((p) => {
      if (!p?.created_at) return false;
      const t = new Date(p.created_at).getTime();
      return !isNaN(t) && t >= startOfDay;
    })
    .reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);

  const weeklyRevenue = allPaidPayments
    .filter((p) => {
      if (!p?.created_at) return false;
      const t = new Date(p.created_at).getTime();
      return !isNaN(t) && t >= oneWeekAgo;
    })
    .reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);

  const monthlyRevenue = allPaidPayments
    .filter((p) => {
      if (!p?.created_at) return false;
      const t = new Date(p.created_at).getTime();
      return !isNaN(t) && t >= oneMonthAgo;
    })
    .reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);

  const pendingPayouts = allPaidPayments
    .filter((p) => ordersMap[p?.order_id ?? 0]?.status !== "completed")
    .reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);

  const completedPayouts = allPaidPayments
    .filter((p) => ordersMap[p?.order_id ?? 0]?.status === "completed")
    .reduce((sum, p) => sum + Number(p?.amount ?? 0), 0);

  // Apply filters locally (search, dates)
  const filteredPayments = (payments ?? []).filter((p) => {
    const matchesSearch =
      !search.trim() ||
      String(p?.order_id ?? "").includes(search) ||
      (p?.razorpay_payment_id && p.razorpay_payment_id.toLowerCase().includes(search.toLowerCase())) ||
      (p?.razorpay_order_id ?? "").toLowerCase().includes(search.toLowerCase());

    const paymentTime = p?.created_at && !isNaN(new Date(p.created_at).getTime())
      ? new Date(p.created_at).getTime()
      : 0;

    const matchesStart = !startDate || (paymentTime > 0 && paymentTime >= new Date(startDate).getTime());
    // extend end date to end of day
    const matchesEnd = !endDate || (paymentTime > 0 && paymentTime <= new Date(endDate).getTime() + 24 * 60 * 60 * 1000);

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Browser CSV exporter
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      toast.error("No transactions available to export.");
      return;
    }

    const headers = ["Payment ID", "Order ID", "Amount (INR)", "Status", "Razorpay Payment ID", "Checkout Date"];
    const rows = filteredPayments.map((p) => [
      p?.id ?? 0,
      p?.order_id ?? 0,
      p?.amount ?? 0,
      (p?.status ?? "unknown").toUpperCase(),
      p?.razorpay_payment_id || "—",
      p?.created_at && !isNaN(new Date(p.created_at).getTime()) ? new Date(p.created_at).toLocaleString("en-IN") : "—",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `auxin_financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV transactions ledger exported! 📊", {
      style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
    });
  };

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader
          title="Financial Ledger & Payouts"
          subtitle="Audit transaction gates, compute platform payout balances, and reconcile gateway settlement."
        />
        <Button
          variant="outline"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportCSV}
        >
          Export CSV Ledger
        </Button>
      </div>

      {/* Balance overview cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Today's Revenue</p>
            <p className="font-black text-2xl text-[#22C55E]">₹{todayRevenue.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-[#71717A] font-semibold">Processed checkouts</p>
          </div>

          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Weekly Revenue</p>
            <p className="font-black text-2xl text-[#FAFAFA]">₹{weeklyRevenue.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-[#71717A] font-semibold">Last 7 days volume</p>
          </div>

          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Monthly Revenue</p>
            <p className="font-black text-2xl text-[#FAFAFA]">₹{monthlyRevenue.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-[#71717A] font-semibold">Last 30 days volume</p>
          </div>

          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Pending Payouts</p>
            <p className="font-black text-2xl text-[#F59E0B]">₹{pendingPayouts.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-[#71717A] font-semibold">Held in platform escrow</p>
          </div>

          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-2">
            <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Completed Payouts</p>
            <p className="font-black text-2xl text-[#22C55E]">₹{completedPayouts.toLocaleString("en-IN")}</p>
            <p className="text-[10px] text-[#71717A] font-semibold">Settled to local farmers</p>
          </div>
        </div>
      )}

      {/* Advanced ledger filtering */}
      <div className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="search"
              placeholder="Search order ID or Razorpay payment reference..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Date range selection */}
          <div className="flex gap-2 items-center col-span-2">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs w-full focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <span className="text-xs text-[#71717A] font-bold">to</span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs w-full focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            {(startDate || endDate) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-[#EF4444]"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-row p-1 rounded-xl flex gap-1 bg-[#111113] border border-[#1F1F23] w-max">
        {(["all", "created", "paid", "failed", "refunded"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === tab
                ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Transaction Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : filteredPayments.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-7 h-7 text-[#71717A]" />}
          title="No transaction records match filters"
          description="Try selecting a different status tab or adjusting date filters."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#1F1F23] bg-[#111113] shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1F1F23] text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Transaction ID</th>
                <th className="p-4">Linked Order</th>
                <th className="p-4">Gross Amount</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4">Razorpay Reference</th>
                <th className="p-4">Escrow Status</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4 pr-6">Processing Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {(filteredPayments ?? []).map((p) => {
                const linkedOrder = ordersMap[p?.order_id ?? 0];
                const isSettled = linkedOrder?.status === "completed";
                const method = p?.razorpay_payment_id ? "Razorpay Gateway (UPI/Card)" : "Digital Wallet / UPI";

                const dateText = p?.created_at && !isNaN(new Date(p.created_at).getTime())
                  ? new Date(p.created_at).toLocaleString("en-IN")
                  : "—";

                return (
                  <tr key={p?.id ?? 0} className="hover:bg-[#161618] transition-colors">
                    <td className="p-4 pl-6 font-mono text-[#FAFAFA] font-semibold">#TXN-{p?.id ?? 0}</td>
                    <td className="p-4 font-mono font-bold text-[#22C55E]">#AUX-{p?.order_id ?? 0}</td>
                    <td className="p-4 font-mono font-black text-[#FAFAFA]">₹{(p?.amount ?? 0).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-[#A1A1AA] font-semibold">{method}</td>
                    <td className="p-4 font-mono text-xs text-[#71717A]">{p?.razorpay_payment_id || "—"}</td>
                    <td className="p-4">
                      {p?.status === "paid" ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                          isSettled
                            ? "bg-emerald-950/20 border-emerald-900/30 text-[#22C55E]"
                            : "bg-amber-950/20 border-amber-900/30 text-[#F59E0B]"
                        }`}>
                          {isSettled ? "Released (Settled)" : "Held in Escrow"}
                        </span>
                      ) : (
                        <span className="text-xs text-[#71717A] font-semibold">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge label={p?.status} dot />
                    </td>
                    <td className="p-4 pr-6 text-[#71717A] text-xs font-semibold">
                      {dateText}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#1F1F23] pt-4">
          <p className="text-xs text-[#71717A]">
            Showing Page {page} of {totalPages} · {paymentsData?.total ?? 0} transactions
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="xs"
              iconRight={<ChevronRight className="w-3.5 h-3.5" />}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
