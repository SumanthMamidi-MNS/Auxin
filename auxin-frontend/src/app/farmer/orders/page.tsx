"use client";
/**
 * app/farmer/orders/page.tsx — Auxin v2.0
 * Premium dark farmer order management with accept/reject flow.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ClipboardList, Package } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState, Spinner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ordersApi } from "@/lib/orders";
import { getErrorMessage } from "@/lib/api";
import type { Order } from "@/types";
import toast from "react-hot-toast";

const TABS = ["all", "pending", "accepted", "completed", "rejected"] as const;
type Tab = typeof TABS[number];

function FarmerOrderCard({ order }: { order: Order }) {
  const qc = useQueryClient();

  const accept = useMutation({
    mutationFn: () => ordersApi.accept(order.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      toast.success(`Order #${order.id} accepted! 🎉`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const reject = useMutation({
    mutationFn: () => ordersApi.reject(order.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-orders"] });
      toast(`Order #${order.id} rejected.`, { icon: "✗" });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid #1A1A1D" }}
      >
        <div>
          <p className="text-xs text-[#52525B]">
            {new Date(order.created_at).toLocaleString("en-IN", {
              day: "numeric", month: "short",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          <p className="text-sm font-bold text-[#FAFAFA] mt-0.5">Order #{order.id}</p>
        </div>
        <Badge label={order.status} dot />
      </div>

      {/* Items */}
      <div className="px-4 py-3">
        <div
          className="rounded-xl p-3 space-y-1.5 mb-3"
          style={{ background: "#18181B" }}
        >
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-[#A1A1AA]">
                {item.product_name ?? `Product #${item.product_id}`} × {item.quantity}
              </span>
              <span className="font-medium text-[#FAFAFA]">
                ₹{Number(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Total + actions */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#52525B]">Total</p>
            <p className="text-base font-black text-[#22C55E]">
              ₹{Number(order.total_amount).toFixed(2)}
            </p>
          </div>

          {order.status === "pending" && (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                loading={reject.isPending}
                disabled={accept.isPending}
                icon={<XCircle className="w-3.5 h-3.5" />}
                onClick={() => reject.mutate()}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={accept.isPending}
                disabled={reject.isPending}
                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                onClick={() => accept.mutate()}
              >
                Accept
              </Button>
            </div>
          )}

          {order.status === "accepted" && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22C55E" }}
            >
              Processing
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FarmerOrdersPage() {
  const [tab, setTab] = useState<Tab>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["farmer-orders", tab],
    queryFn: () =>
      ordersApi.farmerOrders({
        status: tab === "all" ? undefined : tab,
        page: 1,
        page_size: 50,
      }).then((r) => r.data),
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0B" }}>
      <TopBar title="Incoming Orders" />

      {/* Tab filter */}
      <div className="px-4 pt-4 pb-2">
        <div
          className="flex gap-1.5 p-1 rounded-2xl overflow-x-auto scrollbar-hide"
          style={{ background: "#111113", border: "1px solid #27272A" }}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-150"
              style={
                tab === t
                  ? { background: "#22C55E", color: "#052E16" }
                  : { color: "#71717A" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-5 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !data?.items?.length ? (
          <EmptyState
            icon={<ClipboardList className="w-8 h-8" />}
            title="No orders"
            description={`No ${tab === "all" ? "" : tab + " "}orders at the moment.`}
          />
        ) : (
          <>
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-[#52525B]">{data.items.length} orders</p>
            </div>
            {data.items.map((o) => (
              <FarmerOrderCard key={o.id} order={o} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
