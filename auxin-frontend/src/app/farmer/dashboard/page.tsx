"use client";
/**
 * app/farmer/dashboard/page.tsx — Auxin v2.0
 * Shopify Seller-inspired farmer dashboard with dark theme.
 */

import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, Package, ClipboardList, CheckCircle2, Clock,
  ArrowRight, IndianRupee,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatCard, Card, Badge, EmptyState, Spinner } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/orders";
import Link from "next/link";

export default function FarmerDashboardPage() {
  const { user } = useAuthStore();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["farmer-orders-stats"],
    queryFn: () => ordersApi.farmerOrders({ page: 1, page_size: 100 }).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const orders = ordersData?.items ?? [];
  const pending   = orders.filter((o) => o.status === "pending");
  const accepted  = orders.filter((o) => o.status === "accepted");
  const completed = orders.filter((o) => o.status === "completed");
  const revenue   = completed.reduce((s, o) => s + Number(o.total_amount), 0);

  const firstName = user?.name?.split(" ")[0] ?? "Farmer";

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0B" }}>
      <TopBar title="Dashboard" />

      <div className="px-4 py-5 space-y-5">
        {/* Greeting */}
        <div
          className="rounded-2xl px-5 py-5"
          style={{
            background: "linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))",
            border: "1px solid rgba(34,197,94,0.2)",
          }}
        >
          <p className="text-sm text-[#22C55E] font-medium mb-1">Good day 🌾</p>
          <h1 className="text-2xl font-black text-[#FAFAFA]">Hey, {firstName}</h1>
          <p className="text-sm text-[#71717A] mt-1">Here's how your farm is performing</p>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Total Revenue"
              value={`₹${revenue.toFixed(0)}`}
              icon={<IndianRupee className="w-4 h-4" />}
              color="green"
              trend="up"
              trendLabel="From completed orders"
            />
            <StatCard
              label="Completed Orders"
              value={completed.length}
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="blue"
            />
            <StatCard
              label="Active Orders"
              value={accepted.length}
              icon={<ClipboardList className="w-4 h-4" />}
              color="purple"
            />
            <StatCard
              label="Pending Review"
              value={pending.length}
              icon={<Clock className="w-4 h-4" />}
              color="amber"
            />
          </div>
        )}

        {/* Pending orders — need attention */}
        {!isLoading && pending.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#FAFAFA]">
                Needs Attention
              </h2>
              <Link
                href="/farmer/orders"
                className="text-xs font-medium text-[#22C55E] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {pending.slice(0, 3).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-2xl px-4 py-3"
                  style={{ background: "#111113", border: "1px solid #27272A" }}
                >
                  <div>
                    <p className="text-sm font-semibold text-[#FAFAFA]">Order #{o.id}</p>
                    <p className="text-xs text-[#71717A] mt-0.5">
                      ₹{Number(o.total_amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge label="pending" dot />
                    <Link
                      href="/farmer/orders"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#52525B] hover:text-[#FAFAFA]"
                      style={{ background: "#1F1F23" }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA] mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/farmer/products">
              <div
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[0.98] cursor-pointer"
                style={{ background: "#111113", border: "1px solid #27272A" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.1)" }}
                >
                  <Package className="w-5 h-5 text-[#22C55E]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#FAFAFA]">My Products</p>
                  <p className="text-xs text-[#71717A] mt-0.5">Manage listings</p>
                </div>
              </div>
            </Link>
            <Link href="/farmer/orders">
              <div
                className="rounded-2xl p-4 flex flex-col gap-3 transition-all active:scale-[0.98] cursor-pointer"
                style={{ background: "#111113", border: "1px solid #27272A" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.1)" }}
                >
                  <ClipboardList className="w-5 h-5 text-[#F59E0B]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#FAFAFA]">Orders</p>
                  <p className="text-xs text-[#71717A] mt-0.5">Accept or reject</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Empty state if no orders */}
        {!isLoading && orders.length === 0 && (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8" />}
            title="No orders yet"
            description="Add products to start receiving orders from customers"
            action={
              <Button
                onClick={() => {}}
                icon={<Package className="w-4 h-4" />}
              >
                <Link href="/farmer/products">Add Products</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
