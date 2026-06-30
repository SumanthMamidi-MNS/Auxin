"use client";
/**
 * app/(admin)/orders/page.tsx — Auxin Admin v2.0
 * Order management table with status tabs, search, and pagination.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/admin";
import { Badge, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Order, PaginatedResponse, OrderStatus } from "@/types";

/* ── Status tab config ──────────────────────────────────────────────────── */
const STATUS_TABS = ["All", "Pending", "Accepted", "Completed", "Cancelled", "Rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const statusParam =
    activeTab === "All" ? undefined : (activeTab.toLowerCase() as OrderStatus);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders", statusParam, page],
    queryFn: () =>
      adminApi.listOrders({ status: statusParam, page }).then((r) => r.data),
    staleTime: 20_000,
  });

  const orders = data?.items ?? [];

  /* Client-side search filter */
  const filtered = search.trim()
    ? orders.filter(
        (o) =>
          String(o.id).includes(search) ||
          o.farmer_name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Order Management"
        subtitle={`${data?.total ?? 0} total orders`}
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        {/* Status tabs */}
        <div
          className="tab-row p-1 rounded-xl"
          style={{ background: "#18181B", border: "1px solid #27272A" }}
        >
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap"
              style={
                activeTab === tab
                  ? { background: "#22C55E", color: "#052E16" }
                  : { color: "#71717A" }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="search"
            placeholder="Search order # or farmer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border border-[#27272A] bg-[#18181B] text-[#F4F4F5] text-sm placeholder:text-[#52525B] w-64 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-[#EF4444] text-sm">
          Failed to load orders. Please try again.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="w-7 h-7" />}
          title="No orders found"
          description={
            search ? "No orders match your search." : "No orders in this status."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer ID</th>
                <th>Farmer</th>
                <th>Amount</th>
                <th>Items</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono font-bold text-[#22C55E]">
                      #{String(order.id).padStart(5, "0")}
                    </span>
                  </td>
                  <td className="text-[#A1A1AA]">
                    <span className="font-mono text-xs">
                      #{order.customer_id}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium text-[#F4F4F5]">
                      {order.farmer_name ?? `Farmer #${order.farmer_id}`}
                    </span>
                  </td>
                  <td>
                    <span className="font-semibold text-[#F4F4F5]">
                      ₹{Number(order.total_amount ?? 0).toLocaleString("en-IN")}
                    </span>
                  </td>
                  <td className="text-[#A1A1AA]">
                    {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                  </td>
                  <td className="text-[#71717A]">
                    {new Date(order.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>
                  <td>
                    <Badge label={order.status} dot />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (data?.total_pages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#71717A]">
            Page {page} of {data?.total_pages} · {data?.total ?? 0} orders
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
              disabled={page >= (data?.total_pages ?? 1)}
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
