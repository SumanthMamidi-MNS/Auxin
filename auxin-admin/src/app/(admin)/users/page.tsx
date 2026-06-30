"use client";
/**
 * app/(admin)/users/page.tsx — Auxin Admin v2.0
 * Premium user management with role tabs, search, suspend/reinstate actions.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { User, PaginatedResponse } from "@/types";

/* ── Role tab config ────────────────────────────────────────────────────── */
const ROLE_TABS = ["All", "Customer", "Farmer", "Delivery"] as const;
type RoleTab = (typeof ROLE_TABS)[number];

/* ── Suspend dialog inline ──────────────────────────────────────────────── */
function SuspendInline({
  userId,
  onDone,
}: {
  userId: number;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => adminApi.suspendUser(userId, reason),
    onSuccess: () => {
      toast.success("User suspended");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      onDone();
    },
    onError: () => toast.error("Failed to suspend user"),
  });

  return (
    <div
      className="flex items-center gap-2 mt-2 p-3 rounded-xl border border-[#27272A] animate-slide-down"
      style={{ background: "rgba(239,68,68,0.04)" }}
    >
      <input
        type="text"
        placeholder="Reason for suspension…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="flex-1 h-8 px-3 rounded-lg text-sm bg-[#18181B] border border-[#27272A] text-[#F4F4F5] placeholder:text-[#52525B] focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/30"
      />
      <Button
        variant="danger"
        size="xs"
        loading={isPending}
        disabled={!reason.trim()}
        onClick={() => mutate()}
      >
        Confirm
      </Button>
      <Button variant="ghost" size="xs" onClick={onDone}>
        Cancel
      </Button>
    </div>
  );
}

/* ── User row ───────────────────────────────────────────────────────────── */
function UserRow({ user }: { user: User }) {
  const [showSuspend, setShowSuspend] = useState(false);
  const qc = useQueryClient();

  const reinstateMutation = useMutation({
    mutationFn: () => adminApi.reinstateUser(user.id),
    onSuccess: () => {
      toast.success("User reinstated");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => toast.error("Failed to reinstate user"),
  });

  const isSuspended = user.status === "suspended";

  return (
    <>
      <tr>
        <td>
          <div className="flex flex-col">
            <span className="font-semibold text-[#F4F4F5]">{user.name}</span>
            {user.email && (
              <span className="text-xs text-[#71717A] mt-0.5">{user.email}</span>
            )}
          </div>
        </td>
        <td className="text-[#A1A1AA]">{user.phone}</td>
        <td>
          <Badge label={user.role} />
        </td>
        <td>
          <Badge label={user.status} dot />
        </td>
        <td className="text-[#71717A]">
          {new Date(user.created_at).toLocaleDateString("en-IN", {
            day: "2-digit", month: "short", year: "numeric",
          })}
        </td>
        <td>
          <div className="flex items-center gap-2">
            {isSuspended ? (
              <Button
                variant="secondary"
                size="xs"
                loading={reinstateMutation.isPending}
                onClick={() => reinstateMutation.mutate()}
              >
                Reinstate
              </Button>
            ) : (
              <Button
                variant="danger"
                size="xs"
                onClick={() => setShowSuspend((v) => !v)}
              >
                Suspend
              </Button>
            )}
          </div>
        </td>
      </tr>
      {showSuspend && (
        <tr>
          <td colSpan={6} className="!py-0 !px-5">
            <SuspendInline userId={user.id} onDone={() => setShowSuspend(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<RoleTab>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const roleParam = activeTab === "All" ? undefined : activeTab.toLowerCase();

  const { data, isLoading, isError } = useQuery<PaginatedResponse<User>>({
    queryKey: ["admin-users", roleParam, page],
    queryFn: () =>
      adminApi.listUsers({ role: roleParam, page, page_size: 30 }).then((r) => r.data),
    staleTime: 20_000,
  });

  const users = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  /* Client-side search filter */
  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.phone.includes(search)
      )
    : users;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="User Management"
        subtitle={`${data?.total ?? 0} total users across all roles`}
      />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        {/* Role tabs */}
        <div
          className="tab-row p-1 rounded-xl"
          style={{ background: "#18181B", border: "1px solid #27272A" }}
        >
          {ROLE_TABS.map((tab) => (
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

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="search"
            placeholder="Search name or phone…"
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
        <Card>
          <p className="text-center text-[#EF4444] py-10 text-sm">
            Failed to load users. Please try again.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No users found"
          description={search ? "Try a different search term." : "No users in this role category."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow key={u.id} user={u} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#71717A]">
            Page {page} of {totalPages} · {data?.total ?? 0} users
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
