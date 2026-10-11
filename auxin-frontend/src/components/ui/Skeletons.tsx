"use client";

import { SkeletonBlock } from "./Card";

/* ── Home Page Loader ─────────────────────────────────────────────────────── */
export function HomeSkeleton() {
  return (
    <div className="space-y-6 pt-2 animate-pulse">
      {/* Greeting Skeleton */}
      <div className="space-y-2">
        <SkeletonBlock height="h-3.5" className="w-24 rounded-md" />
        <SkeletonBlock height="h-7" className="w-48 rounded-lg" />
      </div>

      {/* Search Bar Skeleton */}
      <SkeletonBlock height="h-12" className="rounded-2xl" />

      {/* Category Chips Skeleton */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-9" className="w-24 rounded-2xl flex-shrink-0" />
        ))}
      </div>

      {/* Promo Strip Skeleton */}
      <div className="flex gap-3 overflow-hidden md:grid md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-[104px]" className="w-[84%] md:w-full rounded-2xl flex-shrink-0" />
        ))}
      </div>

      {/* Products Grid Skeleton */}
      <div className="space-y-3">
        <SkeletonBlock height="h-6" className="w-40 rounded-md" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-2 space-y-2.5">
              <SkeletonBlock height="h-auto" className="aspect-square rounded-xl" />
              <div className="px-1 space-y-2">
                <SkeletonBlock height="h-3" className="w-1/2 rounded" />
                <SkeletonBlock height="h-4" className="w-3/4 rounded" />
                <div className="flex justify-between items-center pt-1">
                  <SkeletonBlock height="h-5" className="w-12 rounded" />
                  <SkeletonBlock height="h-8" className="w-14 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Product Detail Loader ────────────────────────────────────────────────── */
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen pb-32 animate-pulse" style={{ background: "var(--bg)" }}>
      <SkeletonBlock height="h-80" className="rounded-none" />
      <div className="max-w-full md:max-w-3xl lg:max-w-5xl mx-auto px-4 pt-6 space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <SkeletonBlock height="h-8" className="w-3/4 rounded-lg" />
            <SkeletonBlock height="h-5" className="w-1/2 rounded-md" />
          </div>
          <SkeletonBlock height="h-6" className="w-20 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock height="h-4" className="w-full rounded-md" />
          <SkeletonBlock height="h-4" className="w-full rounded-md" />
          <SkeletonBlock height="h-4" className="w-5/6 rounded-md" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBlock height="h-20" className="rounded-2xl" />
          <SkeletonBlock height="h-20" className="rounded-2xl" />
        </div>
        <SkeletonBlock height="h-14" className="rounded-2xl" />
        <div className="flex justify-between items-center py-2">
          <SkeletonBlock height="h-8" className="w-24 rounded-lg" />
          <SkeletonBlock height="h-12" className="w-32 rounded-2xl" />
        </div>
        <SkeletonBlock height="h-14" className="rounded-2xl" />
      </div>
    </div>
  );
}

/* ── Cart Loader ──────────────────────────────────────────────────────────── */
export function CartSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Delivery Address Card Skeleton */}
      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
        <div className="flex gap-2 items-center">
          <SkeletonBlock height="h-7" className="w-7 rounded-lg" />
          <SkeletonBlock height="h-5" className="w-36 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonBlock height="h-4" className="w-3/4 rounded-md" />
          <SkeletonBlock height="h-4" className="w-full rounded-md" />
        </div>
      </div>

      {/* Cart Items Skeletons */}
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 flex gap-4">
            <SkeletonBlock height="h-18" className="w-18 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock height="h-5" className="w-2/3 rounded-md" />
              <SkeletonBlock height="h-4" className="w-1/3 rounded-md" />
              <div className="flex justify-between items-center pt-2">
                <SkeletonBlock height="h-8" className="w-20 rounded-xl" />
                <SkeletonBlock height="h-7" className="w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bill Card Skeleton */}
      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
        <SkeletonBlock height="h-5" className="w-28 rounded-md" />
        <div className="space-y-2">
          <SkeletonBlock height="h-4" className="w-full rounded-md" />
          <SkeletonBlock height="h-4" className="w-full rounded-md" />
        </div>
        <div className="border-t border-[var(--border)] pt-4 flex justify-between">
          <SkeletonBlock height="h-5" className="w-24 rounded-md" />
          <SkeletonBlock height="h-6" className="w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

/* ── Orders Loader ────────────────────────────────────────────────────────── */
export function OrdersSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      <div className="flex justify-between items-baseline">
        <SkeletonBlock height="h-7" className="w-24 rounded-md" />
        <SkeletonBlock height="h-4" className="w-16 rounded-md" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-start pb-3 border-b border-[var(--border)]">
              <div className="space-y-2">
                <SkeletonBlock height="h-3.5" className="w-20 rounded-md" />
                <SkeletonBlock height="h-4" className="w-32 rounded-md" />
              </div>
              <SkeletonBlock height="h-6" className="w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock height="h-4" className="w-full rounded-md" />
              <SkeletonBlock height="h-4" className="w-full rounded-md" />
            </div>
            <div className="flex justify-between items-center pt-2">
              <SkeletonBlock height="h-8" className="w-20 rounded-lg" />
              <SkeletonBlock height="h-6" className="w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Profile Loader ───────────────────────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Profile Header */}
      <div className="flex flex-col items-center space-y-3.5 py-4">
        <SkeletonBlock height="h-24" className="w-24 rounded-full" />
        <SkeletonBlock height="h-5" className="w-36 rounded-md" />
        <SkeletonBlock height="h-4.5" className="w-48 rounded-md" />
      </div>

      {/* Account Details */}
      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock height="h-3" className="w-24 rounded-md" />
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
        ))}
      </div>

      {/* Address Card */}
      <div className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
        <SkeletonBlock height="h-3" className="w-32 rounded-md" />
        <div className="flex gap-4">
          <SkeletonBlock height="h-10" className="w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock height="h-4" className="w-3/4 rounded-md" />
            <SkeletonBlock height="h-4" className="w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Farmer Dashboard Loader ──────────────────────────────────────────────── */
