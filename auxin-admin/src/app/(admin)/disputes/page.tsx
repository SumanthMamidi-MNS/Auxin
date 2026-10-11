"use client";
/**
 * app/(admin)/disputes/page.tsx — Auxin Admin v2.0
 * Premium Dispute resolution with status tabs, per-card inline resolve form.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldAlert, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, RefreshCw, MessageSquare,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Dispute, PaginatedResponse, DisputeStatus } from "@/types";

/* ── Status tabs ────────────────────────────────────────────────────────── */
const STATUS_TABS = ["Open", "In Review", "Resolved", "Rejected", "All"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const TAB_TO_STATUS: Record<StatusTab, DisputeStatus | undefined> = {
  "Open":      "open",
  "In Review": "in_review",
  "Resolved":  "resolved",
  "Rejected":  "rejected",
  "All":       undefined,
};

/* ── Dispute card with inline resolve form ──────────────────────────────── */
function DisputeCard({ dispute }: { dispute: Dispute }) {
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [triggerRefund, setTriggerRefund] = useState(false);
  const [action, setAction] = useState<"resolved" | "rejected">("resolved");
  const qc = useQueryClient();

  const resolveMutation = useMutation({
    mutationFn: () =>
      adminApi.resolveDispute(dispute?.id ?? 0, {
        new_status: action,
        resolution_note: note,
        trigger_refund: triggerRefund,
      }),
    onSuccess: () => {
      toast.success(`Dispute #${dispute?.id ?? 0} ${action}`);
      setResolveOpen(false);
      setNote("");
      setTriggerRefund(false);
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to update dispute"),
  });

  const canResolve = dispute?.status === "open" || dispute?.status === "in_review";
  const isResolved = dispute?.status === "resolved" || dispute?.status === "rejected";

  const dateSubmitted = dispute?.created_at && !isNaN(new Date(dispute.created_at).getTime())
    ? new Date(dispute.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const showUpdated = dispute?.updated_at && dispute.updated_at !== dispute.created_at && !isNaN(new Date(dispute.updated_at).getTime());
  const dateUpdated = showUpdated
    ? new Date(dispute.updated_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short",
      })
    : "—";

  return (
    <Card className="animate-slide-up">
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-950/10 border border-red-900/10"
          >
            <ShieldAlert className="w-4 h-4 text-[var(--danger)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              Dispute #{dispute?.id ?? 0}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              Order #{dispute?.order_id ?? 0} · Customer #{dispute?.raised_by ?? 0}
            </p>
          </div>
        </div>
        <Badge label={dispute?.status} dot />
      </div>

      {/* Reason */}
      <div
        className="p-3 rounded-xl mb-3 text-sm text-[var(--text-secondary)] leading-relaxed bg-white/[0.02] border border-[var(--border-2)]"
      >
        <p className="text-xs font-semibold text-[var(--text-placeholder)] uppercase tracking-wider mb-1.5">
          Reason
        </p>
        {dispute?.reason || "No reason provided."}
      </div>

      {/* Resolution note (if already resolved) */}
      {dispute?.resolution_note && (
        <div
          className="p-3 rounded-xl mb-3 text-sm text-[var(--text-secondary)] bg-emerald-950/5 border border-emerald-900/15"
        >
          <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider mb-1.5">
            Resolution Note
          </p>
          {dispute.resolution_note}
        </div>
      )}

      {/* Timestamps */}
      <p className="text-xs text-[var(--text-placeholder)] mb-3">
        Opened {dateSubmitted}
        {showUpdated && (
          <>
            {" · Updated "}
            {dateUpdated}
          </>
        )}
      </p>

      {/* Actions */}
      {canResolve && !resolveOpen && (
        <Button
          variant="secondary"
          size="sm"
          icon={<MessageSquare className="w-4 h-4" />}
          onClick={() => setResolveOpen(true)}
        >
          Resolve Dispute
        </Button>
      )}

      {/* Inline resolve form */}
      {resolveOpen && (
        <div
          className="mt-2 p-4 rounded-xl border border-[var(--border-2)] bg-white/[0.01] space-y-3 animate-slide-down"
        >
          {/* Action selector */}
          <div className="flex gap-2">
            {(["resolved", "rejected"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-150"
                style={
                  action === a
                    ? action === "resolved"
                      ? { background: "rgba(34,197,94,0.2)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.4)" }
                      : { background: "rgba(239,68,68,0.2)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.4)" }
                    : { background: "transparent", color: "#71717A", border: "1px solid #27272A" }
                }
              >
                {a === "resolved" ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Resolution note textarea */}
          <textarea
            rows={3}
            placeholder="Add a resolution note…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-[#18181B] border border-[#27272A] text-[#F4F4F5] placeholder:text-[#52525B] resize-none focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all"
          />

          {/* Refund checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={triggerRefund}
                onChange={(e) => setTriggerRefund(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded-md border transition-all duration-150 flex items-center justify-center"
                style={{
                  background: triggerRefund ? "#22C55E" : "transparent",
                  border: triggerRefund ? "1px solid #22C55E" : "1px solid #3F3F46",
                }}
              >
                {triggerRefund && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#052E16]" />
                )}
              </div>
            </div>
            <span className="text-sm text-[#A1A1AA] group-hover:text-[#F4F4F5] transition-colors">
              Trigger refund to customer
            </span>
          </label>

          {/* Submit row */}
          <div className="flex gap-2 pt-1">
            <Button
              variant={action === "resolved" ? "primary" : "danger"}
              size="sm"
              loading={resolveMutation.isPending}
              disabled={!note.trim()}
              onClick={() => {
                if (dispute?.id !== undefined) resolveMutation.mutate();
              }}
              fullWidth
            >
              Submit {action === "resolved" ? "Resolution" : "Rejection"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setResolveOpen(false);
                setNote("");
                setTriggerRefund(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isResolved && !resolveOpen && (
        <div className="flex items-center gap-2 text-xs text-[#52525B]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          This dispute has been {dispute?.status}.
        </div>
      )}
    </Card>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function DisputesPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("Open");
  const [page, setPage] = useState(1);

  const statusParam = TAB_TO_STATUS[activeTab];

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Dispute>>({
    queryKey: ["admin-disputes", statusParam, page],
    queryFn: () =>
      adminApi.listDisputes({ status: statusParam, page }).then((r) => r.data),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const disputes = data?.items ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Dispute Resolution"
        subtitle={`${data?.total ?? 0} disputes · select one to resolve`}
        action={
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", color: "#22C55E" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
            Live
          </div>
        }
      />

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

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-[#EF4444] text-sm">
          Failed to load disputes.
        </div>
      ) : disputes.length === 0 ? (
        <EmptyState
          icon={
            activeTab === "Open"
              ? <CheckCircle2 className="w-7 h-7" />
              : <ShieldAlert className="w-7 h-7" />
          }
          title={activeTab === "Open" ? "No open disputes" : "No disputes found"}
          description={
            activeTab === "Open"
              ? "All disputes have been resolved."
              : "No disputes in this status category."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(disputes ?? []).map((d) => (
            <DisputeCard key={d?.id ?? 0} dispute={d} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (data?.total_pages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#71717A]">
            Page {page} of {data?.total_pages} · {data?.total ?? 0} disputes
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
