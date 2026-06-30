"use client";
/**
 * app/delivery/earnings/page.tsx — Auxin v2.0
 * Delivery partner earnings page — dark theme with earnings history.
 */

import { useQuery } from "@tanstack/react-query";
import { Wallet, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard, EmptyState, Spinner } from "@/components/ui/Card";
import { deliveryApi } from "@/lib/delivery";
import { useAuthStore } from "@/store/authStore";

export default function DeliveryEarningsPage() {
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["my-deliveries-all"],
    queryFn: () => deliveryApi.myDeliveries().then((r) => r.data),
  });

  const deliveries = Array.isArray(data) ? data : [];
  const delivered  = deliveries.filter((d) => d.status === "delivered");

  // Estimate earnings: ₹40 per delivery
  const PER_DELIVERY = 40;
  const total = delivered.length * PER_DELIVERY;

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0B" }}>
      <TopBar title="Earnings" />

      <div className="px-4 py-5 space-y-5">
        {/* Hero earnings card */}
        <div
          className="rounded-2xl px-5 py-5 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(34,197,94,0.05))",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <p className="text-xs font-semibold text-[#22C55E] uppercase tracking-widest mb-2">
            Total Earned
          </p>
          <p className="text-5xl font-black text-[#FAFAFA] mb-1">₹{total}</p>
          <p className="text-sm text-[#71717A]">
            {delivered.length} completed deliveries
          </p>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Deliveries Done"
              value={delivered.length}
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="green"
            />
            <StatCard
              label="Per Delivery"
              value={`₹${PER_DELIVERY}`}
              icon={<Wallet className="w-4 h-4" />}
              color="blue"
            />
          </div>
        )}

        {/* History */}
        <div>
          <p className="text-base font-bold text-[#FAFAFA] mb-3">Delivery History</p>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="lg" />
            </div>
          ) : delivered.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-8 h-8" />}
              title="No earnings yet"
              description="Complete deliveries to start earning"
            />
          ) : (
            <div className="space-y-2">
              {delivered.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                  style={{ background: "#111113", border: "1px solid #27272A" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(34,197,94,0.1)" }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#FAFAFA]">
                        Delivery #{d.id}
                      </p>
                      <p className="text-xs text-[#71717A]">Order #{d.order_id}</p>
                      {d.actual_delivery && (
                        <p className="text-xs text-[#52525B] mt-0.5">
                          {new Date(d.actual_delivery).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short",
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="font-black text-[#22C55E] text-base">+₹{PER_DELIVERY}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payout notice */}
        <div
          className="flex items-start gap-3 px-4 py-4 rounded-2xl"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.15)",
          }}
        >
          <Clock className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#3B82F6]">Payout Schedule</p>
            <p className="text-xs text-[#71717A] mt-0.5">
              Earnings are credited to your registered bank account every Monday.
              Contact support for payout queries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
