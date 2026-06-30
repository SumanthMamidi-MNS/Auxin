"use client";
/**
 * app/customer/orders/page.tsx — Auxin v2.0
 * Premium dark orders list with payment retry and status timeline.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package, ClipboardList, XCircle, CreditCard,
  RefreshCw, ChevronRight,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, Card, EmptyState, Spinner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ordersApi } from "@/lib/orders";
import { paymentsApi, openRazorpayCheckout } from "@/lib/payments";
import { getErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import type { Order } from "@/types";
import toast from "react-hot-toast";

const STATUS_STEPS = ["pending", "accepted", "completed"] as const;

function StatusTimeline({ status }: { status: string }) {
  const isFailed   = ["rejected", "cancelled"].includes(status);
  const isComplete = status === "completed";
  const currentIdx = STATUS_STEPS.indexOf(status as typeof STATUS_STEPS[number]);

  return (
    <div className="flex items-center gap-0">
      {STATUS_STEPS.map((step, i) => {
        const isDone   = isComplete ? i <= 2 : i < currentIdx;
        const isActive = status === step;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: isFailed
                    ? "#EF4444"
                    : isActive
                    ? "#F59E0B"
                    : isDone
                    ? "#22C55E"
                    : "#27272A",
                }}
              />
              <span
                className="text-[10px] font-medium whitespace-nowrap"
                style={{
                  color: isFailed
                    ? "#EF4444"
                    : isActive
                    ? "#F59E0B"
                    : isDone
                    ? "#22C55E"
                    : "#52525B",
                }}
              >
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div
                className="h-px w-8 mx-1 mb-4"
                style={{
                  background: isDone ? "#22C55E" : "#27272A",
                  transition: "background 0.3s",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const [paying, setPaying] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(order.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Order cancelled.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleRetryPayment = async () => {
    setPaying(true);
    try {
      const paymentData = await paymentsApi.createPayment(order.id);
      openRazorpayCheckout(
        paymentData,
        { name: user?.name, phone: user?.phone },
        {
          onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["my-orders"] });
            toast.success("Payment successful! 🎉");
            setPaying(false);
          },
          onFailure: (err) => {
            toast.error(`Payment failed: ${err}`);
            setPaying(false);
          },
          onDismiss: () => setPaying(false),
        },
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
      setPaying(false);
    }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      {/* Order header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #1A1A1D" }}
      >
        <div>
          <p className="text-xs text-[#52525B]">Order #{order.id}</p>
          <p className="text-sm font-semibold text-[#FAFAFA] mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </p>
        </div>
        <Badge label={order.status} dot />
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Items */}
        <div className="space-y-1.5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#A1A1AA]">
                {item.product_name ?? `Product #${item.product_id}`} × {item.quantity}
              </span>
              <span className="font-medium text-[#FAFAFA]">₹{Number(item.subtotal).toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total + actions */}
        <div
          className="flex items-center justify-between pt-2"
          style={{ borderTop: "1px dashed #27272A" }}
        >
          <div>
            <p className="text-xs text-[#52525B]">Total</p>
            <p className="text-base font-black text-[#FAFAFA]">
              ₹{Number(order.total_amount).toFixed(2)}
            </p>
          </div>

          <div className="flex gap-2">
            {order.status === "pending" && (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  loading={paying}
                  onClick={handleRetryPayment}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                >
                  Pay Now
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancelMutation.isPending}
                  onClick={() => cancelMutation.mutate()}
                  icon={<XCircle className="w-3.5 h-3.5" />}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Status timeline */}
        <StatusTimeline status={order.status} />
      </div>
    </div>
  );
}

export default function CustomerOrdersPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => ordersApi.myOrders({ page: 1, page_size: 30 }).then((r) => r.data),
  });

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B" }}>
      <TopBar
        title="My Orders"
        action={
          <button
            onClick={() => refetch()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52525B] hover:text-[#FAFAFA] hover:bg-white/5 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        }
      />

      <div className="px-4 py-5 space-y-3 pb-24">
        {/* Section header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-[#FAFAFA]">Orders</h2>
          {!isLoading && data && (
            <p className="text-xs text-[#52525B]">{data.items.length} total</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No orders yet"
            description="Your orders will appear here once you place them"
          />
        ) : (
          data.items.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  );
}
