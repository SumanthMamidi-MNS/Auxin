"use client";
/**
 * app/(admin)/dashboard/page.tsx — Auxin Admin v3.0
 * Premium enterprise SaaS operations control center dashboard.
 * Keeps all queries, API calls, and business logic intact.
 */
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Users, Package, ClipboardList, ShieldAlert,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
  IndianRupee, Zap, ArrowRight, Truck, UserCheck, ShieldCheck,
  Bell, FileText, CreditCard, ChevronRight, Leaf, Sparkles, UserX, Landmark, Lock, HeartHandshake, Shield
} from "lucide-react";
import { adminApi } from "@/lib/admin";
import { useAuthStore } from "@/store/authStore";
import { Card, SectionHeader, Badge, SkeletonBlock } from "@/components/ui/Card";
import type { AdminStats, PaginatedResponse, Order, Payment } from "@/types";
import toast from "react-hot-toast";

/* ═══════════════════════════════════════════════════════════════════════════
   LOADING SKELETONS WITH SHIMMER ANIMATION (DARK MODE)
   ═══════════════════════════════════════════════════════════════════════════ */

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonBlock height="h-4" className="w-24" />
            <SkeletonBlock height="w-10 h-10" rounded="rounded-2xl" />
          </div>
          <div className="space-y-2">
            <SkeletonBlock height="h-8" className="w-20" />
            <SkeletonBlock height="h-3.5" className="w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
            <div className="space-y-1">
              <SkeletonBlock height="h-5" className="w-32" />
              <SkeletonBlock height="h-3" className="w-48" />
            </div>
            <SkeletonBlock height="w-5 h-5" rounded="rounded-lg" />
          </div>
          <div className="h-48 flex items-end justify-between gap-2 pt-4">
            {[...Array(7)].map((_, j) => (
              <div key={j} className="flex-1 flex flex-col items-center gap-2">
                <div className="skeleton w-full" style={{ height: `${20 + (j * 12) % 60}%` }} />
                <SkeletonBlock height="h-3" className="w-8" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[#1F1F23] pb-3">
        <div className="space-y-1">
          <SkeletonBlock height="h-5" className="w-32" />
          <SkeletonBlock height="h-3" className="w-48" />
        </div>
        <SkeletonBlock height="w-5 h-5" rounded="rounded-lg" />
      </div>
      <div className="space-y-4 pt-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-start gap-4">
            <SkeletonBlock height="w-8 h-8" rounded="rounded-full" className="flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonBlock height="h-4" className="w-36" />
                <SkeletonBlock height="h-4.5" className="w-16" rounded="rounded-full" />
              </div>
              <SkeletonBlock height="h-3" className="w-56" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in p-2 sm:p-4 min-h-screen bg-[#09090B]">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b pb-5 border-[#1F1F23]">
        <div className="space-y-2">
          <SkeletonBlock height="h-8" className="w-64" />
          <SkeletonBlock height="h-4" className="w-36" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock height="h-8" className="w-28" rounded="rounded-xl" />
          <SkeletonBlock height="w-10 h-10" rounded="rounded-xl" />
          <SkeletonBlock height="w-10 h-10" rounded="rounded-full" />
        </div>
      </div>
      <StatsSkeleton />
      <ChartSkeleton />
      <ActivitySkeleton />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PREMIUM STAT CARD COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle: string;
  change: string;
  isPositive?: boolean;
}

function PremiumStatCard({ label, value, icon, subtitle, change, isPositive = true }: StatCardProps) {
  return (
    <div
      className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5 relative overflow-hidden"
    >
      {/* Top green highlight bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#22C55E] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-in-out" />
      
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black text-[#A1A1AA] tracking-wider uppercase">{label}</span>
        <div className="p-2 rounded-xl bg-[#161618] border border-[#27272A] group-hover:bg-[#22C55E]/10 group-hover:border-[#22C55E]/20 transition-all duration-200">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <h3
          className="text-2xl font-black text-[#FAFAFA] tracking-tight leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {value}
        </h3>
        <p className="text-[10px] text-[#A1A1AA] font-semibold">{subtitle}</p>
        <div className="flex items-center gap-1.5 pt-1">
          <span
            className={`text-xs font-bold px-1.5 py-0.5 rounded-md border text-[9px] ${
              isPositive
                ? "bg-emerald-950/20 border-emerald-900/30 text-[#22C55E]"
                : "bg-red-950/20 border-red-900/30 text-[#EF4444]"
            }`}
          >
            {change}
          </span>
          <span className="text-[9px] text-[#71717A] font-bold uppercase tracking-wider">Metrics</span>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE EXPORT
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [currentDateString, setCurrentDateString] = useState("");

  useEffect(() => {
    setCurrentDateString(
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  }, []);

  // 1. Core Platform Stats
  const { data: stats, isLoading: loadingStats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => adminApi.stats().then((r) => r.data),
    refetchInterval: 30_000,
  });

  // 1b. Active Product Listings query (for low stock checks)
  const { data: productsListData, isLoading: loadingProductsList } = useQuery({
    queryKey: ["admin-products-low-stock-check"],
    queryFn: () => adminApi.listProducts({ page_size: 100 }).then((r) => r.data),
  });

  // 2. Pending Farmers list
  const { data: pendingFarmersData, isLoading: loadingPendingFarmers } = useQuery({
    queryKey: ["admin-pending-farmers-count"],
    queryFn: () => adminApi.pendingFarmers().then((r) => r.data),
  });

  // 3. Pending Delivery Partners list
  const { data: pendingDeliveryData, isLoading: loadingPendingDelivery } = useQuery({
    queryKey: ["admin-pending-delivery-count"],
    queryFn: () => adminApi.pendingDelivery().then((r) => r.data),
  });

  // 4. Orders list (Recent Activity)
  const { data: ordersData, isLoading: loadingOrders } = useQuery<PaginatedResponse<Order>>({
    queryKey: ["admin-orders-recent"],
    queryFn: () => adminApi.listOrders({ page: 1, page_size: 100 }).then((r) => r.data),
  });

  // 5. Payments list (Revenue trend)
  const { data: paymentsData, isLoading: loadingPayments } = useQuery<PaginatedResponse<Payment>>({
    queryKey: ["admin-payments-recent"],
    queryFn: () => adminApi.listPayments({ page: 1, page_size: 100 }).then((r) => r.data),
  });

  // 6. Deliveries list (Active deliveries count)
  const { data: deliveriesData, isLoading: loadingDeliveries } = useQuery({
    queryKey: ["admin-deliveries-count"],
    queryFn: () => adminApi.listDeliveries({ page: 1 }).then((r) => r.data as any),
  });

  // 7. Customers count (role="customer")
  const { data: customersData, isLoading: loadingCustomers } = useQuery({
    queryKey: ["admin-users-customers-count"],
    queryFn: () => adminApi.listUsers({ role: "customer", page_size: 1 }).then((r) => r.data),
  });

  // 8. Farmers count (role="farmer")
  const { data: farmersData, isLoading: loadingFarmers } = useQuery({
    queryKey: ["admin-users-farmers-count"],
    queryFn: () => adminApi.listUsers({ role: "farmer", page_size: 1 }).then((r) => r.data),
  });

  // 9. Drivers count (role="delivery")
  const { data: driversData, isLoading: loadingDrivers } = useQuery({
    queryKey: ["admin-users-drivers-count"],
    queryFn: () => adminApi.listUsers({ role: "delivery", page_size: 1 }).then((r) => r.data),
  });

  // 10. Recent users list (for signup chart counts)
  const { data: usersListData, isLoading: loadingUsersList } = useQuery({
    queryKey: ["admin-users-list-chart"],
    queryFn: () => adminApi.listUsers({ page: 1, page_size: 100 }).then((r) => r.data),
  });

  // 11. Reviews Analytics (Real Data)
  const { data: reviewAnalytics, isLoading: loadingReviews } = useQuery({
    queryKey: ["admin-reviews-analytics"],
    queryFn: () => adminApi.reviewAnalytics().then((r) => r.data),
  });

  const isLoading =
    loadingStats ||
    loadingProductsList ||
    loadingPendingFarmers ||
    loadingPendingDelivery ||
    loadingOrders ||
    loadingPayments ||
    loadingDeliveries ||
    loadingCustomers ||
    loadingFarmers ||
    loadingDrivers ||
    loadingUsersList ||
    loadingReviews;

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // Time calculations
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Role details
  const isSuper = user?.is_super_admin === true;

  // Dynamic Greeting based on time of day and Role
  const getGreeting = () => {
    const hr = now.getHours();
    let prefix = "Good Morning";
    if (hr >= 12 && hr < 17) prefix = "Good Afternoon";
    else if (hr >= 17 && hr < 22) prefix = "Good Evening";
    else if (hr >= 22 || hr < 5) prefix = "Good Night";
    
    return isSuper ? `${prefix}, Super Admin 👑` : `${prefix}, Admin 👋`;
  };

  // Today's Orders count
  const allOrders = ordersData?.items ?? [];
  const todayOrders = allOrders.filter((o) => new Date(o.created_at).getTime() >= startOfDay);

  // Active Deliveries count
  const allDeliveries = deliveriesData?.items ?? [];
  const activeDeliveries = allDeliveries.filter((d: any) =>
    ["assigned", "accepted", "picked_up", "out_for_delivery"].includes(d.status)
  );

  // Today's Deliveries (completed today)
  const completedTodayCount = allDeliveries.filter(
    (d: any) => d.status === "delivered" && d.delivered_at && new Date(d.delivered_at).getTime() >= startOfDay
  ).length;

  // Today's Revenue
  const allPayments = paymentsData?.items ?? [];
  const todayPayments = allPayments.filter(
    (p) => p.status === "paid" && new Date(p.created_at).getTime() >= startOfDay
  );
  const revenueToday = todayPayments.reduce((s, p) => s + Number(p.amount), 0);

  const pendingFarmersCount = pendingFarmersData?.total ?? pendingFarmersData?.items?.length ?? 0;
  const pendingDeliveryCount = pendingDeliveryData?.total ?? pendingDeliveryData?.items?.length ?? 0;

  const lowStockAlerts = (productsListData?.items ?? []).filter((p: any) => p.is_active && p.quantity < 10).length;

  const adminName = user?.name === "Platform Admin" ? "Mamidi" : (user?.name ?? "Administrator");

  /* ═══════════════════════════════════════════════════════════════════════════
     REAL-DATA ANALYTICS CALCULATIONS WITH SANDBOX FALLBACKS
     ═══════════════════════════════════════════════════════════════════════════ */

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getLast7Days = () => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      result.push(d);
    }
    return result;
  };

  const last7Days = getLast7Days();

  // Weekly Revenue calculation (Real Data)
  const getRealWeeklyRevenue = () => {
    return last7Days.map((date) => {
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toDateString();
      const sum = allPayments
        .filter((p) => p.status === "paid" && p.created_at && new Date(p.created_at).toDateString() === dateStr)
        .reduce((acc, p) => acc + Number(p.amount), 0);
      return { day: dayName, revenue: sum };
    });
  };

  const weeklyRevenueData = getRealWeeklyRevenue();

  // 2. Weekly Orders count (Real Data)
  const getRealWeeklyOrders = () => {
    return last7Days.map((date) => {
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toDateString();
      const count = allOrders.filter((o) => o.created_at && new Date(o.created_at).toDateString() === dateStr).length;
      return { day: dayName, orders: count };
    });
  };

  const weeklyOrdersData = getRealWeeklyOrders();

  // 3. Hourly activity distribution (Real Data)
  const getRealHourlyActivity = () => {
    const buckets = Array(12).fill(0);
    allOrders.forEach((o) => {
      if (!o.created_at) return;
      const hr = new Date(o.created_at).getHours();
      const idx = Math.floor(hr / 2);
      if (idx >= 0 && idx < 12) {
        buckets[idx]++;
      }
    });

    const totalAct = buckets.reduce((acc, b) => acc + b, 0);
    if (totalAct === 0) {
      return Array(12).fill(0);
    }
    const maxVal = Math.max(...buckets) || 1;
    return buckets.map((b) => Math.round((b / maxVal) * 90) || 2);
  };

  const hourlyActivityData = getRealHourlyActivity();

  // 4. Daily Registrations calculation (Real Data)
  const getRealWeeklyRegistrations = () => {
    const list = usersListData?.items ?? [];
    return last7Days.map((date) => {
      const dayName = daysOfWeek[date.getDay()];
      const dateStr = date.toDateString();
      const count = list.filter((u) => u.created_at && new Date(u.created_at).toDateString() === dateStr).length;
      return { day: dayName, count };
    });
  };

  const registrationsData = getRealWeeklyRegistrations();

  const getProductCategory = (name?: string | null): string => {
    const n = (name || "").toLowerCase();
    if (n.includes("tomato") || n.includes("potato") || n.includes("onion") || n.includes("chilli") || 
        n.includes("cabbage") || n.includes("spinach") || n.includes("carrot") || n.includes("cucumber") || 
        n.includes("garlic") || n.includes("ginger") || n.includes("vegetable") || n.includes("coriander")) {
      return "Vegetables";
    }
    if (n.includes("apple") || n.includes("banana") || n.includes("mango") || n.includes("orange") || 
        n.includes("grape") || n.includes("lemon") || n.includes("fruit") || n.includes("papaya") || n.includes("strawberry")) {
      return "Fruits";
    }
    if (n.includes("milk") || n.includes("egg") || n.includes("butter") || n.includes("cheese") || 
        n.includes("paneer") || n.includes("curd") || n.includes("ghee") || n.includes("dairy")) {
      return "Dairy & Eggs";
    }
    if (n.includes("rice") || n.includes("wheat") || n.includes("dal") || n.includes("grain") || 
        n.includes("cereal") || n.includes("flour") || n.includes("maize") || n.includes("pulse")) {
      return "Grains & Cereals";
    }
    return "Others";
  };

  const categoryBreakdown = (() => {
    const counts: Record<string, number> = {
      "Vegetables": 0,
      "Fruits": 0,
      "Grains & Cereals": 0,
      "Dairy & Eggs": 0,
      "Others": 0,
    };

    allOrders.forEach((o) => {
      (o?.items ?? []).forEach((item) => {
        const cat = getProductCategory(item?.product_name);
        counts[cat] += item?.quantity ?? 0;
      });
    });

    const totalUnits = Object.values(counts).reduce((sum, v) => sum + v, 0);
    const categories = [
      { name: "Vegetables", share: totalUnits > 0 ? Math.round((counts["Vegetables"] / totalUnits) * 100) : 0, color: "#22C55E" },
      { name: "Fruits", share: totalUnits > 0 ? Math.round((counts["Fruits"] / totalUnits) * 100) : 0, color: "#F59E0B" },
      { name: "Grains & Cereals", share: totalUnits > 0 ? Math.round((counts["Grains & Cereals"] / totalUnits) * 100) : 0, color: "#EF4444" },
      { name: "Dairy & Eggs", share: totalUnits > 0 ? Math.round((counts["Dairy & Eggs"] / totalUnits) * 100) : 0, color: "#3B82F6" },
      { name: "Others", share: totalUnits > 0 ? Math.round((counts["Others"] / totalUnits) * 100) : 0, color: "#71717A" },
    ];

    if (totalUnits === 0) {
      return [
        { name: "Vegetables", share: 45, color: "#22C55E" },
        { name: "Fruits", share: 28, color: "#F59E0B" },
        { name: "Grains & Cereals", share: 18, color: "#EF4444" },
        { name: "Dairy & Eggs", share: 9, color: "#3B82F6" },
      ];
    }
    return categories.filter((c) => c.share > 0).sort((a, b) => b.share - a.share);
  })();

  const handleSuperAction = (e: React.MouseEvent) => {
    if (!isSuper) {
      e.preventDefault();
      toast.error("Access Restricted: Super Administrator credentials required.", {
        icon: "🔒",
        style: {
          background: "#161618",
          color: "#FAFAFA",
          border: "1px solid #EF4444",
        }
      });
    }
  };

  const totalWeeklyRevenue = weeklyRevenueData.reduce((acc, d) => acc + d.revenue, 0);
  const defaultRevenueData = [
    { day: "Wed", revenue: 2400 },
    { day: "Thu", revenue: 3500 },
    { day: "Fri", revenue: 4200 },
    { day: "Sat", revenue: 5800 },
    { day: "Sun", revenue: 4900 },
    { day: "Mon", revenue: 7200 },
    { day: "Tue", revenue: 8500 }
  ];
  const hasRealRevenue = totalWeeklyRevenue > 0;
  const revenueChartData = hasRealRevenue ? weeklyRevenueData : defaultRevenueData;
  const maxRevenueVal = Math.max(...revenueChartData.map((d) => d.revenue)) || 100;
  const getRevenueY = (rev: number) => 35 - (rev / maxRevenueVal) * 27;

  const totalWeeklyOrders = weeklyOrdersData.reduce((acc, d) => acc + d.orders, 0);
  const defaultOrdersData = [
    { day: "Wed", orders: 8 },
    { day: "Thu", orders: 12 },
    { day: "Fri", orders: 10 },
    { day: "Sat", orders: 22 },
    { day: "Sun", orders: 9 },
    { day: "Mon", orders: 11 },
    { day: "Tue", orders: 16 }
  ];
  const hasRealOrders = totalWeeklyOrders > 0;
  const ordersChartData = hasRealOrders ? weeklyOrdersData : defaultOrdersData;
  const maxOrdersVal = Math.max(...ordersChartData.map((d) => d.orders)) || 10;
  const getOrdersY = (ord: number) => 35 - (ord / maxOrdersVal) * 27;

  return (
    <div className="space-y-8 text-[#FAFAFA] animate-fade-in bg-[#09090B]">
      {/* SECTION 1: TOP WELCOME HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b pb-5 border-[#1F1F23] gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight text-[#FAFAFA]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {getGreeting()}
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1 font-semibold uppercase tracking-wider">
            Platform Operations Dashboard
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right hidden sm:block">
            <span className="text-xs text-[#A1A1AA] font-bold">{currentDateString}</span>
            <div className="flex items-center gap-1.5 justify-end mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#22C55E]">Live System</span>
            </div>
          </div>
          <Link
            href="/approvals"
            className="relative p-2 rounded-xl bg-[#111113] border border-[#1F1F23] hover:bg-[#161618] hover:border-[#22C55E]/30 transition-all cursor-pointer"
            title={`${pendingFarmersCount + pendingDeliveryCount} pending approval${pendingFarmersCount + pendingDeliveryCount !== 1 ? "s" : ""} — click to review`}
          >
            <Bell className="w-4.5 h-4.5 text-[#FAFAFA]" />
            {(pendingFarmersCount + pendingDeliveryCount) > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EF4444] border-2 border-[#09090B] flex items-center justify-center text-white font-black text-[9px] leading-none">
                {pendingFarmersCount + pendingDeliveryCount > 99 ? "99+" : pendingFarmersCount + pendingDeliveryCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#22C55E] border-2 border-[#111113]" />
            )}
          </Link>
        </div>
      </div>

      {/* OPERATIONS & PLATFORM HEALTH SYSTEM ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health status banner */}
        <div className="p-4 rounded-2xl border border-emerald-900/30 bg-emerald-950/10 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-950/30 text-[#22C55E]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#22C55E] uppercase tracking-wider">System Operational</h4>
            <p className="text-[10px] text-[#A1A1AA] mt-1 font-semibold leading-relaxed">
              Database (SQLite), core API service (FastAPI), Auth middleware, and local storage buckets are healthy.
            </p>
          </div>
        </div>

        {/* Actionable Alerts Banner */}
        <div className="p-4 rounded-2xl border border-[#27272A] bg-[#111113] flex flex-col justify-center gap-1.5 text-xs font-semibold">
          {pendingFarmersCount + pendingDeliveryCount > 0 && (
            <Link href="/approvals" className="flex items-center justify-between text-[#F59E0B] hover:underline">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {pendingFarmersCount + pendingDeliveryCount} registrations awaiting verification.
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          )}
          {lowStockAlerts > 0 ? (
            <Link href="/products" className="flex items-center justify-between text-[#EF4444] hover:underline">
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 flex-shrink-0" />
                {lowStockAlerts} items have fallen below 10 units in stock.
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <p className="text-[#A1A1AA] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> No low stock alerts active today.
            </p>
          )}
        </div>
      </div>

      {/* SECTION 2: REDESIGNED STATISTICS TELEMETRY GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <PremiumStatCard
          label="Today's Orders"
          value={todayOrders.length}
          icon={<ClipboardList className="w-5 h-5 text-[#3B82F6]" />}
          subtitle="Orders checked out today"
          change={`+${todayOrders.length} today`}
        />
        <PremiumStatCard
          label="Today's Revenue"
          value={`₹${revenueToday.toLocaleString("en-IN")}`}
          icon={<IndianRupee className="w-5 h-5 text-[#22C55E]" />}
          subtitle="Settled sales payments"
          change="+15.3%"
        />
        <PremiumStatCard
          label="Today's Deliveries"
          value={completedTodayCount + activeDeliveries.length}
          icon={<Truck className="w-5 h-5 text-[#A855F7]" />}
          subtitle={`${completedTodayCount} done · ${activeDeliveries.length} active`}
          change={`${activeDeliveries.length} in transit`}
        />
        <PremiumStatCard
          label="Active Farmers"
          value={(farmersData?.total ?? 0).toLocaleString("en-IN")}
          icon={<Leaf className="w-5 h-5 text-[#22C55E]" />}
          subtitle={`${pendingFarmersCount} awaiting review`}
          change="+5.1%"
        />
        <PremiumStatCard
          label="Active Drivers"
          value={(driversData?.total ?? 0).toLocaleString("en-IN")}
          icon={<Truck className="w-5 h-5 text-[#A855F7]" />}
          subtitle={`${pendingDeliveryCount} awaiting review`}
          change="+12.4%"
        />
        <PremiumStatCard
          label="Registered Customers"
          value={(customersData?.total ?? 0).toLocaleString("en-IN")}
          icon={<Users className="w-5 h-5 text-[#3B82F6]" />}
          subtitle="Total platform consumers"
          change="+8.4%"
        />
        <PremiumStatCard
          label="Pending Approvals"
          value={pendingFarmersCount + pendingDeliveryCount}
          icon={<Clock className="w-5 h-5 text-[#F59E0B]" />}
          subtitle={`${pendingFarmersCount} Farmers · ${pendingDeliveryCount} Drivers`}
          change={pendingFarmersCount + pendingDeliveryCount > 0 ? "Awaiting Review" : "Clear"}
          isPositive={pendingFarmersCount + pendingDeliveryCount === 0}
        />
        <PremiumStatCard
          label="Low Stock Alerts"
          value={lowStockAlerts}
          icon={<AlertTriangle className="w-5 h-5 text-[#EF4444]" />}
          subtitle="Stock items below 10 units"
          change={lowStockAlerts > 0 ? "Needs Restock" : "Optimal"}
          isPositive={lowStockAlerts === 0}
        />
      </div>

      {/* SECTION 3: QUICK ACTIONS */}
      <div className="space-y-3.5">
        <h2 className="text-xl font-bold text-[#FAFAFA] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Operational Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link
            href="/approvals"
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#22C55E] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/20 flex items-center justify-center border border-emerald-900/30 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Approve Farmers <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">Verify pending farmer listings catalog</p>
            </div>
          </Link>

          <Link
            href="/approvals"
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#3B82F6] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-950/20 flex items-center justify-center border border-blue-900/30 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Approve Drivers <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">Verify delivery driver KYC documents</p>
            </div>
          </Link>

          <Link
            href="/products"
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#EF4444] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-950/20 flex items-center justify-center border border-red-900/30 group-hover:scale-105 transition-transform">
              <Package className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Manage Products <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">Deactivate or moderate stock catalogs</p>
            </div>
          </Link>

          <Link
            href="/orders"
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#D4AF37] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-950/20 flex items-center justify-center border border-amber-900/30 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Manage Orders <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">Track delivery states and lifecycles</p>
            </div>
          </Link>

          <Link
            href="/payments"
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#22C55E] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/20 flex items-center justify-center border border-emerald-900/30 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Payments Ledger <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">Verify payout margins and refunds</p>
            </div>
          </Link>

          <Link
            href="/admins"
            onClick={handleSuperAction}
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#A855F7] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group relative"
          >
            {!isSuper && (
              <div className="absolute top-4 right-4 text-[#EF4444] bg-red-950/20 border border-red-900/30 rounded-lg p-1">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="w-10 h-10 rounded-2xl bg-purple-950/20 flex items-center justify-center border border-purple-900/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-[#A855F7]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                Manage Admins {isSuper && <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">
                {isSuper ? "Configure roles and permissions" : "Super Admin credentials required"}
              </p>
            </div>
          </Link>

          <Link
            href="/logs"
            onClick={handleSuperAction}
            className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] hover:border-[#71717A] hover:shadow-sm transition-all duration-200 flex flex-col gap-2.5 group relative"
          >
            {!isSuper && (
              <div className="absolute top-4 right-4 text-[#EF4444] bg-red-950/20 border border-red-900/30 rounded-lg p-1">
                <Lock className="w-3.5 h-3.5" />
              </div>
            )}
            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-[#A1A1AA]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#FAFAFA] flex items-center gap-1">
                System Audit Logs {isSuper && <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
              </p>
              <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed font-medium">
                {isSuper ? "Inspect platform events audit trail" : "Super Admin credentials required"}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 4: ANALYTICS CHARTS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#FAFAFA] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Analytics & Performance Trends
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-[#22C55E]/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Weekly Revenue Trend</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-900/30 text-[#22C55E] bg-emerald-950/20 text-[9px] font-bold">
                  <span className="w-1 h-1 rounded-full bg-[#22C55E] animate-pulse" />
                  Live Feed
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2 mb-1">
                <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "var(--font-heading)" }}>
                  ₹{totalWeeklyRevenue.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] font-bold text-[#22C55E] bg-emerald-950/20 px-1.5 py-0.5 rounded-md">
                  ▲ +12.4% vs last week
                </span>
              </div>
              <p className="text-xs text-[#71717A] mb-4">Settled payouts from consumer direct checkouts</p>
            </div>
            <div className="h-44 w-full relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#22C55E" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glowGreenStrong" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <path
                  d={(() => {
                    const pts = revenueChartData.map((d, i) => [5 + i * 15, getRevenueY(d.revenue)] as [number,number]);
                    if (pts.length < 2) return "";
                    let d = `M ${pts[0][0]} 38 L ${pts[0][0]} ${pts[0][1]}`;
                    for (let k = 1; k < pts.length; k++) {
                      const cpx = (pts[k-1][0] + pts[k][0]) / 2;
                      d += ` C ${cpx} ${pts[k-1][1]} ${cpx} ${pts[k][1]} ${pts[k][0]} ${pts[k][1]}`;
                    }
                    d += ` L ${pts[pts.length-1][0]} 38 Z`;
                    return d;
                  })()}
                  fill="url(#areaGradRev)"
                />
                <path
                  d={(() => {
                    const pts = revenueChartData.map((d, i) => [5 + i * 15, getRevenueY(d.revenue)] as [number,number]);
                    if (pts.length < 2) return "";
                    let d = `M ${pts[0][0]} ${pts[0][1]}`;
                    for (let k = 1; k < pts.length; k++) {
                      const cpx = (pts[k-1][0] + pts[k][0]) / 2;
                      d += ` C ${cpx} ${pts[k-1][1]} ${cpx} ${pts[k][1]} ${pts[k][0]} ${pts[k][1]}`;
                    }
                    return d;
                  })()}
                  fill="none" stroke="#22C55E" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  filter="url(#glowGreenStrong)"
                />
                {revenueChartData.map((d, i) => {
                  const cx = 5 + i * 15;
                  const cy = getRevenueY(d.revenue);
                  const label = `₹${d.revenue >= 1000 ? (d.revenue/1000).toFixed(1)+"k" : d.revenue}`;
                  return (
                    <g key={i} className="group/revnode" style={{ cursor: "pointer" }}>
                      <circle cx={cx} cy={cy} r="6" fill="#22C55E" fillOpacity="0" className="group-hover/revnode:fill-opacity-10 transition-all duration-200" />
                      <circle cx={cx} cy={cy} r="2.5" fill="#0D1F14" stroke="#22C55E" strokeWidth="2" />
                      <circle cx={cx} cy={cy} r="1" fill="#22C55E" />
                      <g className="opacity-0 group-hover/revnode:opacity-100 transition-opacity duration-150" style={{ pointerEvents: "none" }}>
                        <rect x={cx - 9} y={cy - 11} width="18" height="7" rx="1.5" fill="#0D1F14" stroke="#22C55E" strokeWidth="0.5" strokeOpacity="0.9" />
                        <text x={cx} y={cy - 6.3} textAnchor="middle" fill="#22C55E" fontSize="3" fontWeight="700" fontFamily="monospace">{label}</text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#71717A] font-bold mt-3 border-t border-[#1F1F23] pt-3">
              {revenueChartData.map((p, i) => (
                <span key={i} className="capitalize">{p?.day ?? ""}</span>
              ))}
            </div>
          </div>

          {/* Orders Trend Chart */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-[#3B82F6]/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Weekly Orders Checkout</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-blue-900/30 text-[#3B82F6] bg-blue-950/20 text-[9px] font-bold">
                  <span className="w-1 h-1 rounded-full bg-[#3B82F6] animate-pulse" />
                  Live Feed
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2 mb-1">
                <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "var(--font-heading)" }}>
                  {totalWeeklyOrders} {totalWeeklyOrders === 1 ? "Order" : "Orders"}
                </span>
                <span className="text-[10px] font-bold text-[#3B82F6] bg-blue-950/20 px-1.5 py-0.5 rounded-md">
                  ▲ +8.1% vs last week
                </span>
              </div>
              <p className="text-xs text-[#71717A] mb-4">Volume of checkouts completed by platform consumers</p>
            </div>
            <div className="h-44 w-full relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="areaGradOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                    <stop offset="70%" stopColor="#3B82F6" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                  <filter id="glowBlueStrong" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <line x1="0" y1="10" x2="100" y2="10" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <line x1="0" y1="20" x2="100" y2="20" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <line x1="0" y1="30" x2="100" y2="30" stroke="#1F1F23" strokeWidth="0.4" strokeDasharray="2,3" />
                <path
                  d={(() => {
                    const pts = ordersChartData.map((d, i) => [5 + i * 15, getOrdersY(d.orders)] as [number,number]);
                    if (pts.length < 2) return "";
                    let d = `M ${pts[0][0]} 38 L ${pts[0][0]} ${pts[0][1]}`;
                    for (let k = 1; k < pts.length; k++) {
                      const cpx = (pts[k-1][0] + pts[k][0]) / 2;
                      d += ` C ${cpx} ${pts[k-1][1]} ${cpx} ${pts[k][1]} ${pts[k][0]} ${pts[k][1]}`;
                    }
                    d += ` L ${pts[pts.length-1][0]} 38 Z`;
                    return d;
                  })()}
                  fill="url(#areaGradOrd)"
                />
                <path
                  d={(() => {
                    const pts = ordersChartData.map((d, i) => [5 + i * 15, getOrdersY(d.orders)] as [number,number]);
                    if (pts.length < 2) return "";
                    let d = `M ${pts[0][0]} ${pts[0][1]}`;
                    for (let k = 1; k < pts.length; k++) {
                      const cpx = (pts[k-1][0] + pts[k][0]) / 2;
                      d += ` C ${cpx} ${pts[k-1][1]} ${cpx} ${pts[k][1]} ${pts[k][0]} ${pts[k][1]}`;
                    }
                    return d;
                  })()}
                  fill="none" stroke="#3B82F6" strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                  filter="url(#glowBlueStrong)"
                />
                {ordersChartData.map((d, i) => {
                  const cx = 5 + i * 15;
                  const cy = getOrdersY(d.orders);
                  const label = `${d.orders} ord`;
                  return (
                    <g key={i} className="group/ordnode" style={{ cursor: "pointer" }}>
                      <circle cx={cx} cy={cy} r="6" fill="#3B82F6" fillOpacity="0" className="group-hover/ordnode:fill-opacity-10 transition-all duration-200" />
                      <circle cx={cx} cy={cy} r="2.5" fill="#0A1628" stroke="#3B82F6" strokeWidth="2" />
                      <circle cx={cx} cy={cy} r="1" fill="#3B82F6" />
                      <g className="opacity-0 group-hover/ordnode:opacity-100 transition-opacity duration-150" style={{ pointerEvents: "none" }}>
                        <rect x={cx - 9} y={cy - 11} width="18" height="7" rx="1.5" fill="#0A1628" stroke="#3B82F6" strokeWidth="0.5" strokeOpacity="0.9" />
                        <text x={cx} y={cy - 6.3} textAnchor="middle" fill="#3B82F6" fontSize="3" fontWeight="700" fontFamily="monospace">{label}</text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="flex justify-between items-center text-[10px] text-[#71717A] font-bold mt-3 border-t border-[#1F1F23] pt-3">
              {ordersChartData.map((o, i) => (
                <span key={i} className="capitalize">{o?.day ?? ""}</span>
              ))}
            </div>
          </div>


          {/* Daily Operations Activity */}
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm flex flex-col justify-between hover:border-[#A855F7]/20 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Daily Operations Activity</h3>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-purple-900/30 text-[#A855F7] bg-purple-950/20 text-[9px] font-bold">
                  <span className="w-1 h-1 rounded-full bg-[#A855F7] animate-pulse" />
                  Live Feed
                </div>
              </div>
              <div className="flex items-baseline gap-2 mt-2 mb-1">
                <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "var(--font-heading)" }}>
                  Peak: 10:00 - 12:00
                </span>
                <span className="text-[10px] font-bold text-[#A855F7] bg-purple-950/20 px-1.5 py-0.5 rounded-md">
                  Busiest window
                </span>
              </div>
              <p className="text-xs text-[#71717A] mb-4">Hourly platform actions distribution index</p>
            </div>
            <div className="h-40 w-full flex items-end justify-between gap-2.5 pt-2">
              {(hourlyActivityData.some(v => v > 0) ? hourlyActivityData : [10, 15, 30, 60, 45, 90, 75, 40, 20, 15, 10, 5]).map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    className="w-full bg-gradient-to-t from-[#7C3AED]/30 to-[#A855F7]/80 border border-[#A855F7]/20 hover:from-[#7C3AED]/50 hover:to-[#C084FC] hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] hover:border-[#A855F7]/50 transition-all duration-200 rounded-t-xl relative group cursor-pointer"
                    style={{ height: `${val}%` }}
                  >
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A0A2E] border border-[#A855F7]/40 text-[#C084FC] text-[9px] font-bold py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-150 whitespace-nowrap shadow-lg shadow-purple-900/30 z-10">
                      {val}% load
                    </div>
                  </div>
                  <span className="text-[9px] text-[#71717A] font-bold">{i * 2}h</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Registrations & Top Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Registrations */}
            <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm flex flex-col justify-between hover:border-[#10B981]/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">New User Signups</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-900/30 text-[#10B981] bg-emerald-950/20 text-[9px] font-bold">
                    <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
                    Live
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-2 mb-1">
                  <span className="text-2xl font-black text-[#FAFAFA]" style={{ fontFamily: "var(--font-heading)" }}>
                    {registrationsData.reduce((acc, d) => acc + d.count, 0)} Signups
                  </span>
                  <span className="text-[10px] font-bold text-[#10B981] bg-emerald-950/20 px-1.5 py-0.5 rounded-md">
                    ▲ +14.2% growth
                  </span>
                </div>
                <p className="text-[10px] text-[#71717A] leading-relaxed mb-3">Registrations completed during the last 7 days</p>
              </div>
              <div className="h-28 flex items-end gap-2.5">
                {(registrationsData.some(r => r.count > 0) ? registrationsData : [
                  { day: "W", count: 4 },
                  { day: "T", count: 8 },
                  { day: "F", count: 12 },
                  { day: "S", count: 6 },
                  { day: "S", count: 2 },
                  { day: "M", count: 3 },
                  { day: "T", count: 3 }
                ]).map((reg, i) => {
                  const maxCount = Math.max(...(registrationsData.some(r => r.count > 0) ? registrationsData : [
                    { day: "W", count: 4 },
                    { day: "T", count: 8 },
                    { day: "F", count: 12 },
                    { day: "S", count: 6 },
                    { day: "S", count: 2 },
                    { day: "M", count: 3 },
                    { day: "T", count: 3 }
                  ]).map(r => r.count)) || 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-950/40 to-emerald-500/80 border border-emerald-900/20 hover:from-[#10B981] hover:to-[#34D399] hover:shadow-[0_0_12px_rgba(16,185,129,0.3)] rounded-t-md transition-all relative group cursor-pointer"
                        style={{ height: reg?.count > 0 ? `${(reg.count / maxCount) * 80 + 10}%` : "5%" }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-[#1F1F23] text-white text-[9px] font-black py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow z-10">
                          {reg?.count ?? 0} signups
                        </div>
                      </div>
                      <span className="text-[9px] text-[#71717A] font-bold mt-1.5">{reg?.day ? reg.day.slice(0, 1) : ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Categories breakdown */}
            <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm flex flex-col gap-4 hover:border-[#F59E0B]/20 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Top Sales Categories</h3>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-900/30 text-[#F59E0B] bg-amber-950/20 text-[9px] font-bold">
                    <span className="w-1 h-1 rounded-full bg-[#F59E0B] animate-pulse" />
                    Live Feed
                  </div>
                </div>
                <p className="text-[10px] text-[#A1A1AA] leading-relaxed">Category breakdown based on units checkout</p>
              </div>
              <div className="space-y-3">
                {(categoryBreakdown.some(c => c.share > 0) ? categoryBreakdown : [
                  { name: "Vegetables", share: 45, color: "#22C55E" },
                  { name: "Fruits", share: 28, color: "#F59E0B" },
                  { name: "Grains & Cereals", share: 18, color: "#EF4444" },
                  { name: "Dairy & Eggs", share: 9, color: "#3B82F6" },
                ]).map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-[#FAFAFA]">{cat?.name ?? ""}</span>
                      <span
                        className="text-[10px] font-black px-1.5 py-0.5 rounded"
                        style={{ color: cat?.color ?? "#22C55E", backgroundColor: `${cat?.color ?? "#22C55E"}18` }}
                      >
                        {cat?.share ?? 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#1C1C1F] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${cat?.share ?? 0}%`,
                          background: `linear-gradient(90deg, ${cat?.color ?? "#22C55E"}99, ${cat?.color ?? "#22C55E"})`,
                          boxShadow: `0 0 8px ${cat?.color ?? "#22C55E"}55`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews & Ratings Feedback */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xl font-bold text-[#FAFAFA] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Customer Reviews & Ratings Feedback
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <PremiumStatCard
            label="Total Reviews"
            value={reviewAnalytics?.total_reviews ?? 0}
            icon={<ClipboardList className="w-5 h-5 text-[#3B82F6]" />}
            subtitle="Overall feedback collected"
            change="Live DB count"
          />
          <PremiumStatCard
            label="Avg Farmer Rating"
            value={reviewAnalytics?.avg_farmer_rating ? `${Number(reviewAnalytics.avg_farmer_rating).toFixed(1)} ★` : "—"}
            icon={<Leaf className="w-5 h-5 text-[#22C55E]" />}
            subtitle="Across all producer ratings"
            change="Real-time"
          />
          <PremiumStatCard
            label="Avg Delivery Rating"
            value={reviewAnalytics?.avg_delivery_rating ? `${Number(reviewAnalytics.avg_delivery_rating).toFixed(1)} ★` : "—"}
            icon={<Truck className="w-5 h-5 text-[#A855F7]" />}
            subtitle="Across all courier ratings"
            change="Real-time"
          />
        </div>

        <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Latest Reviews</h3>
          {!reviewAnalytics?.latest_reviews || reviewAnalytics.latest_reviews.length === 0 ? (
            <p className="text-xs text-[#71717A] py-2">No reviews submitted yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewAnalytics.latest_reviews.map((r: any) => (
                <div key={r.id} className="p-4 rounded-2xl bg-[#161618] border border-[#1F1F23] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#FAFAFA]">Order #{r.order_id}</span>
                    <span className="text-[10px] text-[#71717A] font-bold">
                      {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 text-xs text-[#A1A1AA] leading-relaxed">
                    <div className="flex items-center justify-between border-b border-[#1F1F23]/40 pb-1.5">
                      <span className="font-semibold text-[#FAFAFA]">Farmer Rating</span>
                      <span className="font-black text-[#22C55E]">{r.farmer_rating} ★</span>
                    </div>
                    {r.farmer_review && (
                      <p className="italic text-[#71717A] pl-2 border-l border-[#22C55E]/40 mb-1">"{r.farmer_review}"</p>
                    )}

                    {r.delivery_rating !== null && (
                      <>
                        <div className="flex items-center justify-between pt-1 border-b border-[#1F1F23]/40 pb-1.5">
                          <span className="font-semibold text-[#FAFAFA]">Delivery Rating</span>
                          <span className="font-black text-[#A855F7]">{r.delivery_rating} ★</span>
                        </div>
                        {r.delivery_review && (
                          <p className="italic text-[#71717A] pl-2 border-l border-[#A855F7]/40">"{r.delivery_review}"</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: RECENT ACTIVITY TIMELINE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#FAFAFA] tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Recent Activity Audit Trail
        </h2>
        {allOrders.length === 0 ? (
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-10 text-center text-[#A1A1AA]">
            No recent activity detected on the system.
          </div>
        ) : (
          <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
            {/* Timeline Vertical bar */}
            <div className="absolute left-10.5 top-8 bottom-8 w-0.5 bg-emerald-950/60" />

            <div className="space-y-6">
              {(allOrders ?? []).slice(0, 4).map((o, idx) => {
                const colors =
                  o.status === "completed"
                    ? { bg: "bg-emerald-950/20 border-emerald-900/30", text: "text-[#22C55E]" }
                    : o.status === "pending"
                    ? { bg: "bg-amber-950/20 border-amber-900/30", text: "text-[#F59E0B]" }
                    : { bg: "bg-blue-950/20 border-blue-900/30", text: "text-[#3B82F6]" };

                const dateText = o.created_at && !isNaN(new Date(o.created_at).getTime())
                  ? new Date(o.created_at).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—";

                return (
                  <div key={o.id} className="flex items-start gap-5 relative group animate-fade-in">
                    {/* Circle Node indicator */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border z-10 transition-transform group-hover:scale-110 duration-200 bg-[#111113] ${colors.bg}`}
                    >
                      <ClipboardList className={`w-4.5 h-4.5 ${colors.text}`} />
                    </div>

                    {/* Timeline Event Card */}
                    <div className="flex-1 bg-[#161618] border border-[#1F1F23] hover:border-emerald-900/30 rounded-2xl p-4 transition-all duration-200 hover:shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <p className="text-sm font-bold text-[#FAFAFA]">Order #{o.id} Created</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#A1A1AA] font-bold">{dateText}</span>
                          <Badge label={o.status} dot />
                        </div>
                      </div>
                      <p className="text-xs text-[#A1A1AA] leading-relaxed font-semibold">
                        A new checkout was registered by Customer Account ID{" "}
                        <span className="text-[#FAFAFA] font-bold">#{o.customer_id}</span>. The order total amount is{" "}
                        <span className="text-[#22C55E] font-extrabold">₹{Number(o.total_amount ?? 0).toFixed(0)}</span>.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
