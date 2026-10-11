"use client";
/**
 * app/customer/product/[id]/page.tsx — Auxin v3.0
 * GOAT-Level Product Detail & Provenance Experience:
 *  - 2-Column Responsive Layout on Desktop (Media/Trust on left, Purchasing/Sellers on right)
 *  - High-Definition 4:5 image presentation with organic and seasonal badges
 *  - Farm Supplier Selection Cards with QuantityStepper
 *  - FBT (Frequently Bought Together) bundle recommendations
 *  - Accordion specifications for shelf life, storage, and Auxin quality guarantee
 *  - Floating bottom buy-bar on mobile
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronLeft, ShoppingBag, Leaf, Calendar, Package, Plus, Minus,
  AlertTriangle, Star, ShieldCheck, Truck, Store, Heart, ChevronDown, Sparkles, ArrowRight
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { catalogueApi, type MasterProductDetail, type FarmerSupplier } from "@/lib/catalogue";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ProductDetailSkeleton } from "@/components/ui/Skeletons";
import toast from "react-hot-toast";
import { getProductImage } from "@/components/features/ProductCard";
import { clsx } from "clsx";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, addItem, updateQty, itemCount } = useCartStore();

  // Collapsible Accordions State
  const [openSection, setOpenSection] = useState<string | null>("description");

  // Wishlist State (Local Storage)
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Load master product details
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["catalogue-product", id],
    queryFn: () => catalogueApi.getProduct(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  // Load suppliers for this product
  const { data: suppliersData, isLoading: suppliersLoading } = useQuery({
    queryKey: ["catalogue-suppliers", id],
    queryFn: () => catalogueApi.getSuppliers(Number(id)).then((r) => r.data),
    enabled: !!id,
    refetchInterval: 10000,
  });

  // Load related products
  const { data: relatedData } = useQuery({
    queryKey: ["catalogue-related"],
    queryFn: () => catalogueApi.list({ page: 1, page_size: 10 }).then((r) => r.data),
    enabled: !isLoading,
  });

  const suppliers = suppliersData ?? [];
  const fbtProducts = (relatedData?.items ?? [])
    .filter((p) => p.id !== Number(id))
    .slice(0, 2);

  // Wishlist localStorage keys
  const getWishlistKey = () => `auxin_wishlist_${user?.id || "guest"}`;

  useEffect(() => {
    if (typeof window === "undefined" || !id) return;
    const key = getWishlistKey();
    const list = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    setIsWishlisted(list.includes(Number(id)));
  }, [id, user?.id]);

  // Track Recently Viewed in localStorage
  useEffect(() => {
    if (typeof window === "undefined" || !product) return;
    const key = `auxin_recent_viewed_${user?.id || "guest"}`;
    const list = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    const filtered = list.filter((pid) => pid !== product.id);
    const next = [product.id, ...filtered].slice(0, 10);
    localStorage.setItem(key, JSON.stringify(next));
  }, [product, user?.id]);

  if (isLoading) return <ProductDetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "var(--bg)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[var(--danger-bg)]">
          <AlertTriangle className="w-8 h-8 text-[var(--danger)]" />
        </div>
        <p className="font-bold text-lg text-[var(--text-primary)]">Product not found</p>
        <Button variant="ghost" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const toggleWishlist = () => {
    const key = getWishlistKey();
    const list = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    let newList: number[];
    let status: boolean;

    if (list.includes(product.id)) {
      newList = list.filter((pid) => pid !== product.id);
      status = false;
      toast.success("Removed from Wishlist", { icon: "🤍" });
    } else {
      newList = [...list, product.id];
      status = true;
      toast.success("Added to Wishlist", { icon: "❤️" });
    }
    localStorage.setItem(key, JSON.stringify(newList));
    setIsWishlisted(status);
  };

  const handleAddSupplierToCart = (supplier: FarmerSupplier, qty = 1, silent = false) => {
    const dummyProduct = {
      id: product.id,
      farmer_id: supplier.farmer_id,
      farmer_name: supplier.farmer_name || "Partner Farmer",
      name: product.name,
      description: product.description || "",
      price: supplier.price,
      quantity: supplier.quantity,
      unit: supplier.unit,
      harvest_date: supplier.harvest_date,
      image_url: product.image_url,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    addItem(dummyProduct, qty, supplier.inventory_id, product.id);
    if (!silent) {
      toast.success(`Added ${product.name} from ${supplier.farmer_name || "farmer"}!`, { icon: "🛒" });
    }
  };

  const totalStock = suppliers.reduce((sum, s) => sum + s.quantity, 0);
  const outOfStock = totalStock === 0;
  const minPrice = suppliers.length > 0 ? Math.min(...suppliers.map((s) => s.price)) : 0;
  const maxPrice = suppliers.length > 0 ? Math.max(...suppliers.map((s) => s.price)) : 0;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      {/* Top Bar for Desktop & Mobile */}
      <TopBar
        title={product.name}
        showBack
        action={
          <button
            onClick={() => router.push("/customer/cart")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--primary)] transition-all relative"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] font-black flex items-center justify-center leading-none">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>
        }
      />

      <div className="page-content py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* ── Left Column: Media Presentation & Trust (5 cols on desktop) ── */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Main Product Image Card */}
            <div className="relative rounded-3xl overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-xs aspect-[4/5] w-full">
              <Image
                src={getProductImage(product.name, product.image_url)}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Wishlist Button */}
              <button
                onClick={toggleWishlist}
                aria-label="Toggle Wishlist"
                className="absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 backdrop-blur-md text-white hover:scale-110 active:scale-95 transition-all shadow-md"
              >
                <Heart
                  className={clsx("w-5 h-5 transition-colors", isWishlisted ? "text-rose-500 fill-rose-500" : "text-white")}
                />
              </button>

              {/* Organic & Seasonal Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[rgba(20,83,45,0.9)] text-[#DCFCE7] backdrop-blur-md shadow-xs flex items-center gap-1">
                  <Leaf className="w-3 h-3" /> 100% Farm Direct
                </span>
                {product.is_seasonal && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[rgba(212,175,55,0.9)] text-[#1C1917] backdrop-blur-md shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Peak Season
                  </span>
                )}
              </div>

              {/* Bottom Image Caption */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Fresh Harvest Promise</p>
                <p className="text-xs text-white/90 leading-tight mt-0.5">Delivered within 25 km of regional farmland within 24h of plucking.</p>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="space-y-2">
              <TrustBadge type="escrow" variant="card" />
            </div>
          </div>

          {/* ── Right Column: Buying Panel & Specifications (7 cols on desktop) ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header Info */}
            <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-overline">Direct Regional Produce</p>
                  <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                    {product.name}
                  </h1>
                </div>

                <Badge label={!outOfStock ? "In Stock" : "Sold Out"} dot />
              </div>

              {/* Price Range & Unit */}
              <div className="pt-2">
                {suppliers.length > 0 ? (
                  <PriceBadge
                    price={minPrice}
                    maxPrice={maxPrice > minPrice ? maxPrice : undefined}
                    unit={product.default_unit}
                    size="xl"
                  />
                ) : (
                  <p className="text-sm font-bold text-[var(--text-secondary)]">Currently out of season</p>
                )}
              </div>

              {/* Quick Meta Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-[var(--divider)] text-xs">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Total Stock</p>
                    <p className="font-bold text-[var(--text-primary)]">{totalStock} {product.default_unit}s</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-[var(--gold)]" />
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Growers</p>
                    <p className="font-bold text-[var(--text-primary)]">{suppliers.length} active farms</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                  <Truck className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <p className="text-[10px] uppercase text-[var(--text-tertiary)] font-bold">Delivery</p>
                    <p className="font-bold text-[var(--text-primary)]">Under 25 KM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Choose Farmer / Supplier Options ── */}
            <div className="space-y-3.5">
              <h2 className="text-overline px-1">Available Farm Harvests ({suppliers.length})</h2>

              {suppliersLoading ? (
                <div className="space-y-3">
                  <div className="h-20 skeleton rounded-3xl" />
                  <div className="h-20 skeleton rounded-3xl" />
                </div>
              ) : suppliers.length === 0 ? (
                <div className="p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-2">
                  <Package className="w-10 h-10 mx-auto text-[var(--text-tertiary)] opacity-40" />
                  <p className="text-sm font-bold text-[var(--text-secondary)]">No farmers are currently listing this crop.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {suppliers.map((sup) => {
                    const cartItem = items.find((i) => i.inventory_id === sup.inventory_id);
                    const cartQty = cartItem?.quantity ?? 0;

                    return (
                      <div
                        key={sup.inventory_id}
                        className="p-4 sm:p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs transition-all hover:border-[var(--card-hover-border)] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                                🌾 {sup.farmer_name || "Partner Farm"}
                              </h3>
                              {sup.is_organic && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary-subtle)] text-[var(--primary-deep)] border border-[var(--primary-glow)]">
                                  Organic
                                </span>
                              )}
                            </div>
                            {sup.farmer_farm_name && (
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                                {sup.farmer_farm_name}
                              </p>
                            )}
                            <p className="text-[11px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> Harvested: {new Date(sup.harvest_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-lg sm:text-xl font-black text-[var(--primary-deep)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                              ₹{sup.price}
                              <span className="text-xs font-normal text-[var(--text-secondary)] ml-0.5">/{sup.unit}</span>
                            </p>
                            <p className="text-[10px] font-bold text-[var(--text-secondary)] mt-0.5">
                              {sup.quantity <= 10 ? `⚠️ Only ${sup.quantity} left` : `Stock: ${sup.quantity}`}
                            </p>
                          </div>
                        </div>

                        {/* Action Stepper / Add Button */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-[var(--divider)]">
                          <span className="text-[10px] text-[var(--text-tertiary)] font-semibold">
                            ⚡ Same-Day Harvest Delivery
                          </span>

                          {cartQty > 0 ? (
                            <QuantityStepper
                              quantity={cartQty}
                              onIncrement={() => {
                                if (cartQty >= sup.quantity) {
                                  toast.error("Cannot exceed available stock.");
                                  return;
                                }
                                updateQty(sup.inventory_id, cartQty + 1, true);
                              }}
                              onDecrement={() => updateQty(sup.inventory_id, cartQty - 1, true)}
                              size="sm"
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleAddSupplierToCart(sup)}
                              icon={<Plus className="w-3.5 h-3.5" />}
                            >
                              Add to Basket
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accordion Specifications */}
            <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
              <h2 className="text-overline pb-1 border-b border-[var(--divider)]">Product Details & Provenance</h2>

              <div className="space-y-2 text-xs">
                {/* Description */}
                <div className="border border-[var(--divider)] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "description" ? null : "description")}
                    className="w-full flex items-center justify-between p-3.5 bg-[var(--surface-2)] text-left font-bold text-[var(--text-primary)]"
                  >
                    <span>Description & Nutrition</span>
                    <ChevronDown className={clsx("w-4 h-4 transition-transform", openSection === "description" && "rotate-180")} />
                  </button>
                  {openSection === "description" && (
                    <div className="p-3.5 bg-[var(--surface)] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--divider)]">
                      <p>{product.description || "Direct master catalogue harvest. Carefully graded and prepared directly by local farmer sellers."}</p>
                      <p className="mt-2 font-bold text-[var(--text-primary)]">
                        ⏱️ Expected Shelf Life: {product.shelf_life_days ? `${product.shelf_life_days} Days` : "5–7 Days from plucking"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Storage Advice */}
                <div className="border border-[var(--divider)] rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenSection(openSection === "storage" ? null : "storage")}
                    className="w-full flex items-center justify-between p-3.5 bg-[var(--surface-2)] text-left font-bold text-[var(--text-primary)]"
                  >
                    <span>Storage & Freshness Tips</span>
                    <ChevronDown className={clsx("w-4 h-4 transition-transform", openSection === "storage" && "rotate-180")} />
                  </button>
                  {openSection === "storage" && (
                    <div className="p-3.5 bg-[var(--surface)] text-[var(--text-secondary)] leading-relaxed border-t border-[var(--divider)]">
                      <p>{product.storage_info || "Store in a cool, dry place. For green vegetables, keep refrigerated inside breathable containers for maximum crispness."}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
