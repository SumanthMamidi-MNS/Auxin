"use client";
/**
 * app/delivery/dashboard/page.tsx — Auxin v2.0
 * Uber Driver-inspired dark delivery dashboard.
 * Active deliveries with status flow, OTP confirmation.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Truck, CheckCircle2, Package, MapPin, KeyRound,
  Navigation, Clock, ChevronRight,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState, Spinner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { deliveryApi } from "@/lib/delivery";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Delivery } from "@/types";
import toast from "react-hot-toast";

const STATUS_FLOW: Record<string, "picked_up" | "out_for_delivery"> = {
  assigned:  "picked_up",
  picked_up: "out_for_delivery",
};

const ACTION_LABELS: Record<string, string> = {
  assigned:         "Mark Picked Up",
  picked_up:        "Mark Out for Delivery",
  out_for_delivery: "Complete Delivery (Enter OTP)",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  assigned:         Package,
  picked_up:        Truck,
  out_for_delivery: Navigation,
  delivered:        CheckCircle2,
};

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const qc = useQueryClient();
  const [otp, setOtp]         = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (status: "picked_up" | "out_for_delivery") =>
      deliveryApi.updateStatus(delivery.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast.success("Status updated!");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const otpMutation = useMutation({
    mutationFn: () => deliveryApi.verifyOtp(delivery.id, otp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-deliveries"] });
      toast.success("Delivery completed! 🎉");
      setShowOtp(false);
      setOtp("");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const nextStatus = STATUS_FLOW[delivery.status];
  const actionLabel = ACTION_LABELS[delivery.status];
  const isTerminal  = delivery.status === "delivered" || delivery.status === "failed";
  const StatusIcon  = STATUS_ICONS[delivery.status] ?? Truck;

  const handleAction = () => {
    if (delivery.status === "out_for_delivery") {
      setShowOtp(true);
    } else if (nextStatus) {
      updateMutation.mutate(nextStatus);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ borderBottom: "1px solid #1A1A1D" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isTerminal
                ? "rgba(34,197,94,0.1)"
                : delivery.status === "out_for_delivery"
                ? "rgba(245,158,11,0.1)"
                : "rgba(59,130,246,0.1)",
            }}
          >
            <StatusIcon
              className="w-5 h-5"
              style={{
                color: isTerminal
                  ? "#22C55E"
                  : delivery.status === "out_for_delivery"
                  ? "#F59E0B"
                  : "#3B82F6",
              }}
            />
          </div>
          <div>
            <p className="font-bold text-[#FAFAFA] text-sm">Delivery #{delivery.id}</p>
            <p className="text-xs text-[#71717A]">Order #{delivery.order_id}</p>
          </div>
        </div>
        <Badge label={delivery.status} dot />
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* ETA */}
        {delivery.estimated_delivery && (
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: "#18181B" }}
          >
            <Clock className="w-4 h-4 text-[#F59E0B] flex-shrink-0" />
            <span className="text-sm text-[#A1A1AA]">
              ETA:{" "}
              <span className="text-[#FAFAFA] font-semibold">
                {new Date(delivery.estimated_delivery).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            </span>
          </div>
        )}

        {/* OTP form */}
        {showOtp && (
          <div
            className="p-4 rounded-2xl space-y-3 animate-fade-in"
            style={{ background: "#18181B", border: "1px solid #27272A" }}
          >
            <p className="text-sm font-semibold text-[#FAFAFA] flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#22C55E]" />
              Enter Customer OTP
            </p>
            <Input
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              type="tel"
              inputMode="numeric"
            />
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowOtp(false); setOtp(""); }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={otpMutation.isPending}
                disabled={otp.length < 4}
                icon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => otpMutation.mutate()}
              >
                Confirm Delivery
              </Button>
            </div>
          </div>
        )}

        {/* Action button */}
        {!isTerminal && !showOtp && actionLabel && (
          <Button
            fullWidth
            variant={delivery.status === "out_for_delivery" ? "primary" : "secondary"}
            loading={updateMutation.isPending}
            onClick={handleAction}
            iconRight={<ChevronRight className="w-4 h-4" />}
          >
            {actionLabel}
          </Button>
        )}

        {/* Completed state */}
        {isTerminal && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
          >
            <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
            <span className="text-sm font-semibold text-[#22C55E]">
              {delivery.status === "delivered" ? "Delivery Complete" : "Delivery Failed"}
            </span>
            {delivery.actual_delivery && (
              <span className="text-xs text-[#71717A] ml-auto">
                {new Date(delivery.actual_delivery).toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeliveryDashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useQuery({
    queryKey: ["my-deliveries"],
    queryFn:  () => deliveryApi.myDeliveries().then((r) => r.data),
    refetchInterval: 30_000,
  });

  const deliveries = Array.isArray(data) ? data : [];
  const active     = deliveries.filter((d) => d.status !== "delivered" && d.status !== "failed");
  const done       = deliveries.filter((d) => d.status === "delivered" || d.status === "failed");

  const firstName = user?.name?.split(" ")[0] ?? "Partner";

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0B" }}>
      <TopBar title="My Deliveries" />

      <div className="px-4 py-5 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-black text-[#FAFAFA]">
            Hey, {firstName} 🚴
          </h1>
          <p className="text-sm text-[#71717A] mt-0.5">
            {active.length > 0
              ? `${active.length} active · ${done.length} completed today`
              : "No active deliveries right now"}
          </p>
        </div>

        {/* Stats row */}
        {!isLoading && deliveries.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-2xl px-4 py-3.5 flex flex-col gap-1"
              style={{ background: "#111113", border: "1px solid #27272A" }}
            >
              <p className="text-2xl font-black text-[#FAFAFA]">{active.length}</p>
              <p className="text-xs text-[#71717A]">Active</p>
            </div>
            <div
              className="rounded-2xl px-4 py-3.5 flex flex-col gap-1"
              style={{ background: "#111113", border: "1px solid #27272A" }}
            >
              <p className="text-2xl font-black text-[#22C55E]">{done.length}</p>
              <p className="text-xs text-[#71717A]">Completed</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : deliveries.length === 0 ? (
          <EmptyState
            icon={<Truck className="w-8 h-8" />}
            title="No deliveries assigned"
            description="You have no deliveries right now. New assignments will appear here automatically."
          />
        ) : (
          <>
            {/* Active deliveries */}
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#52525B] uppercase tracking-widest">
                  Active ({active.length})
                </p>
                {active.map((d) => <DeliveryCard key={d.id} delivery={d} />)}
              </div>
            )}

            {/* Completed */}
            {done.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-bold text-[#52525B] uppercase tracking-widest">
                  Completed ({done.length})
                </p>
                {done.map((d) => <DeliveryCard key={d.id} delivery={d} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
