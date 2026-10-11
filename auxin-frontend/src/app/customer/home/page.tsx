"use client";
/**
 * app/customer/home/page.tsx — Auxin v3.1
 * Customer marketplace home:
 * - Compact greeting, search and category chips
 * - Slim promo strip (swipeable on phones)
 * - "In season" rail + personalised rails (Buy It Again, Trending, Recently Viewed)
 * - Uniform product grid: 2 / 3 / 4 / 5 columns
 * - Floating cart bar & trust signals
 */

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SlidersHorizontal, Leaf, Star, LayoutGrid, List, ArrowRight, MapPin
} from "lucide-react";
import { BrandHeader } from "@/components/layout/TopBar";
import { CartAwareProductCard } from "@/components/features/ProductCard";
import { ProductGrid, ProductRail } from "@/components/features/ProductGrid";
import { HeroCarousel } from "@/components/features/HeroCarousel";
import { CategoryRail, type CategoryItem } from "@/components/features/CategoryRail";
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

  // In-season rail (only genuinely seasonal items; no fallback to an arbitrary product)
  const seasonalProducts = useMemo(
    () => allProducts.filter((p) => p.is_seasonal).slice(0, 12),
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

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setOrganicOnly(false);
    setSeasonalOnly(false);
    setPriceRange("all");
  };

  const chipClass = (active: boolean, tone: "green" | "gold" = "green") =>
    clsx(
      "inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold border transition-colors",
      active
        ? tone === "gold"
          ? "bg-[var(--gold-subtle)] text-[var(--gold-deep)] border-[var(--gold)]"
          : "bg-[var(--primary-muted)] text-[var(--primary-deep)] border-[var(--primary)]"
        : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]"
    );

  const selectClass =
    "w-full h-10 px-3 rounded-xl text-sm font-medium bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]";

  const showDiscovery = !debouncedSearch && selectedCategory === "all";

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      {/* Mobile Top Brand Header */}
      <BrandHeader />

      {isLoading ? (
        <div className="page-content py-4">
          <HomeSkeleton />
        </div>
      ) : (
        <div className="page-content pt-4 pb-6 sm:pt-6 space-y-7 sm:space-y-9">
          {/* ── 1. Greeting, search & categories ───────────────────────────── */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-secondary)]">{getGreeting()}</p>
                <h1
                  className="text-[22px] sm:text-[26px] font-bold text-[var(--text-primary)] tracking-tight leading-tight truncate"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Namaste, {firstName}
                </h1>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold text-[var(--primary-deep)] bg-[var(--primary-muted)] flex-shrink-0">
                <MapPin className="w-3.5 h-3.5" />
                Farms within 25 km
              </span>
            </div>

            <SearchBar
              value={search}
              onChange={setSearch}
              onSelectSuggestion={(term) => setSearch(term)}
              placeholder="Search tomatoes, spinach, rice…"
            />

            <CategoryRail
              categories={railCategories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* ── 2. Slim promo strip ───────────────────────────────────────── */}
          {!debouncedSearch && <HeroCarousel />}

          {/* ── 3. In season rail ─────────────────────────────────────────── */}
          {!debouncedSearch && seasonalProducts.length > 0 && (
            <SectionBlock
              id="seasonal"
              noMargin
              overline="Editor's pick"
              title="In season now"
              subtitle="Picked at peak freshness this week"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setSeasonalOnly(true);
                    setShowFilters(true);
                    document.querySelector("#catalog")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="text-xs font-semibold text-[var(--text-link)] hover:underline"
                >
                  See all
                </button>
              }
            >
              <ProductRail label="In season now">
                {seasonalProducts.map((p) => (
                  <CartAwareProductCard key={p.id} product={p} viewMode="grid" />
                ))}
              </ProductRail>
            </SectionBlock>
          )}

          {/* ── 4. Personalised rails ─────────────────────────────────────── */}
          {showDiscovery && repeatProducts.length > 0 && (
            <SectionBlock noMargin overline="Your favourites" title="Buy it again">
              <ProductRail label="Buy it again">
                {repeatProducts.map((p) => (
                  <CartAwareProductCard key={p.id} product={p} viewMode="grid" />
                ))}
              </ProductRail>
            </SectionBlock>
          )}

          {showDiscovery && trendingProducts.length > 0 && (
            <SectionBlock
              noMargin
              overline="Popular this week"
              title="Trending harvests"
              subtitle="Most ordered by families near you"
            >
              <ProductRail label="Trending harvests">
                {trendingProducts.map((p) => (
                  <CartAwareProductCard key={p.id} product={p} viewMode="grid" />
                ))}
              </ProductRail>
            </SectionBlock>
          )}

          {showDiscovery && recentlyViewedProducts.length > 0 && (
            <SectionBlock noMargin overline="Browsing history" title="Recently viewed">
              <ProductRail label="Recently viewed">
                {recentlyViewedProducts.map((p) => (
                  <CartAwareProductCard key={p.id} product={p} viewMode="grid" />
                ))}
              </ProductRail>
            </SectionBlock>
          )}

          {/* ── 5. Catalogue grid ─────────────────────────────────────────── */}
          <SectionBlock
            id="catalog"
            noMargin
            overline="Marketplace"
            title={
              debouncedSearch
                ? `Results for "${debouncedSearch}"`
                : selectedCategory !== "all"
                ? categories.find((c) => c.slug === selectedCategory)?.name ?? "Products"
                : "All fresh produce"
            }
            subtitle={`${processedProducts.length} ${processedProducts.length === 1 ? "item" : "items"} available`}
            action={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  aria-expanded={showFilters}
                  aria-controls="catalog-filters"
                  className={clsx(
                    "inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border transition-colors",
                    showFilters
                      ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                      : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-hover)]"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filter</span>
                </button>

                <div className="flex items-center p-0.5 h-9 rounded-xl border border-[var(--border)] bg-[var(--surface)]" role="group" aria-label="Layout">
                  {([
                    ["grid", LayoutGrid, "Grid view"],
                    ["list", List, "List view"],
                  ] as const).map(([mode, Icon, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      aria-label={label}
                      aria-pressed={viewMode === mode}
                      className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        viewMode === mode
                          ? "bg-[var(--primary-muted)] text-[var(--primary-deep)]"
                          : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            }
          >
            {/* Filters */}
            {showFilters && (
              <div
                id="catalog-filters"
                className="mb-4 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-warm)] animate-slide-down grid grid-cols-1 sm:grid-cols-3 gap-4"
              >
                <div className="space-y-2">
                  <p className="text-overline">Produce type</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setOrganicOnly((v) => !v)} aria-pressed={organicOnly} className={chipClass(organicOnly)}>
                      <Leaf className="w-3.5 h-3.5 text-[var(--primary-dim)]" />
                      Organic only
                    </button>
                    <button type="button" onClick={() => setSeasonalOnly((v) => !v)} aria-pressed={seasonalOnly} className={chipClass(seasonalOnly, "gold")}>
                      <Star className="w-3.5 h-3.5 text-[var(--gold)]" fill={seasonalOnly ? "currentColor" : "none"} />
                      Seasonal only
                    </button>
                  </div>
                </div>

                <label className="space-y-2 block">
                  <span className="text-overline block">Price</span>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value as typeof priceRange)} className={selectClass}>
                    <option value="all">All prices</option>
                    <option value="under50">Under ₹50</option>
                    <option value="50to150">₹50 – ₹150</option>
                    <option value="over150">Over ₹150</option>
                  </select>
                </label>

                <label className="space-y-2 block">
                  <span className="text-overline block">Sort by</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={selectClass}>
                    <option value="relevance">Best match</option>
                    <option value="price_asc">Price: low to high</option>
                    <option value="price_desc">Price: high to low</option>
                    <option value="popularity">Most sellers</option>
                    <option value="newest">Newest arrivals</option>
                  </select>
                </label>
              </div>
            )}

            {processedProducts.length === 0 ? (
              <EmptyState
                illustration={<EmptySearchIllustration className="w-24 h-24" />}
                title="No produce found"
                description="Nothing matches these filters. Try resetting them or searching for another crop."
                action={
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="h-10 px-5 rounded-full text-sm font-semibold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors"
                  >
                    Reset filters
                  </button>
                }
              />
            ) : (
              <ProductGrid viewMode={viewMode}>
                {processedProducts.map((product) => (
                  <CartAwareProductCard key={product.id} product={product} viewMode={viewMode} />
                ))}
              </ProductGrid>
            )}
          </SectionBlock>

          {/* ── 6. Trust signals ──────────────────────────────────────────── */}
          <div className="pt-6 border-t border-[var(--divider)] grid grid-cols-1 md:grid-cols-3 gap-3">
            <TrustBadge type="escrow" variant="card" />
            <TrustBadge type="farm_direct" variant="card" />
            <TrustBadge type="fresh_local" variant="card" />
          </div>
        </div>
      )}

      {/* ── 7. Floating cart bar ──────────────────────────────────────────── */}
      {cartCount > 0 && (
        <div className="fixed bottom-[80px] lg:bottom-6 left-0 right-0 lg:left-[240px] px-4 z-40 animate-slide-up pointer-events-none">
          <Link
            href="/customer/cart"
            className="pointer-events-auto mx-auto flex items-center justify-between gap-3 max-w-md h-14 pl-2 pr-5 rounded-2xl bg-[var(--primary-deep)] text-white shadow-xl hover:bg-[#0F3D22] transition-colors active:scale-[0.99]"
          >
            <span className="flex items-center gap-3 min-w-0">
              <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-sm font-bold tabular-nums">
                {cartCount}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block text-[11px] text-white/70">{cartCount === 1 ? "1 item" : `${cartCount} items`}</span>
                <span className="block text-sm font-bold tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                  ₹{cartTotal.toFixed(2)}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              View cart <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
