"use client";
/**
 * app/customer/home/page.tsx — Auxin v2.0
 * Swiggy/Blinkit-inspired customer home page.
 * Dark theme with neon emerald accents.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBasket, SlidersHorizontal, Leaf } from "lucide-react";
import { BrandHeader } from "@/components/layout/TopBar";
import { CartAwareProductCard, ProductCardSkeleton } from "@/components/features/ProductCard";
import { EmptyState } from "@/components/ui/Card";
import { productsApi } from "@/lib/products";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Herbs"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "🌿",
  Vegetables: "🥦",
  Fruits: "🍎",
  Grains: "🌾",
  Dairy: "🥛",
  Herbs: "🌱",
};

export default function CustomerHomePage() {
  const { user } = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list({ page: 1, page_size: 60 }).then((r) => r.data),
  });

  const allProducts = data?.items ?? [];

  const filtered = allProducts.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "All" ||
      p.name.toLowerCase().includes(category.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(category.toLowerCase());
    return matchSearch && matchCategory;
  });

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B" }}>
      {/* Header */}
      <BrandHeader />

      {/* Hero greeting */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#52525B] mb-0.5">Good day 👋</p>
            <h1 className="text-2xl font-black text-[#FAFAFA] leading-tight">
              Hey, {firstName}
            </h1>
            <p className="text-sm text-[#71717A] mt-0.5">Fresh from farms. Delivered today.</p>
          </div>

          {/* Cart floating button */}
          {cartCount > 0 && (
            <Link
              href="/customer/cart"
              className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.25)",
              }}
            >
              <ShoppingBasket className="w-5 h-5 text-[#22C55E]" />
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#22C55E", color: "#052E16" }}
              >
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="search"
            placeholder="Search tomatoes, rice, mangoes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-2xl text-sm text-[#FAFAFA] placeholder:text-[#52525B] focus:outline-none transition-all"
            style={{
              background: "#111113",
              border: "1px solid #27272A",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#22C55E";
              e.currentTarget.style.boxShadow = "0 0 0 2px rgba(34,197,94,0.2)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#27272A";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95"
              style={
                active
                  ? { background: "#22C55E", color: "#052E16" }
                  : {
                      background: "#111113",
                      border: "1px solid #27272A",
                      color: "#71717A",
                    }
              }
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              {cat}
            </button>
          );
        })}
      </div>

      {/* Section header */}
      <div className="px-4 flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-[#FAFAFA]">
            {search
              ? `Results for "${search}"`
              : category !== "All"
              ? `${category}`
              : "All Products"}
          </h2>
          {!isLoading && (
            <p className="text-xs text-[#52525B] mt-0.5">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-[#52525B] hover:text-[#FAFAFA] transition-colors"
          style={{ background: "#111113", border: "1px solid #27272A" }}>
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Products grid */}
      <div className="px-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBasket className="w-8 h-8" />}
            title="No products found"
            description={
              search
                ? `No results for "${search}". Try a different term.`
                : "No products in this category right now."
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <CartAwareProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>

      {/* Floating cart bar when items in cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 max-w-lg mx-auto z-30">
          <Link
            href="/customer/cart"
            className="flex items-center justify-between px-5 py-3.5 rounded-2xl w-full transition-all active:scale-[0.99]"
            style={{
              background: "#22C55E",
              boxShadow: "0 8px 32px rgba(34,197,94,0.3)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: "rgba(0,0,0,0.15)", color: "#052E16" }}
              >
                {cartCount}
              </div>
              <span className="text-sm font-bold text-[#052E16]">View Cart</span>
            </div>
            <Leaf className="w-4 h-4 text-[#052E16] opacity-60" />
          </Link>
        </div>
      )}
    </div>
  );
}
