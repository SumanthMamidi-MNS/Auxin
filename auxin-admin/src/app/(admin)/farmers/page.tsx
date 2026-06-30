"use client";
/**
 * app/(admin)/farmers/page.tsx — Auxin Admin v2.0
 * Farmer management: pending approval cards + all farmers searchable table.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, MapPin, CreditCard, Clock, Users,
  CheckCircle2, XCircle, Leaf,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import {
  Badge, Card, SectionHeader, Spinner, EmptyState,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Farmer, PaginatedResponse } from "@/types";

/* ── Pending farmer card ────────────────────────────────────────────────── */
function PendingFarmerCard({ farmer }: { farmer: Farmer }) {
  const qc = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approveFarmer(farmer.id),
    onSuccess: () => {
      toast.success(`${farmer?.full_name ?? "Farmer"} approved`);
      qc.invalidateQueries({ queryKey: ["admin-farmers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-farmers-all"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to approve farmer"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.rejectFarmer(farmer.id),
    onSuccess: () => {
      toast.success(`${farmer?.full_name ?? "Farmer"} rejected`);
      qc.invalidateQueries({ queryKey: ["admin-farmers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to reject farmer"),
  });

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Card hover className="animate-slide-up">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
          >
            {(farmer?.full_name ?? "F").charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-[#F4F4F5] text-sm">{farmer?.full_name ?? "Farmer"}</p>
            <p className="text-xs text-[#71717A]">{farmer.phone}</p>
          </div>
        </div>
        <Badge label="pending" dot />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
          <MapPin className="w-3.5 h-3.5 text-[#52525B] flex-shrink-0" />
          <span className="line-clamp-1">{farmer.location || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
          <CreditCard className="w-3.5 h-3.5 text-[#52525B] flex-shrink-0" />
          <span className="font-mono tracking-wide">{farmer.ifsc_code || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#71717A]">
          <Clock className="w-3.5 h-3.5 text-[#52525B] flex-shrink-0" />
          Applied{" "}
          {new Date(farmer.created_at).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant="primary"
          size="sm"
          fullWidth
          icon={<CheckCircle2 className="w-4 h-4" />}
          loading={approveMutation.isPending}
          disabled={isPending}
          onClick={() => approveMutation.mutate()}
        >
          Approve
        </Button>
        <Button
          variant="danger"
          size="sm"
          fullWidth
          icon={<XCircle className="w-4 h-4" />}
          loading={rejectMutation.isPending}
          disabled={isPending}
          onClick={() => rejectMutation.mutate()}
        >
          Reject
        </Button>
      </div>
    </Card>
  );
}

/* ── All Farmers table row ──────────────────────────────────────────────── */
function FarmerTableRow({ farmer }: { farmer: Farmer }) {
  const statusLabel = farmer.is_approved ? "approved" : "pending";
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
          >
            {(farmer?.full_name ?? "F").charAt(0).toUpperCase()}
          </div>
          <span className="font-semibold text-[#F4F4F5]">{farmer?.full_name ?? "Farmer"}</span>
        </div>
      </td>
      <td className="text-[#A1A1AA]">{farmer.phone}</td>
      <td className="text-[#A1A1AA]">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#52525B]" />
          {farmer.location || "—"}
        </span>
      </td>
      <td className="font-mono text-xs text-[#71717A]">{farmer.ifsc_code || "—"}</td>
      <td>
        <Badge label={statusLabel} dot />
      </td>
      <td className="text-[#71717A]">
        {new Date(farmer.created_at).toLocaleDateString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
        })}
      </td>
    </tr>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function FarmersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* Pending farmers */
  const { data: pendingData, isLoading: pendingLoading } = useQuery<PaginatedResponse<Farmer>>({
    queryKey: ["admin-farmers-pending"],
    queryFn: () => adminApi.pendingFarmers({ page: 1 }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  /* All farmers */
  const { data: allData, isLoading: allLoading } = useQuery<PaginatedResponse<Farmer>>({
    queryKey: ["admin-farmers-all", page],
    queryFn: () =>
      adminApi.listUsers({ role: "farmer", page, page_size: 30 }).then((r) => ({
        items: (r.data.items as unknown as Farmer[]),
        total: r.data.total,
        page: r.data.page,
        page_size: r.data.page_size,
        total_pages: r.data.total_pages,
      })),
    staleTime: 20_000,
  });

  const pendingFarmers = pendingData?.items ?? [];
  const allFarmers = (allData?.items ?? []) as unknown as Farmer[];

  /* Client-side search on all farmers */
  const filteredAll = search.trim()
    ? allFarmers.filter(
        (f) =>
          f.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          f.phone?.includes(search) ||
          f.location?.toLowerCase().includes(search.toLowerCase())
      )
    : allFarmers;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Pending Approval ─────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Pending Approval"
          subtitle={`${pendingFarmers.length} farmer${pendingFarmers.length !== 1 ? "s" : ""} awaiting review`}
          action={
            pendingFarmers.length > 0 ? (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}
              >
                {pendingFarmers.length} pending
              </span>
            ) : undefined
          }
        />

        {pendingLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : pendingFarmers.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-7 h-7" />}
            title="No pending farmers"
            description="All farmer applications have been reviewed."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pendingFarmers.map((f) => (
              <PendingFarmerCard key={f.id} farmer={f} />
            ))}
          </div>
        )}
      </section>

      {/* ── All Farmers table ────────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-[#F4F4F5]">All Farmers</h2>
            <p className="text-xs text-[#71717A] mt-0.5">
              {allData?.total ?? 0} registered farmers
            </p>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
            <input
              type="search"
              placeholder="Search farmers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl border border-[#27272A] bg-[#18181B] text-[#F4F4F5] text-sm placeholder:text-[#52525B] w-64 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all"
            />
          </div>
        </div>

        {allLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : filteredAll.length === 0 ? (
          <EmptyState
            icon={<Leaf className="w-7 h-7" />}
            title="No farmers found"
            description={search ? "Try a different search term." : "No farmers registered yet."}
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>IFSC Code</th>
                  <th>Status</th>
                  <th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {filteredAll.map((f) => (
                  <FarmerTableRow key={f.id} farmer={f} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!allLoading && (allData?.total_pages ?? 1) > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-[#71717A]">
              Page {page} of {allData?.total_pages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= (allData?.total_pages ?? 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
