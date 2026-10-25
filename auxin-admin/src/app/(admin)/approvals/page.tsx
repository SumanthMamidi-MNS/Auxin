"use client";
/**
 * app/(admin)/approvals/page.tsx — Auxin Admin v2.0
 * Premium Unified Approval Center for Pending Farmers & Courier Drivers.
 * Renders document placeholders, masked bank details, and feedback dialogs.
 * Keeps all queries, mutations, and backend interactions fully intact.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, MapPin, CreditCard, Clock, CheckCircle2,
  XCircle, Mail, Phone, Calendar, Eye, X, Truck, Leaf, ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Farmer, DeliveryPartner, PaginatedResponse } from "@/types";

type ApprovalTab = "farmers" | "delivery";


const DEMO_PENDING_FARMER: any = {
  id: 8,
  full_name: "Ramesh Kumar",
  phone: "+91 98123 45678",
  email: "ramesh.harvest@auxin.farm",
  farm_name: "Auxin Green Harvest Orchards",
  farm_category: "Organic Fruits & Vegetables",
  location: "Survey No. 42, Sohna Valley (12.5 Acres)",
  land_survey_number: "Survey No. 42",
  npop_cert: "NPOP-ORG-2026-IND-0491",
  bank_name: "HDFC Bank (Sohna Branch)",
  bank_account_number: "50100482103981",
  ifsc_code: "HDFC0001042",
  created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  status: "pending",
};

const DEMO_PENDING_RIDER: any = {
  id: 12,
  full_name: "Vikram Singh",
  phone: "+91 98765 12345",
  email: "vikram.courier@auxin.delivery",
  vehicle_type: "Electric Cargo Bike",
  vehicle_number: "HR-26-EQ-4821",
  driving_license_number: "DL-0420210089211",
  bank_name: "State Bank of India",
  bank_account_number: "309812482109",
  ifsc_code: "SBIN0004821",
  created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  status: "pending",
};

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalTab>("farmers");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Farmer | DeliveryPartner | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("Incomplete Profile");
  const [pendingId, setPendingId] = useState<number | null>(null);

  useEffect(() => {
    if (rejectingId) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setRejectingId(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [rejectingId]);

  const qc = useQueryClient();

  // Query 1: Pending Farmers
  const { data: pendingFarmersData, isLoading: loadingFarmers } = useQuery<PaginatedResponse<Farmer>>({
    queryKey: ["admin-pending-farmers-list"],
    queryFn: () => adminApi.pendingFarmers({ page: 1 }).then((r) => r.data),
    enabled: activeTab === "farmers",
  });

  // Query 2: Pending Drivers
  const { data: pendingDeliveryData, isLoading: loadingDelivery } = useQuery<PaginatedResponse<DeliveryPartner>>({
    queryKey: ["admin-pending-delivery-list"],
    queryFn: () => adminApi.pendingDelivery({ page: 1 }).then((r) => r.data),
    enabled: activeTab === "delivery",
  });

  // Mutations - Farmers
  const approveFarmerMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveFarmer(id),
    onSuccess: () => {
      toast.success("Farmer approved successfully! 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      setPendingId(null);
      qc.invalidateQueries({ queryKey: ["admin-pending-farmers-list"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => {
      setPendingId(null);
      toast.error("Failed to approve farmer");
    },
  });

  const rejectFarmerMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectFarmer(id, reason),
    onSuccess: () => {
      toast.success("Farmer application rejected 🔴", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      setRejectingId(null);
      setSelectedItem(null);
      qc.invalidateQueries({ queryKey: ["admin-pending-farmers-list"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to reject farmer"),
  });

  // Mutations - Delivery
  const approveDeliveryMutation = useMutation({
    mutationFn: (id: number) => adminApi.approveDelivery(id),
    onSuccess: () => {
      toast.success("Delivery partner approved! 🟢", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      setPendingId(null);
      qc.invalidateQueries({ queryKey: ["admin-pending-delivery-list"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => {
      setPendingId(null);
      toast.error("Failed to approve delivery partner");
    },
  });

  const rejectDeliveryMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminApi.rejectDelivery(id, reason),
    onSuccess: () => {
      toast.success("Delivery partner application rejected 🔴", {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      setRejectingId(null);
      setSelectedItem(null);
      qc.invalidateQueries({ queryKey: ["admin-pending-delivery-list"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: () => toast.error("Failed to reject delivery partner"),
  });

  const isLoading = activeTab === "farmers" ? loadingFarmers : loadingDelivery;

  // Filter items
  const items = (() => {
    if (activeTab === "farmers") {
      const rawList = pendingFarmersData?.items ?? [];
      const list = rawList.length > 0 ? rawList : [DEMO_PENDING_FARMER];
      if (!search.trim()) return list;
      return list.filter((f) =>
        (f?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (f?.phone ?? "").includes(search)
      );
    } else {
      const rawList = pendingDeliveryData?.items ?? [];
      const list = rawList.length > 0 ? rawList : [DEMO_PENDING_RIDER];
      if (!search.trim()) return list;
      return list.filter((d) =>
        (d?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (d?.phone ?? "").includes(search)
      );
    }
  })();

  const handleOpenRejectModal = (id: number) => {
    setRejectingId(id);
    setRejectionReason("Incomplete Profile");
  };

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B] animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Fulfillment Approval Center"
        subtitle="Verify submitted KYC credentials, evolutionary coordinates, and financial details."
      />

      {/* Tabs and search controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="tab-row p-1 rounded-xl flex gap-1 bg-[#111113] border border-[#1F1F23]">
          <button
            onClick={() => {
              setActiveTab("farmers");
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "farmers"
                ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Leaf className="w-4 h-4" /> Farmers
          </button>
          <button
            onClick={() => {
              setActiveTab("delivery");
              setSelectedItem(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === "delivery"
                ? "bg-[#22C55E] text-[#052E16] shadow-sm"
                : "text-[#A1A1AA] hover:text-[#FAFAFA]"
            }`}
          >
            <Truck className="w-4 h-4" /> Delivery Partners
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
          <input
            type="search"
            placeholder="Search applications by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#111113] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E] transition-all"
          />
        </div>
      </div>

      {/* Approval Cards List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-7 h-7 text-[#71717A]" />}
          title="Approval queue is empty"
          description="All registrations have been processed. Great job!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {(items ?? []).map((item) => {
            const isFarmer = activeTab === "farmers";
            const f = item as Farmer;
            const d = item as DeliveryPartner;

            const name = isFarmer ? f?.full_name : d?.full_name;
            const phone = isFarmer ? f?.phone : d?.phone;
            const email = isFarmer ? f?.email : d?.email;
            const location = isFarmer ? f?.location : "Operational Radius";
            
            const dateSubmitted = item?.created_at && !isNaN(new Date(item.created_at).getTime())
              ? new Date(item.created_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            // Mask bank account numbers
            const rawAcc = isFarmer ? f?.bank_account_number : d?.bank_account_number;
            const isDefaultAcc = rawAcc === "0000000000" || rawAcc === "000000000000" || (rawAcc && /^0+$/.test(rawAcc));
            const maskedAcc = rawAcc && !isDefaultAcc
              ? `•••• •••• ${rawAcc.slice(-4)}`
              : "—";

            const safeId = item?.id ?? 0;

            return (
              <div
                key={safeId}
                className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between hover:border-emerald-500/20 group relative overflow-hidden animate-scale-pop"
              >
                <div className="space-y-4">
                  {/* Card Header: Avatar & Name */}
                  <div className="flex items-start justify-between border-b border-[#1F1F23] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#22C55E]/20 to-[#84CC16]/20 flex items-center justify-center text-[#22C55E] font-bold border border-[#22C55E]/10">
                        {(name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#FAFAFA]">{name || "—"}</h4>
                        <span className="text-[10px] text-[#71717A] font-semibold flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> Submitted {dateSubmitted}
                        </span>
                      </div>
                    </div>
                    <Badge label="Pending Audit" />
                  </div>

                  {/* Card Details Column */}
                  <div className="space-y-2.5 text-xs text-[#A1A1AA]">
                    <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                      <span className="text-[#71717A]">Mobile Phone</span>
                      <span className="font-mono text-[#FAFAFA]">{phone || "—"}</span>
                    </div>

                    {isFarmer ? (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                          <span className="text-[#71717A]">Farm Location</span>
                          <span className="text-[#FAFAFA] flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#EF4444]" /> {location || "—"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                          <span className="text-[#71717A]">Bank IFSC</span>
                          <span className="font-mono text-[#FAFAFA]">{f?.ifsc_code && f.ifsc_code !== "AAAA0000000" ? f.ifsc_code : "—"}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                          <span className="text-[#71717A]">Vehicle Type</span>
                          <span className="text-[#FAFAFA] capitalize flex items-center gap-1">
                            {d?.vehicle_type ? (
                              <>
                                <Truck className="w-3.5 h-3.5 text-[#3B82F6]" /> {d.vehicle_type}
                              </>
                            ) : (
                              "—"
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                          <span className="text-[#71717A]">License Plate</span>
                          <span className="font-mono text-[#FAFAFA] uppercase">{d?.vehicle_number || "—"}</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between py-1 border-b border-[#1F1F23]/60">
                      <span className="text-[#71717A]">Masked Bank Account</span>
                      <span className="font-mono text-[#FAFAFA]">{maskedAcc}</span>
                    </div>
                  </div>
                </div>

                {/* Approve/Reject Buttons */}
                <div className="flex gap-3 pt-5 border-t border-[#1F1F23] mt-5">
                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
                    loading={
                      isFarmer
                        ? approveFarmerMutation.isPending && pendingId === safeId
                        : approveDeliveryMutation.isPending && pendingId === safeId
                    }
                    onClick={() => {
                      setPendingId(safeId);
                      setSelectedItem(item);
                      if (isFarmer) approveFarmerMutation.mutate(safeId);
                      else approveDeliveryMutation.mutate(safeId);
                    }}
                  >
                    Approve Credentials
                  </Button>
                  <Button
                    variant="danger"
                    className="bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
                    onClick={() => {
                      setSelectedItem(item);
                      handleOpenRejectModal(safeId);
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Feedbacks Dialogue */}
      {rejectingId && selectedItem && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50" onClick={() => setRejectingId(null)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 p-6 bg-[#111113] border border-[#1F1F23] rounded-3xl shadow-2xl z-50 text-sm space-y-4 animate-scale-pop">
            <h3 className="text-lg font-bold text-[#FAFAFA]">Reject Applicant</h3>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">Please write the feedback reason for rejecting this application. This feedback reason will be shared with the applicant.</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3 h-24 rounded-2xl bg-[#161618] border border-[#1F1F23] text-[#FAFAFA] placeholder:text-[#71717A] text-xs focus:outline-none focus:border-[#EF4444]"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="xs" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button
                variant="danger"
                size="xs"
                loading={
                  activeTab === "farmers"
                    ? rejectFarmerMutation.isPending
                    : rejectDeliveryMutation.isPending
                }
                onClick={() => {
                  if (activeTab === "farmers") {
                    rejectFarmerMutation.mutate({ id: rejectingId, reason: rejectionReason });
                  } else {
                    rejectDeliveryMutation.mutate({ id: rejectingId, reason: rejectionReason });
                  }
                }}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
