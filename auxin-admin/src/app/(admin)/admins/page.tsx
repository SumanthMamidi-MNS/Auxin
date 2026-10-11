"use client";
/**
 * app/(admin)/admins/page.tsx — Auxin Admin v2.0
 * Premium Admin management workspace and Enterprise Activity Audit Trail.
 * Keeps all list queries, action logs, create, enable, disable, and delete mutations fully intact.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Shield, Trash2, Eye, UserCheck, UserX, X,
  Calendar, Mail, Phone, Plus, AlertTriangle, Filter,
  Clock, ArrowUpDown, ShieldAlert, Award, Activity, Lock, Users, ChevronLeft, ChevronRight, Key, ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { useAuthStore } from "@/store/authStore";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { User, AdminRole, AdminActivityLog, PaginatedResponse } from "@/types";

export default function AdminsPage() {
  const { user: currentUser } = useAuthStore();
  const isCurrentUserSuper = currentUser?.is_super_admin;

  // Main navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<"list" | "activity">(
    isCurrentUserSuper ? "list" : "activity"
  );

  // Admins List state
  const [search, setSearch] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [pendingAdminId, setPendingAdminId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedAdmin) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedAdmin(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedAdmin]);

  // Create admin form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Activity Log Filters state
  const [activitySearch, setActivitySearch] = useState("");
  const [activityAdminId, setActivityAdminId] = useState<number | undefined>(undefined);
  const [activityActionType, setActivityActionType] = useState<string | undefined>(undefined);
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [activityOrder, setActivityOrder] = useState<"desc" | "asc">("desc");
  const [activityPage, setActivityPage] = useState(1);

  const qc = useQueryClient();

  // 1. Fetch Admins list (Only enabled for Super Admin)
  const { data: adminsData, isLoading: isAdminsLoading } = useQuery({
    queryKey: ["admin-admins-list"],
    queryFn: () => adminApi.listAdmins().then((r) => r.data),
    enabled: !!isCurrentUserSuper,
  });

  const admins = adminsData?.items ?? [];

  // 2. Fetch Activity Logs
  const { data: logsData, isLoading: isLogsLoading } = useQuery({
    queryKey: [
      "admin-activity-logs",
      activityAdminId,
      activityActionType,
      activityStartDate,
      activityEndDate,
      activitySearch,
      activityOrder,
      activityPage,
    ],
    queryFn: () => {
      if (isCurrentUserSuper) {
        return adminApi
          .listActivityLogs({
            admin_id: activityAdminId || undefined,
            action_type: activityActionType || undefined,
            start_date: activityStartDate || undefined,
            end_date: activityEndDate || undefined,
            search: activitySearch || undefined,
            order: activityOrder,
            page: activityPage,
            page_size: 15,
          })
          .then((r) => r.data);
      } else {
        return adminApi
          .listMyActivityLogs({
            order: activityOrder,
            page: activityPage,
            page_size: 15,
          })
          .then((r) => r.data);
      }
    },
    staleTime: 10_000,
  });

  // 3. Fetch specific admin logs for detail view
  const { data: selectedAdminLogs, isLoading: isSelectedAdminLogsLoading } = useQuery({
    queryKey: ["admin-details-logs-drawer", selectedAdmin?.id],
    queryFn: () => {
      if (!selectedAdmin) return null;
      return adminApi
        .listActivityLogs({ admin_id: selectedAdmin.id, page_size: 5 })
        .then((r) => r.data);
    },
    enabled: !!selectedAdmin,
  });

  // 4. Mutations
  const createAdminMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password?: string; phone?: string }) =>
      adminApi.createAdmin(payload),
    onSuccess: () => {
      toast.success("Admin created successfully! 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-admins-list"] });
      setIsCreateOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
    },
    onError: (err: any) => {
      const errMsg = err?.response?.data?.detail || "Failed to create admin";
      toast.error(errMsg);
    },
  });

  const disableAdminMutation = useMutation({
    mutationFn: (id: number) => {
      setPendingAdminId(id);
      return adminApi.disableAdmin(id);
    },
    onSuccess: () => {
      toast.success("Admin account disabled 🔴", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-admins-list"] });
      if (selectedAdmin) {
        setSelectedAdmin((prev) => prev ? { ...prev, status: "suspended" } : null);
      }
    },
    onError: () => toast.error("Failed to disable admin"),
    onSettled: () => setPendingAdminId(null),
  });

  const activateAdminMutation = useMutation({
    mutationFn: (id: number) => {
      setPendingAdminId(id);
      return adminApi.activateAdmin(id);
    },
    onSuccess: () => {
      toast.success("Admin account activated 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-admins-list"] });
      if (selectedAdmin) {
        setSelectedAdmin((prev) => prev ? { ...prev, status: "approved" } : null);
      }
    },
    onError: () => toast.error("Failed to activate admin"),
    onSettled: () => setPendingAdminId(null),
  });

  const removeAdminMutation = useMutation({
    mutationFn: (id: number) => adminApi.removeAdmin(id),
    onSuccess: () => {
      toast.success("Admin permanently removed 🗑️", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-admins-list"] });
      setConfirmDeleteId(null);
      setSelectedAdmin(null);
    },
    onError: () => toast.error("Failed to remove admin"),
  });

  // Filtered list
  const filteredAdmins = (admins ?? []).filter((admin) => {
    const term = search.toLowerCase();
    return (
      (admin?.name ?? "").toLowerCase().includes(term) ||
      (admin?.email && admin.email.toLowerCase().includes(term))
    );
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill out all required fields.");
      return;
    }
    createAdminMutation.mutate({ name, email, password, phone });
  };

  const getActionBadgeClass = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("approve") || act.includes("activate") || act.includes("reinstate")) {
      return "bg-emerald-950/20 text-[#22C55E] border-emerald-900/30";
    }
    if (act.includes("reject") || act.includes("disable") || act.includes("remove") || act.includes("suspend")) {
      return "bg-red-950/20 text-[#EF4444] border-red-900/30";
    }
    return "bg-blue-950/20 text-[#3B82F6] border-blue-900/30";
  };

  const formatActionName = (action: string) => {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  /** Returns a clear human-readable sentence for a log entry */
  const getActionDescription = (log: any) => {
    const action = log?.action_type || log?.action || "";
    const name = log?.target_name || "";
    const targetId = log?.target_id;
    const target = name ? `"${name}" (ID #${targetId})` : (targetId ? `account #${targetId}` : "an account");
    const remarksText = log?.remarks ? ` (Reason: ${log.remarks})` : "";

    const map: Record<string, string> = {
      activate_admin:    `Activated administrator account ${target}`,
      disable_admin:     `Disabled administrator account ${target}`,
      create_admin:      `Created new administrator account ${target}`,
      delete_admin:      `Permanently deleted administrator account ${target}`,
      approve_farmer:    `Approved Farmer profile of ${target}`,
      reject_farmer:     `Rejected Farmer profile of ${target}${remarksText}`,
      approve_delivery:  `Approved Courier driver account of ${target}`,
      reject_delivery:   `Rejected Courier driver profile of ${target}${remarksText}`,
      suspend_user:      `Suspended client user account ${target}${remarksText}`,
      reinstate_user:    `Reinstated suspended client account ${target}`,
      update_product:    `Updated inventory details of crop ${target}`,
      delete_product:    `Deleted crop catalog item ${target}`,
    };
    return map[action] ?? `${formatActionName(action)}: ${target}${remarksText}`;
  };

  const activityLogs = logsData?.items ?? [];
  const logsTotalPages = logsData?.total_pages ?? 1;

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B] animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <SectionHeader
          title={isCurrentUserSuper ? "Platform Administrators & Audits" : "My Administrative logs"}
          subtitle={
            isCurrentUserSuper
              ? "Manage administrator accounts, roles, and audit security events trail."
              : "Audit trail of your actions and checkouts verifications."
          }
        />
        {isCurrentUserSuper && activeMainTab === "list" && (
          <Button
            variant="outline"
            icon={<Plus className="w-4 h-4 text-[#22C55E]" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Create Administrator
          </Button>
        )}
      </div>

      {/* Main workspace tabs */}
      {isCurrentUserSuper && (
        <div className="tab-row p-1 rounded-xl flex gap-1 bg-[#111113] border border-[#1F1F23] w-max">
          <button
            onClick={() => setActiveMainTab("list")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeMainTab === "list"
                ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Users className="w-4 h-4" /> Admins List
          </button>
          <button
            onClick={() => setActiveMainTab("activity")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeMainTab === "activity"
                ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Activity className="w-4 h-4" /> System Audit Trail
          </button>
        </div>
      )}

      {/* ── SECTION A: ADMINS LIST ────────────────────────────────────────────── */}
      {activeMainTab === "list" && isCurrentUserSuper && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="search"
                placeholder="Search administrators by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#111113] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>

          {isAdminsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : filteredAdmins.length === 0 ? (
            <EmptyState
              icon={<UserCogIcon className="w-7 h-7 text-[#71717A]" />}
              title="No administrators found"
              description="Try adjusting search parameters or create a new account."
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#1F1F23] bg-[#111113] shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6">Administrator Name</th>
                    <th className="p-4">Contact Phone</th>
                    <th className="p-4">Authorization Role</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F23]">
                  {(filteredAdmins ?? []).map((admin) => {
                    const isSuperBadge = admin?.is_super_admin;
                    const isCurrentUser = admin?.id === currentUser?.id;
                    const isSuspended = admin?.status === "suspended";

                    const adminDateSubmitted = admin?.created_at && !isNaN(new Date(admin.created_at).getTime())
                      ? new Date(admin.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";

                    const safeId = admin?.id ?? 0;

                    return (
                      <tr
                        key={safeId}
                        className="hover:bg-[#161618] transition-colors cursor-pointer"
                        onClick={() => setSelectedAdmin(admin)}
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#A855F7]/20 to-[#3B82F6]/20 flex items-center justify-center text-[#A855F7] font-bold border border-[#A855F7]/10">
                              {(admin?.name || "A").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-[#FAFAFA]">{admin?.name ?? "—"}</span>
                              <span className="text-xs text-[#71717A]">{admin?.email ?? ""}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[#A1A1AA]">{admin?.phone || "—"}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Badge label={admin?.role ?? (admin?.is_super_admin ? "super_admin" : "admin")} />
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge label={admin?.status === "approved" ? "active" : "inactive"} dot />
                        </td>
                        <td className="p-4 text-[#71717A] text-xs">
                          {adminDateSubmitted}
                        </td>
                        <td className="p-4 pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => setSelectedAdmin(admin)}
                            >
                              View
                            </Button>
                            {!isCurrentUser && (
                              <>
                                {isSuspended ? (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    className="border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                                    loading={activateAdminMutation.isPending && pendingAdminId === admin.id}
                                    onClick={() => {
                                      if (admin?.id !== undefined) activateAdminMutation.mutate(admin.id);
                                    }}
                                  >
                                    Enable
                                  </Button>
                                ) : (
                                  <Button
                                    variant="danger"
                                    size="xs"
                                    className="bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                                    loading={disableAdminMutation.isPending && pendingAdminId === admin.id}
                                    onClick={() => {
                                      if (admin?.id !== undefined) disableAdminMutation.mutate(admin.id);
                                    }}
                                  >
                                    Disable
                                  </Button>
                                )}
                                <Button
                                  variant="danger"
                                  size="xs"
                                  icon={<Trash2 className="w-3.5 h-3.5" />}
                                  onClick={() => {
                                    if (admin?.id !== undefined) setConfirmDeleteId(admin.id);
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION B: SYSTEM AUDIT TRAIL ─────────────────────────────────────── */}
      {activeMainTab === "activity" && (
        <div className="space-y-5">

          {/* Advanced filters */}
          {isCurrentUserSuper && (
            <div className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                  <input
                    type="search"
                    placeholder="Search logs description…"
                    value={activitySearch}
                    onChange={(e) => {
                      setActivitySearch(e.target.value);
                      setActivityPage(1);
                    }}
                    className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E]"
                  />
                </div>

                {/* Filter by Admin */}
                <div className="relative">
                  <select
                    value={activityAdminId || ""}
                    onChange={(e) => {
                      setActivityAdminId(e.target.value ? Number(e.target.value) : undefined);
                      setActivityPage(1);
                    }}
                    className="h-10 pl-3 pr-8 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs appearance-none w-full focus:outline-none"
                  >
                    <option value="">All Admins</option>
                    {(admins as User[]).map((adm: User) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name === "Platform Admin" ? "Mamidi (Super Admin)" : adm.name} ({adm.email})
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#71717A] text-[10px]">▼</span>
                </div>

                {/* Filter by Action type */}
                <div className="relative">
                  <select
                    value={activityActionType || ""}
                    onChange={(e) => {
                      setActivityActionType(e.target.value || undefined);
                      setActivityPage(1);
                    }}
                    className="h-10 pl-3 pr-8 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs appearance-none w-full focus:outline-none"
                  >
                    <option value="">All Actions</option>
                    <option value="create_admin">Create Admin</option>
                    <option value="activate_admin">Activate Admin</option>
                    <option value="disable_admin">Disable Admin</option>
                    <option value="approve_farmer">Approve Farmer</option>
                    <option value="reject_farmer">Reject Farmer</option>
                    <option value="approve_delivery">Approve Courier</option>
                    <option value="reject_delivery">Reject Courier</option>
                    <option value="suspend_user">Suspend User</option>
                    <option value="reinstate_user">Reinstate User</option>
                    <option value="update_product">Update Product</option>
                    <option value="delete_product">Delete Product</option>
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#71717A] text-[10px]">▼</span>
                </div>

                {/* Date range picker */}
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={activityStartDate}
                    onChange={(e) => {
                      setActivityStartDate(e.target.value);
                      setActivityPage(1);
                    }}
                    className="h-10 px-3 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs w-full focus:outline-none"
                  />
                  <span className="text-xs text-[#71717A]">to</span>
                  <input
                    type="date"
                    value={activityEndDate}
                    onChange={(e) => {
                      setActivityEndDate(e.target.value);
                      setActivityPage(1);
                    }}
                    className="h-10 px-3 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-xs w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Logs Listing */}
          {isLogsLoading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner size="lg" />
            </div>
          ) : activityLogs.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-7 h-7 text-[#71717A]" />}
              title="No audit events found"
              description="Platform event logs database is clean or match filters query."
            />
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-[#1F1F23] bg-[#111113] shadow-sm">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F23] text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 pl-6 w-[30%]">Administrator</th>
                    <th className="p-4 w-[50%]">Security Event & Description</th>
                    <th className="p-4 pr-6 w-[20%]">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F23]">
                  {(activityLogs ?? []).map((log) => {
                    const formattedDate = log?.timestamp && !isNaN(new Date(log.timestamp).getTime())
                      ? new Date(log.timestamp).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—";
                    const formattedTime = log?.timestamp && !isNaN(new Date(log.timestamp).getTime())
                      ? new Date(log.timestamp).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    const safeId = log?.id ?? 0;
                    
                    // Map generic owner name to Mamidi if it's "Platform Admin"
                    const adminName = log?.admin_name === "Platform Admin" ? "Mamidi (Super Admin)" : (log?.admin_name || `Admin #${log?.admin_email}`);
                    const adminInitial = adminName.charAt(0).toUpperCase();

                    return (
                      <tr key={safeId} className="hover:bg-[#161618] transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#A855F7]/20 to-[#3B82F6]/20 flex items-center justify-center text-[#A855F7] font-bold border border-[#A855F7]/10 text-xs">
                              {adminInitial}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-xs text-[#FAFAFA]">{adminName}</span>
                              <span className="text-[10px] text-[#71717A] font-medium leading-none mt-0.5">{log?.admin_email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-[#A1A1AA] font-medium leading-relaxed">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider ${getActionBadgeClass(log?.action_type ?? "")}`}>
                              {formatActionName(log?.action_type ?? "")}
                            </span>
                            <span className="text-xs text-[#FAFAFA] font-medium">
                              {getActionDescription(log)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-[#71717A] text-xs font-semibold whitespace-nowrap">
                          {formattedDate}, {formattedTime}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Activity Logs Pagination */}
          {!isLogsLoading && logsTotalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#1F1F23] pt-4">
              <p className="text-xs text-[#71717A]">
                Showing Page {activityPage} of {logsTotalPages} · {logsData?.total ?? 0} security events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                  disabled={activityPage <= 1}
                  onClick={() => setActivityPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  iconRight={<ChevronRight className="w-3.5 h-3.5" />}
                  disabled={activityPage >= logsTotalPages}
                  onClick={() => setActivityPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE ADMIN OVERLAY DIALOG ───────────────────────────────────────── */}
      {isCreateOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 animate-fade-in" onClick={() => setIsCreateOpen(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] p-6 bg-[#111113] border border-[#1F1F23] rounded-3xl shadow-2xl z-50 text-sm space-y-4 animate-scale-pop">
            <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
              <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
                <Key className="w-5 h-5 text-[#22C55E]" /> Create Administrator
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-[#161618] text-[#71717A] hover:text-[#FAFAFA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#71717A] uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#71717A] uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. john@auxin.farm"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#71717A] uppercase">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#71717A] uppercase">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (e.g. +919988776655)"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1F1F23]">
                <Button variant="secondary" size="xs" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button
                  variant="outline"
                  size="xs"
                  className="border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                  type="submit"
                  loading={createAdminMutation.isPending}
                >
                  Create Admin Account
                </Button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── CONFIRM REMOVE DIALOG ─────────────────────────────────────────────── */}
      {confirmDeleteId && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setConfirmDeleteId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-6 bg-[#111113] border border-[#1F1F23] rounded-3xl shadow-2xl z-50 text-sm space-y-4 animate-scale-pop">
            <h3 className="text-lg font-bold text-[#FAFAFA] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#EF4444]" /> Remove Admin Account
            </h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Are you absolutely sure you want to permanently remove this administrator? This action is irreversible and they will immediately lose server access.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#1F1F23]">
              <Button variant="secondary" size="xs" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="xs"
                loading={removeAdminMutation.isPending}
                onClick={() => removeAdminMutation.mutate(confirmDeleteId)}
              >
                Remove Admin
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── ADMIN DETAILS SIDE DRAWER ─────────────────────────────────────────── */}
      {selectedAdmin && (() => {
        const isCurrentUser = selectedAdmin?.id === currentUser?.id;
        const isSuspended = selectedAdmin?.status === "suspended";

        const regDateText = selectedAdmin?.created_at && !isNaN(new Date(selectedAdmin.created_at).getTime())
          ? new Date(selectedAdmin.created_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";

        return (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" onClick={() => setSelectedAdmin(null)} />
            <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-[#111113] border-l border-[#1F1F23] shadow-2xl z-50 p-7 flex flex-col justify-between animate-slide-left text-sm">
              <div className="space-y-7 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-[#1F1F23] pb-4">
                  <h3 className="text-lg font-bold text-[#FAFAFA]">Admin Account File</h3>
                  <button onClick={() => setSelectedAdmin(null)} className="p-1 rounded-lg hover:bg-[#161618] text-[#71717A]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Avatar Banner */}
                <div className="flex flex-col items-center text-center space-y-3 py-4 bg-[#161618] rounded-2xl border border-[#1F1F23]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#3B82F6] flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(selectedAdmin?.name || "A").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#FAFAFA]">{selectedAdmin?.name ?? "—"}</h4>
                    <span className="text-[10px] text-[#A1A1AA] uppercase tracking-wider font-extrabold flex items-center gap-1 mt-1 justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" /> {selectedAdmin?.is_super_admin ? "Super Admin" : "Standard Admin"}
                    </span>
                  </div>
                  <Badge label={selectedAdmin?.status} dot />
                </div>

                {/* Account parameters */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Specifications</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">Email Address</span>
                      <span className="text-[#FAFAFA] font-semibold">{selectedAdmin?.email ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">Contact Phone</span>
                      <span className="font-mono text-[#FAFAFA] font-semibold">{selectedAdmin?.phone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">Registered Date</span>
                      <span className="text-[#FAFAFA] font-semibold">
                        {regDateText}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit trail summary */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Recent Actions Summary</h5>
                  {isSelectedAdminLogsLoading ? (
                    <Spinner size="xs" />
                  ) : !selectedAdminLogs || (selectedAdminLogs?.items ?? []).length === 0 ? (
                    <p className="text-xs text-[#71717A] italic">No recent log records found for this account.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {(selectedAdminLogs?.items ?? []).slice(0, 4).map((log: AdminActivityLog) => {
                        const formattedLogTime = log?.timestamp && !isNaN(new Date(log.timestamp).getTime())
                          ? `${new Date(log.timestamp).toLocaleDateString()} at ${new Date(log.timestamp).toLocaleTimeString()}`
                          : "—";
                        return (
                          <div key={log?.id ?? 0} className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-start gap-2.5">
                            <Clock className="w-3.5 h-3.5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                            <div className="space-y-0.5">
                              <p className="text-xs text-[#FAFAFA] leading-relaxed font-semibold">{getActionDescription(log)}</p>
                              <span className="text-[9px] text-[#71717A] font-bold">
                                {formattedLogTime}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer actions */}
              <div className="border-t border-[#1F1F23] pt-4 mt-4 flex gap-3">
                {!isCurrentUser && (
                  <>
                    {isSuspended ? (
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                        loading={activateAdminMutation.isPending && pendingAdminId === selectedAdmin.id}
                        onClick={() => {
                          if (selectedAdmin?.id !== undefined) activateAdminMutation.mutate(selectedAdmin.id);
                        }}
                      >
                        Enable Account
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="flex-1 bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                        loading={disableAdminMutation.isPending && pendingAdminId === selectedAdmin.id}
                        onClick={() => {
                          if (selectedAdmin?.id !== undefined) disableAdminMutation.mutate(selectedAdmin.id);
                        }}
                      >
                        Disable Account
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      className="px-3"
                      icon={<Trash2 className="w-4 h-4" />}
                      onClick={() => setConfirmDeleteId(selectedAdmin.id)}
                    />
                  </>
                )}
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedAdmin(null)}>Close</Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// Inline fallback icon
function UserCogIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 16v6" />
      <path d="M22 19h-6" />
    </svg>
  );
}
