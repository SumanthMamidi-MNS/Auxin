"use client";
/**
 * app/(admin)/deliveries/page.tsx — Auxin Admin v2.0
 * Delivery tracking table with Active/All filter tabs.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { adminApi } from "@/lib/admin";
import { Badge, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Delivery, PaginatedResponse, DeliveryStatus } from "@/types";

/* ── Tab config ─────────────────────────────────────────────────────────── */
const DELIVERY_TABS = ["Active", "All"] as const;
type DeliveryTab = (typeof DELIVERY_TABS)[number];

const ACTIVE_STATUSES: DeliveryStatus[] = ["assigned", "picked_up", "out_for_delivery"];

/* ── Format datetime helper ─────────────────────────────────────────────── */
function fmtDate(val?: string | null): string {
  if (!val) return "—";
  return new Date(val).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── ETA cell with urgency coloring ────────────────────────────────────── */
function EtaCell({ eta }: { eta?: string | null }) {
  if (!eta) return <span className="text-[#52525B]">—</span>;

  const etaDate = new Date(eta);
  const now = new Date();
  const diffHrs = (etaDate.getTime() - now.getTime()) / 3_600_000;
  const isOverdue = diffHrs < 0;
  const isUrgent = diffHrs >= 0 && diffHrs < 2;

  const color = isOverdue ? "#EF4444" : isUrgent ? "#F59E0B" : "#A1A1AA";

  return (
    <span className="flex items-center gap-1" style={{ color }}>
      <Clock className="w-3 h-3" />
      {fmtDate(eta)}
    </span>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function DeliveriesPage() {
  const [activeTab, setActiveTab] = useState<DeliveryTab>("Active");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Delivery>>({
    queryKey: ["admin-deliveries", activeTab, page],
    queryFn: () =>
      adminApi.listDeliveries({ page }).then((r) => r.data as PaginatedResponse<Delivery>),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const allDeliveries = data?.items ?? [];

  /* Client-side active filter */
  const deliveries =
    activeTab === "Active"
      ? (allDeliveries ?? []).filter((d) => d && d.status && ACTIVE_STATUSES.includes(d.status))
      : (allDeliveries ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <SectionHeader
          title="Delivery Tracking"
          subtitle={`${data?.total ?? 0} total deliveries · auto-refreshes every 30s`}
        />
        {/* Live badge */}
        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
          Live
        </div>
      </div>

      {/* Tab filter */}
      <div
        className="tab-row p-1 rounded-xl w-fit"
        style={{ background: "#18181B", border: "1px solid #27272A" }}
      >
        {DELIVERY_TABS.map((tab) => (
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
            {tab === "Active" && (
              <span
                className="ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={
                  activeTab === "Active"
                    ? { background: "rgba(5,46,22,0.4)", color: "#052E16" }
                    : { background: "rgba(34,197,94,0.12)", color: "#22C55E" }
                }
              >
                {(allDeliveries ?? []).filter((d) => d && d.status && ACTIVE_STATUSES.includes(d.status)).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-[#EF4444] text-sm">
          Failed to load deliveries.
        </div>
      ) : deliveries.length === 0 ? (
        <EmptyState
          icon={
            activeTab === "Active"
              ? <CheckCircle2 className="w-7 h-7" />
              : <Truck className="w-7 h-7" />
          }
          title={activeTab === "Active" ? "No active deliveries" : "No deliveries found"}
          description={
            activeTab === "Active"
              ? "All current deliveries are completed."
              : "No delivery records available."
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery #</th>
                <th>Order #</th>
                <th>Partner ID</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Delivered At</th>
              </tr>
            </thead>
            <tbody>
              {(deliveries ?? []).map((d) => (
                <tr key={d?.id ?? 0}>
                  <td>
                    <span className="font-mono font-bold text-[#22C55E]">
                      #{String(d?.id ?? 0).padStart(5, "0")}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-[#A1A1AA]">
                      #{String(d?.order_id ?? 0).padStart(5, "0")}
                    </span>
                  </td>
                  <td className="text-[#A1A1AA]">
                    <span className="font-mono text-xs">#{d?.partner_id ?? 0}</span>
                  </td>
                  <td>
                    <Badge label={d?.status} dot />
                  </td>
                  <td>
                    <EtaCell eta={d?.estimated_delivery} />
                  </td>
                  <td className="text-[#71717A]">
                    {d?.actual_delivery ? (
                      <span className="flex items-center gap-1 text-[#22C55E]">
                        <CheckCircle2 className="w-3 h-3" />
                        {fmtDate(d.actual_delivery)}
                      </span>
                    ) : (
                      <span className="text-[#52525B]">Pending</span>
                    )}
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
            Page {page} of {data?.total_pages} · {data?.total ?? 0} deliveries
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
