"use client";
/**
 * app/customer/home/page.tsx — Auxin v3.0
 * GOAT-Level Customer Marketplace Experience:
 * - Editorial Hero & Promotional Carousel
 * - Horizontal Category Rail
 * - Art-directed Seasonal Feature
 * - Personalized Discovery Rails (Buy It Again, Trending, Recently Viewed)
 * - 4/5-Column Responsive Product Grid with Staggered Entrance
 * - Floating Cart Bar & Trust Assurance Signals
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal, Leaf, Star, LayoutGrid, List,
  ShoppingBag, RotateCcw, Flame, Eye, Sparkles, Check, ArrowRight
} from "lucide-react";
import { BrandHeader } from "@/components/layout/TopBar";
import { CartAwareProductCard } from "@/components/features/ProductCard";
import { ProductGrid } from "@/components/features/ProductGrid";
import { HeroCarousel, type HeroSlide } from "@/components/features/HeroCarousel";
import { CategoryRail, type CategoryItem } from "@/components/features/CategoryRail";
import { SeasonalCard } from "@/components/features/SeasonalCard";
import { SearchBar } from "@/components/features/SearchBar";
import { SectionBlock } from "@/components/ui/SectionBlock";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { EmptyState } from "@/components/ui/Card";
import { EmptySearchIllustration } from "@/components/illustrations/EmptySearch";
import { HomeSkeleton } from "@/components/ui/Skeletons";
import { catalogueApi, type CatalogueProduct, type Category } from "@/lib/catalogue";
import { ordersApi } from "@/lib/orders";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { clsx } from "clsx";

export default function CustomerHomePage() {
  const { user } = useAuthStore();
  const cartCount = useCartStore((s) => s.itemCount);
  const cartTotal = useCartStore((s) => s.cartTotal);

  // Layout & View States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [seasonalOnly, setSeasonalOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<"all" | "under50" | "50to150" | "over150">("all");
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "popularity" | "newest">("relevance");

  // Local storage trackers
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<number[]>([]);

  // Search Debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load recently viewed from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedViewed = localStorage.getItem(`auxin_recent_viewed_${user?.id || "guest"}`);
        if (savedViewed) setRecentlyViewedIds(JSON.parse(savedViewed));
      } catch {}
    }
  }, [user?.id]);

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ["catalogue-categories"],
    queryFn: () => catalogueApi.categories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Catalogue
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue", selectedCategory, organicOnly, debouncedSearch],
    queryFn: () =>
      catalogueApi
        .list({
          page: 1,
          page_size: 100,
          category: selectedCategory === "all" ? undefined : selectedCategory,
          organic: organicOnly || undefined,
          q: debouncedSearch.trim() || undefined,
        })
        .then((r) => r.data),
    refetchInterval: 30_000,
  });

  // Fetch Order History for "Buy It Again"
  const { data: myOrdersData } = useQuery({
    queryKey: ["customer-orders-history", user?.id],
    queryFn: () => ordersApi.myOrders({ page: 1, page_size: 15 }).then((r) => r.data),
    enabled: !!user,
  });

  const categories = categoriesData ?? [];
  const allProducts = data?.items ?? [];

  // Filter & Sort Products
  const processedProducts = useMemo(() => {
    let list = [...allProducts];

    if (seasonalOnly) {
      list = list.filter((p) => p.is_seasonal);
    }

    if (priceRange === "under50") {
      list = list.filter((p) => p.min_price < 50);
    } else if (priceRange === "50to150") {
      list = list.filter((p) => p.min_price >= 50 && p.min_price <= 150);
    } else if (priceRange === "over150") {
      list = list.filter((p) => p.min_price > 150);
    }

    if (sortBy === "price_asc") {
      list.sort((a, b) => a.min_price - b.min_price);
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => b.min_price - a.min_price);
    } else if (sortBy === "popularity") {
      list.sort((a, b) => b.farmer_count - a.farmer_count);
    } else if (sortBy === "newest") {
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [allProducts, seasonalOnly, priceRange, sortBy]);

  // Recommendations: Repeat items
  const repeatProducts = useMemo(() => {
    const repeatIds = new Set<number>();
    if (myOrdersData?.items) {
      for (const order of myOrdersData.items) {
        if (order.items) {
          for (const item of order.items) {
            if (item.product_id) repeatIds.add(item.product_id);
          }
        }
      }
    }
    return allProducts.filter((p) => repeatIds.has(p.id));
  }, [myOrdersData, allProducts]);

  // Recommendations: Recently Viewed
  const recentlyViewedProducts = useMemo(
    () => allProducts.filter((p) => recentlyViewedIds.includes(p.id)),
    [allProducts, recentlyViewedIds]
  );

  // Recommendations: Seasonal Highlight (First featured seasonal item)
  const seasonalHeroProduct = useMemo(
    () => allProducts.find((p) => p.is_seasonal) || allProducts[0],
    [allProducts]
  );

  // Recommendations: Trending
  const trendingProducts = useMemo(
    () =>
      [...allProducts]
        .sort((a, b) => b.farmer_count - a.farmer_count)
        .slice(0, 8),
    [allProducts]
  );

  // Build Category Rail Items
  const railCategories: CategoryItem[] = useMemo(() => {
    const defaultItem: CategoryItem = { id: "all", label: "All Harvest", icon: "🌱" };
    const mapped: CategoryItem[] = categories.map((c) => ({
      id: c.slug,
      label: c.name,
      icon: c.icon_emoji || "🌾",
    }));
    return [defaultItem, ...mapped];
  }, [categories]);

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning ☀️";
    if (hr < 17) return "Good Afternoon 🌤️";
    return "Good Evening 🌙";
  };

  const firstName = user?.name?.split(" ")[0] ?? "Friend";

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      {/* Mobile Top Brand Header */}
      <BrandHeader />

      {isLoading ? (
        <div className="page-content py-4">
          <HomeSkeleton />
        </div>
      ) : (
        <div className="page-content py-3 sm:py-5 space-y-6 sm:space-y-8">
          {/* ═══════════════════════════════════════════════════════════════════
             1. HERO & SEARCH ZONE
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
            {/* Left: Personalized Greeting Card */}
            <div className="lg:col-span-4 flex flex-col justify-between p-5 sm:p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-warm)] shadow-xs">
              <div>
                <p className="text-overline mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                  {getGreeting()}
                </p>
                <h1
                  className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Namaste, {firstName}!
                </h1>
                <p className="text-xs sm:text-sm text-[var(--primary-deep)] font-medium mt-1">
                  100% Farm Direct • 25 KM Hyper-Local
                </p>
              </div>

              {/* Cart reminder or Trust Note */}
              {cartCount > 0 ? (
                <Link
                  href="/customer/cart"
                  className="mt-4 flex items-center justify-between p-3 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-ring)] hover:bg-[rgba(34,197,94,0.12)] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {cartCount}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary)]">Ready for checkout</p>
                      <p className="text-[11px] text-[var(--text-secondary)]">Total: ₹{cartTotal.toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Cart <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              ) : (
                <div className="mt-4 pt-3 border-t border-[var(--divider)] flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Sparkles className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
                  <span>Harvested fresh this morning within 25 km</span>
                </div>
              )}
            </div>

            {/* Right: Search + Quick Stats */}
            <div className="lg:col-span-8 flex flex-col justify-center gap-3.5">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSelectSuggestion={(term) => setSearch(term)}
                placeholder="Search fresh mangoes, organic spinach, wheat, potatoes..."
              />

              {/* Category Rail (Single-row scrollable chips) */}
              <CategoryRail
                categories={railCategories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
             2. PROMOTIONAL HERO CAROUSEL
             ═══════════════════════════════════════════════════════════════════ */}
          {!debouncedSearch && (
            <HeroCarousel className="shadow-sm" />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             3. EDITORIAL SEASONAL HARVEST FEATURE
             ═══════════════════════════════════════════════════════════════════ */}
          {!debouncedSearch && seasonalHeroProduct && (
            <SectionBlock
              overline="Editor's Pick"
              title="Seasonal Spotlight"
              subtitle="Special crop harvests at peak sweetness and farm freshness"
            >
              <SeasonalCard product={seasonalHeroProduct} />
            </SectionBlock>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             4. PERSONALIZED DISCOVERY RAILS
             ═══════════════════════════════════════════════════════════════════ */}
          {!debouncedSearch && selectedCategory === "all" && (
            <>
              {/* Buy It Again */}
              {repeatProducts.length > 0 && (
                <SectionBlock
                  overline="Your Favorites"
                  title="Buy It Again"
                  subtitle="Quickly reorder produce from your previous orders"
                  action={
                    <span className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer">
                      View all ({repeatProducts.length})
                    </span>
                  }
                >
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {repeatProducts.map((p) => (
                      <div key={p.id} className="w-40 sm:w-48 flex-shrink-0">
                        <CartAwareProductCard product={p} viewMode="grid" />
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              )}

              {/* Trending Now */}
              {trendingProducts.length > 0 && (
                <SectionBlock
                  overline="Popular This Week"
                  title="Trending Harvests"
                  subtitle="Most ordered farm produce by families in your 25 km circle"
                >
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {trendingProducts.map((p) => (
                      <div key={p.id} className="w-40 sm:w-48 flex-shrink-0">
                        <CartAwareProductCard product={p} viewMode="grid" />
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              )}

              {/* Recently Viewed */}
              {recentlyViewedProducts.length > 0 && (
                <SectionBlock
                  overline="Browsing History"
                  title="Recently Viewed"
                  subtitle="Crops and fresh items you inspected earlier"
                >
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {recentlyViewedProducts.map((p) => (
                      <div key={p.id} className="w-40 sm:w-48 flex-shrink-0">
                        <CartAwareProductCard product={p} viewMode="grid" />
                      </div>
                    ))}
                  </div>
                </SectionBlock>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
             5. MAIN CATALOGUE & PRODUCE GRID
             ═══════════════════════════════════════════════════════════════════ */}
          <div id="catalog" className="pt-2">
            <SectionBlock
              overline="Marketplace"
              title={
                debouncedSearch
                  ? `Results for "${debouncedSearch}"`
                  : selectedCategory !== "all"
                  ? categories.find((c) => c.slug === selectedCategory)?.name ?? "Products"
                  : "All Fresh Produce"
              }
              subtitle={`${processedProducts.length} farm fresh items available`}
              action={
                <div className="flex items-center gap-2">
                  {/* Filter Slider Trigger */}
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95 shadow-xs",
                      showFilters
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]"
                    )}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>

                  {/* Grid / List Mode Toggle */}
                  <div className="flex items-center p-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
                    <button
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        viewMode === "grid"
                          ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-bold"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        viewMode === "list"
                          ? "bg-[var(--primary-subtle)] text-[var(--primary)] font-bold"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              }
            >
              {/* Filter Panel Drawer */}
              {showFilters && (
                <div className="mb-6 p-4 sm:p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-md animate-slide-down space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Attributes */}
                    <div className="space-y-2">
                      <label className="text-overline">Produce Type</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setOrganicOnly((v) => !v)}
                          className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            organicOnly
                              ? "bg-[var(--primary-subtle)] text-[var(--primary-deep)] border-[var(--primary)]"
                              : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]"
                          )}
                        >
                          <Leaf className="w-3.5 h-3.5 text-[var(--primary)]" />
                          <span>Organic Only</span>
                        </button>

                        <button
                          onClick={() => setSeasonalOnly((v) => !v)}
                          className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                            seasonalOnly
                              ? "bg-[var(--gold-subtle)] text-[var(--gold-deep)] border-[var(--gold)]"
                              : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]"
                          )}
                        >
                          <Star className="w-3.5 h-3.5 text-[var(--gold)]" fill={seasonalOnly ? "currentColor" : "none"} />
                          <span>Seasonal Only</span>
                        </button>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="space-y-2">
                      <label className="text-overline">Price Bracket</label>
                      <select
                        value={priceRange}
                        onChange={(e: any) => setPriceRange(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="all">All Prices</option>
                        <option value="under50">Under ₹50</option>
                        <option value="50to150">₹50 - ₹150</option>
                        <option value="over150">Over ₹150</option>
                      </select>
                    </div>

                    {/* Sorting */}
                    <div className="space-y-2">
                      <label className="text-overline">Sort Order</label>
                      <select
                        value={sortBy}
                        onChange={(e: any) => setSortBy(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                      >
                        <option value="relevance">Relevance & Best Match</option>
                        <option value="price_asc">Price: Low to High</option>
                        <option value="price_desc">Price: High to Low</option>
                        <option value="popularity">Most Sellers & Popular</option>
                        <option value="newest">New Harvest Arrivals</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Grid / Empty State */}
              {processedProducts.length === 0 ? (
                <EmptyState
                  illustration={<EmptySearchIllustration className="w-24 h-24" />}
                  title="No Produce Found"
                  description="We couldn't find items matching your filter criteria. Try resetting filters or searching for another crop."
                  action={
                    <button
                      onClick={() => {
                        setSearch("");
                        setSelectedCategory("all");
                        setOrganicOnly(false);
                        setSeasonalOnly(false);
                        setPriceRange("all");
                      }}
                      className="px-5 py-2 rounded-full text-xs font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all"
                    >
                      Reset All Filters
                    </button>
                  }
                />
              ) : (
                <ProductGrid viewMode={viewMode} columns={4}>
                  {processedProducts.map((product) => (
                    <CartAwareProductCard
                      key={product.id}
                      product={product}
                      viewMode={viewMode}
                    />
                  ))}
                </ProductGrid>
              )}
            </SectionBlock>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
             6. TRUST & QUALITY ASSURANCE FOOTER
             ═══════════════════════════════════════════════════════════════════ */}
          <div className="pt-6 border-t border-[var(--divider)] grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <TrustBadge type="escrow" variant="card" />
            <TrustBadge type="farm_direct" variant="card" />
            <TrustBadge type="fresh_local" variant="card" />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
         7. FLOATING CHECKOUT BAR (Mobile & Desktop)
         ═══════════════════════════════════════════════════════════════════════ */}
      {cartCount > 0 && (
        <div className="fixed bottom-[80px] lg:bottom-6 left-0 right-0 px-4 max-w-md lg:max-w-lg mx-auto z-40 animate-slide-up">
          <Link
            href="/customer/cart"
            className="flex items-center justify-between px-6 h-13 rounded-full w-full bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary-glow)] hover:bg-[var(--primary-hover)] transition-all active:scale-[0.98] font-bold"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                {cartCount}
              </div>
              <span className="text-sm tracking-wide">View Cart</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold" style={{ fontFamily: "var(--font-heading)" }}>
                ₹{cartTotal.toFixed(2)}
              </span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