export function FarmerDashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Greeting Card */}
      <SkeletonBlock height="h-32" className="rounded-2xl" />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
      </div>

      {/* Needs Attention Skeletons */}
      <div className="space-y-3">
        <SkeletonBlock height="h-5" className="w-32 rounded-md" />
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-16" className="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ── Farmer Products Loader ───────────────────────────────────────────────── */
export function FarmerProductsSkeleton() {
  return (
    <div className="space-y-4 pt-4 animate-pulse">
      {/* Search Bar */}
      <SkeletonBlock height="h-11" className="rounded-2xl" />

      {/* Category Pills */}
      <div className="flex gap-2 overflow-hidden py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-9" className="w-20 rounded-full flex-shrink-0" />
        ))}
      </div>

      {/* Product Rows */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 flex gap-4 items-center">
            <SkeletonBlock height="h-16" className="w-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock height="h-4.5" className="w-2/3 rounded-md" />
              <SkeletonBlock height="h-3.5" className="w-1/3 rounded-md" />
              <SkeletonBlock height="h-3.5" className="w-1/2 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Farmer Earnings Loader ───────────────────────────────────────────────── */
export function FarmerEarningsSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Lifetime revenue hero */}
      <SkeletonBlock height="h-36" className="rounded-3xl" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
      </div>

      {/* Chart block */}
      <SkeletonBlock height="h-44" className="rounded-3xl" />

      {/* Transaction rows */}
      <div className="space-y-3">
        <SkeletonBlock height="h-5" className="w-40 rounded-md" />
        {Array.from({ length: 2 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-16" className="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/* ── Delivery Dashboard Loader ────────────────────────────────────────────── */
export function DeliveryDashboardSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Greeting */}
      <div className="space-y-2">
        <SkeletonBlock height="h-8" className="w-48 rounded-lg" />
        <SkeletonBlock height="h-4.5" className="w-36 rounded-md" />
      </div>

      {/* Availability Status Card */}
      <SkeletonBlock height="h-18" className="rounded-2xl" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock height="h-20" className="rounded-2xl" />
        <SkeletonBlock height="h-20" className="rounded-2xl" />
      </div>

      {/* Active Deliveries */}
      <div className="space-y-3">
        <SkeletonBlock height="h-5" className="w-32 rounded-md" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <SkeletonBlock height="h-8" className="w-8 rounded-xl" />
                <div className="space-y-1">
                  <SkeletonBlock height="h-4" className="w-20 rounded-md" />
                  <SkeletonBlock height="h-3" className="w-16 rounded-md" />
                </div>
              </div>
              <SkeletonBlock height="h-6" className="w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock height="h-4.5" className="w-3/4 rounded-md" />
              <SkeletonBlock height="h-4" className="w-1/2 rounded-md" />
            </div>
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Delivery History Loader ──────────────────────────────────────────────── */
export function DeliveryHistorySkeleton() {
  return (
    <div className="space-y-4 pt-4 animate-pulse">
      {/* Search input */}
      <SkeletonBlock height="h-11" className="rounded-2xl" />

      {/* Tabs */}
      <div className="flex gap-2">
        <SkeletonBlock height="h-9" className="flex-1 rounded-lg" />
        <SkeletonBlock height="h-9" className="flex-1 rounded-lg" />
        <SkeletonBlock height="h-9" className="flex-1 rounded-lg" />
      </div>

      {/* History Items */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-[var(--border)] bg-[var(--surface)] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <SkeletonBlock height="h-4.5" className="w-28 rounded-md" />
                <SkeletonBlock height="h-3.5" className="w-20 rounded-md" />
              </div>
              <SkeletonBlock height="h-6" className="w-20 rounded-full" />
            </div>
            <div className="space-y-2 pt-2 border-t border-[var(--divider)]">
              <SkeletonBlock height="h-4" className="w-5/6 rounded-md" />
              <SkeletonBlock height="h-4" className="w-2/3 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Delivery Earnings Loader ─────────────────────────────────────────────── */
export function DeliveryEarningsSkeleton() {
  return (
    <div className="space-y-6 pt-4 animate-pulse">
      {/* Lifetime revenue hero */}
      <SkeletonBlock height="h-36" className="rounded-3xl" />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
        <SkeletonBlock height="h-24" className="rounded-2xl" />
      </div>

      {/* Alert Banner */}
      <SkeletonBlock height="h-16" className="rounded-2xl" />

      {/* Transactions */}
      <div className="space-y-3">
        <SkeletonBlock height="h-5" className="w-40 rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} height="h-16" className="rounded-2xl" />
        ))}
      </div>
    </div>
  );
}


