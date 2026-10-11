"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, MapPin, CreditCard, Clock, CheckCircle2,
  XCircle, Leaf, Mail, Phone, Calendar, Eye, X, Star, ShieldAlert, BadgeAlert, Award
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Farmer, User, PaginatedResponse, Order, Product } from "@/types";

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
      toast.success("Farmer account suspended 🔴", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-users-farmers"] });
      onDone();
    },
    onError: () => toast.error("Failed to suspend farmer"),
  });

  return (
    <div
      className="flex items-center gap-2 mt-2 p-3 rounded-xl border border-red-900/30 bg-red-950/10 animate-slide-down"
    >
      <input
        type="text"
        placeholder="Reason for suspension…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="flex-1 h-8 px-3 rounded-lg text-xs bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] placeholder:text-[#71717A] focus:outline-none focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444]/30"
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
      <Button variant="ghost" size="xs" onClick={onDone} className="text-[#A1A1AA]">
        Cancel
      </Button>
    </div>
  );
}

/* ── Main Farmer Page ───────────────────────────────────────────────────── */
export default function FarmersPage() {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | User | null>(null);
  const [rejectingFarmerId, setRejectingFarmerId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Incomplete Profile");
  const [suspendingUserId, setSuspendingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedFarmer) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedFarmer(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedFarmer]);

  const qc = useQueryClient();

  // Queries
  const { data: pendingData, isLoading: loadingPending } = useQuery<PaginatedResponse<Farmer>>({
    queryKey: ["admin-farmers-pending"],
    queryFn: () => adminApi.pendingFarmers({ page: 1 }).then((r) => r.data),
    enabled: activeTab === "pending",
  });

  const { data: allUsersData, isLoading: loadingAll } = useQuery<PaginatedResponse<User>>({
    queryKey: ["admin-users-farmers"],
    queryFn: () => adminApi.listUsers({ role: "farmer", page_size: 100 }).then((r) => r.data),
    enabled: activeTab !== "pending",
  });

  const { data: productsData } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin-products-farmers-calc"],
    queryFn: () => adminApi.listProducts({ page: 1, page_size: 100 }).then((r) => r.data as PaginatedResponse<Product>),
    staleTime: 30_000,
  });

  const { data: ordersData } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders-farmers-calc"],
    queryFn: () => adminApi.listOrders({ page: 1 }).then((r) => r.data),
    staleTime: 30_000,
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveFarmer(id),
    onSuccess: () => {
      toast.success("Farmer approved successfully 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-farmers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-users-farmers"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to approve farmer"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectFarmer(id, reason),
    onSuccess: () => {
      toast.success("Farmer application rejected 🔴", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      setRejectingFarmerId(null);
      qc.invalidateQueries({ queryKey: ["admin-farmers-pending"] });
      qc.invalidateQueries({ queryKey: ["admin-users-farmers"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to reject farmer"),
  });

  const reinstateMutation = useMutation({
    mutationFn: (id: number) => adminApi.reinstateUser(id),
    onSuccess: () => {
      toast.success("Farmer account reinstated 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-users-farmers"] });
    },
    onError: () => toast.error("Failed to reinstate user"),
  });

  const isLoading = loadingPending || loadingAll;
  const productsList = productsData?.items ?? [];
  const ordersList = ordersData?.items ?? [];

  // Helper stats aggregator
  const getFarmerStats = (farmerUserId: number, farmerId: number, apiRating?: number | null) => {
    const prodCount = (productsList ?? []).filter((p) => p?.farmer_id === farmerId).length;
    const farmerOrders = (ordersList ?? []).filter((o) => o?.farmer_id === farmerId);
    const orderCount = farmerOrders.length;
    const revenue = farmerOrders.reduce((sum, o) => sum + Number(o?.total_amount ?? 0), 0);
    const rating = apiRating !== undefined && apiRating !== null ? Number(apiRating).toFixed(1) : "—";
    
    return { prodCount, orderCount, revenue, rating };
  };

  // Filter items
  const items = (() => {
    if (activeTab === "pending") {
      const list = pendingData?.items ?? [];
      if (!search.trim()) return list;
      return list.filter((f) =>
        (f?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (f?.phone ?? "").includes(search)
      );
    } else {
      const list = allUsersData?.items ?? [];
      const filtered = list.filter((u) => u?.status === activeTab);
      if (!search.trim()) return filtered;
      return filtered.filter((u) =>
        (u?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (u?.phone ?? "").includes(search)
      );
    }
  })();

  const handleOpenRejectModal = (id: number) => {
    setRejectingFarmerId(id);
    setRejectionReason("Incomplete Profile");
  };

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B] animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Farmer Registry"
        subtitle="Manage local organic producers, verify farm specs, and inspect catalogs."
      />

      {/* Tabs and search controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="tab-row p-1 rounded-xl flex gap-1 bg-[#111113] border border-[#1F1F23]">
          {(["pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedFarmer(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize ${
                activeTab === tab
                  ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                  : "text-[#A1A1AA] hover:text-[#FAFAFA]"
              }`}
            >
              {tab} Applications
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="search"
            placeholder="Search farm or owner…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#111113] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10 transition-all"
          />
        </div>
      </div>

      {/* Farmer Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Leaf className="w-7 h-7 text-[#71717A]" />}
          title="No farmers match query"
          description="Try switching tabs or searching for registered owners."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#1F1F23] bg-[#111113] shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1F1F23] text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Farm Details</th>
                <th className="p-4">Owner Name</th>
                {activeTab !== "pending" && (
                  <>
                    <th className="p-4">Products</th>
                    <th className="p-4">Cumulative Revenue</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Rating</th>
                  </>
                )}
                <th className="p-4">Verification Status</th>
                <th className="p-4 pr-6 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {(items ?? []).map((item) => {
                const isPendingType = activeTab === "pending";
                const farmer = item as Farmer;
                const user = item as User;

                const id = isPendingType ? farmer?.id : user?.id;
                const userId = isPendingType ? farmer?.user_id : user?.id;
                const name = isPendingType ? farmer?.full_name : user?.name;
                const phone = isPendingType ? farmer?.phone : user?.phone;
                const location = isPendingType ? farmer?.location : "Active Region";
                
                // Get computed stats
                const stats = getFarmerStats(userId ?? 0, id ?? 0, (item as any).rating);
                const safeId = id ?? 0;
                const safeUserId = userId ?? 0;

                return (
                  <tr
                    key={safeId}
                    className="hover:bg-[#161618] transition-colors cursor-pointer"
                    onClick={() => setSelectedFarmer(item)}
                  >
                    <td className="p-4 pl-6 font-semibold text-[#FAFAFA]">
                      <div className="flex flex-col">
                        <span>{name || "Farmer"} Farm</span>
                        <span className="text-xs text-[#71717A] font-medium flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#EF4444]" /> {location || "Active Region"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-[#A1A1AA]">
                      <div className="flex flex-col">
                        <span>{name || "Farmer"}</span>
                        <span className="text-xs text-[#71717A] font-mono mt-0.5">{phone || "—"}</span>
                      </div>
                    </td>
                    {!isPendingType && (
                      <>
                        <td className="p-4 font-mono font-bold text-[#FAFAFA]">{stats?.prodCount ?? 0} items</td>
                        <td className="p-4 font-mono font-black text-[#22C55E]">₹{(stats?.revenue ?? 0).toLocaleString("en-IN")}</td>
                        <td className="p-4 font-mono text-[#A1A1AA]">{stats?.orderCount ?? 0} checkouts</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-[#D4AF37]">
                            <Star className="w-3.5 h-3.5 fill-[#D4AF37]" />
                            <span className="font-bold text-xs">{stats?.rating ?? "—"}</span>
                          </div>
                        </td>
                      </>
                    )}
                    <td className="p-4">
                      {isPendingType ? (
                        <Badge label="Awaiting Review" dot />
                      ) : (
                        <Badge label={user?.status} dot />
                      )}
                    </td>
                    <td className="p-4 pr-6 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-start gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => setSelectedFarmer(item)}
                        >
                          View
                        </Button>
                        {isPendingType ? (
                          <>
                            <Button
                              variant="outline"
                              size="xs"
                              className="border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                              loading={approveMutation.isPending}
                              onClick={() => {
                                if (id !== undefined) approveMutation.mutate(id);
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="xs"
                              className="bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                              onClick={() => {
                                if (id !== undefined) handleOpenRejectModal(id);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <>
                            {user?.status === "suspended" ? (
                              <Button
                                variant="outline"
                                size="xs"
                                className="border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                                loading={reinstateMutation.isPending && suspendingUserId === safeUserId}
                                onClick={() => {
                                  if (userId !== undefined) reinstateMutation.mutate(userId);
                                }}
                              >
                                Reinstate
                              </Button>
                            ) : (
                              <Button
                                variant="danger"
                                size="xs"
                                className="bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                                onClick={() => {
                                  if (userId !== undefined) {
                                    setSuspendingUserId(suspendingUserId === safeUserId ? null : safeUserId);
                                  }
                                }}
                              >
                                Suspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      {!isPendingType && userId !== undefined && suspendingUserId === safeUserId && (
                        <div className="text-left mt-2">
                          <SuspendInline userId={userId} onDone={() => setSuspendingUserId(null)} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection reason overlay dialog */}
      {rejectingFarmerId && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setRejectingFarmerId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-6 bg-[#111113] border border-[#1F1F23] rounded-3xl shadow-2xl z-50 text-sm space-y-4">
            <h3 className="text-lg font-bold text-[#FAFAFA]">Reject Application</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">Please state the reason for rejecting this farmer registration. This feedback will be shared with the owner.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 h-24 rounded-2xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] placeholder:text-[#71717A] text-xs focus:outline-none focus:border-[#EF4444]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="xs" onClick={() => setRejectingFarmerId(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="xs"
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate({ id: rejectingFarmerId, reason: rejectionReason })}
              >
                Reject Farmer
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Farmer Profile Drawer */}
      {selectedFarmer && (() => {
        const isPendingType = activeTab === "pending";
        const farmer = selectedFarmer as Farmer;
        const user = selectedFarmer as User;

        const id = isPendingType ? farmer?.id : user?.id;
        const userId = isPendingType ? farmer?.user_id : user?.id;
        const name = isPendingType ? farmer?.full_name : user?.name;
        const phone = isPendingType ? farmer?.phone : user?.phone;
        const location = isPendingType ? farmer?.location : "Registered Region";
        const email = isPendingType ? farmer?.email : user?.email;

        const stats = getFarmerStats(userId ?? 0, id ?? 0);
        const safeId = id ?? 0;
        const safeUserId = userId ?? 0;

        return (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" onClick={() => setSelectedFarmer(null)} />
            <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-[#111113] border-l border-[#1F1F23] shadow-2xl z-50 p-7 flex flex-col justify-between animate-slide-left text-sm">
              <div className="space-y-7 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-[#1F1F23] pb-4">
                  <h3 className="text-lg font-bold text-[#FAFAFA]">Farmer Profile</h3>
                  <button onClick={() => setSelectedFarmer(null)} className="p-1 rounded-lg hover:bg-[#161618] text-[#71717A]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Profile Banner */}
                <div className="flex flex-col items-center text-center space-y-3 py-4 bg-[#161618] rounded-2xl border border-[#1F1F23]">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#22C55E] to-[#84CC16] flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(name || "F").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#FAFAFA]">{name || "—"}</h4>
                    <p className="text-xs text-[#71717A] mt-0.5">{name || "—"} Farm Group</p>
                  </div>
                  <div className="flex items-center gap-1.5 justify-center mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#EF4444]" />
                    <span className="text-xs text-[#A1A1AA] font-bold">{location || "—"}</span>
                  </div>
                </div>

                {/* Profile parameters */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Specifications</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">Mobile Number</span>
                      <span className="font-mono text-[#FAFAFA] font-semibold">{phone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">Email Address</span>
                      <span className="text-[#FAFAFA] font-semibold">{email || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">IFSC Verification</span>
                      <span className="font-mono text-[#FAFAFA] font-semibold">{farmer?.ifsc_code || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-[#1F1F23]">
                      <span className="text-xs text-[#71717A]">UPI Address</span>
                      <span className="font-mono text-[#FAFAFA] font-semibold">{farmer?.upi_id || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-4">
                  <h5 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Operational Activity</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-[#71717A]">Catalog items</p>
                      <p className="font-black text-[#FAFAFA] text-base mt-0.5">{stats?.prodCount ?? 0} products</p>
                    </div>
                    <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-[#71717A]">Farmer Revenue</p>
                      <p className="font-black text-[#22C55E] text-base mt-0.5">₹{(stats?.revenue ?? 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer actions */}
              <div className="border-t border-[#1F1F23] pt-4 mt-4 flex gap-3">
                {isPendingType ? (
                  <>
                    <Button
                      variant="outline"
                      className="flex-1 border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                      loading={approveMutation.isPending}
                      onClick={() => {
                        if (id !== undefined) approveMutation.mutate(id);
                      }}
                    >
                      Approve Farmer
                    </Button>
                    <Button
                      variant="danger"
                      className="flex-1 bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                      onClick={() => {
                        if (id !== undefined) handleOpenRejectModal(id);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <>
                    {user?.status === "suspended" ? (
                      <Button
                        variant="outline"
                        className="flex-1 border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                        loading={reinstateMutation.isPending}
                        onClick={() => {
                          if (userId !== undefined) reinstateMutation.mutate(userId);
                        }}
                      >
                        Reinstate Account
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="flex-1 bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                        onClick={() => {
                          if (userId !== undefined) {
                            setSuspendingUserId(userId);
                            setSelectedFarmer(null);
                          }
                        }}
                      >
                        Suspend Farmer
                      </Button>
                    )}
                  </>
                )}
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedFarmer(null)}>Close</Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
