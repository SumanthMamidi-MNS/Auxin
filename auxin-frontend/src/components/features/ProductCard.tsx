"use client";
/**
 * components/features/ProductCard.tsx — Auxin v3.0
 * Premium marketplace product cards supporting Grid and List layouts,
 * aggregated CatalogueProduct types, and interactive local storage wishlists.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Minus, Leaf, Heart, Star, Store, AlertTriangle, Sparkles } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { PriceBadge } from "@/components/ui/PriceBadge";
import { ImageWithOverlay } from "@/components/ui/ImageWithOverlay";
import toast from "react-hot-toast";
import { clsx } from "clsx";

/* ── Image resolver with optimized Unsplash sizing ──────────────────────── */

const PRODUCT_IMAGES: Record<string, string> = {
  tomato:    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=600&q=80&fit=crop",
  mango:     "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=600&q=80&fit=crop",
  rice:      "https://images.unsplash.com/photo-1536304993881-ff86e6d42a46?w=600&q=80&fit=crop",
  spinach:   "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&q=80&fit=crop",
  potato:    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&fit=crop",
  onion:     "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=600&q=80&fit=crop",
  wheat:     "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=600&q=80&fit=crop",
  carrot:    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80&fit=crop",
  brinjal:   "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&q=80&fit=crop",
  apple:     "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80&fit=crop",
  banana:    "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&q=80&fit=crop",
  lemon:     "https://images.unsplash.com/photo-1582476561868-cd4d22d7cd1e?w=600&q=80&fit=crop",
  cucumber:  "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=600&q=80&fit=crop",
  capsicum:  "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&q=80&fit=crop",
  default:   "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80&fit=crop",
};

export function getProductImage(name: string, url?: string | null): string {
  if (url && url.trim() !== "") return url;
  const key = name.toLowerCase();
  for (const k of Object.keys(PRODUCT_IMAGES)) {
    if (key.includes(k)) return PRODUCT_IMAGES[k];
  }
  return PRODUCT_IMAGES.default;
}

/* ── Wishlist State Manager ─────────────────────────────────────────────── */

export function useWishlist(productId: number) {
  const { user } = useAuthStore();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const getWishlistKey = () => `auxin_wishlist_${user?.id || "guest"}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = getWishlistKey();
    const list = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    setIsWishlisted(list.includes(productId));
  }, [productId, user?.id]);

  const toggleWishlist = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const key = getWishlistKey();
    const list = JSON.parse(localStorage.getItem(key) || "[]") as number[];
    let newList: number[];
    let status: boolean;

    if (list.includes(productId)) {
      newList = list.filter((id) => id !== productId);
      status = false;
      toast.success("Removed from Wishlist", { icon: "🤍", duration: 1500 });
    } else {
      newList = [...list, productId];
      status = true;
      toast.success("Added to Wishlist", { icon: "❤️", duration: 1500 });
    }
    localStorage.setItem(key, JSON.stringify(newList));
    setIsWishlisted(status);
  };

  return { isWishlisted, toggleWishlist };
}

/* ── CartAwareProductCard ────────────────────────────────────────────────── */

interface CardProps {
  product: any; // CatalogueProduct or Product
  viewMode?: "grid" | "list";
}

export function CartAwareProductCard({ product, viewMode = "grid" }: CardProps) {
  const router = useRouter();
  const { items, addItem, updateQty } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlist(product.id);

  // Eagerly resolve properties for CatalogueProduct (multi-farmer) vs standard Product (single-supplier)
  const isCatalogue = "min_price" in product;
  const price = isCatalogue ? product.min_price : product.price;
  const maxPrice = isCatalogue ? product.max_price : product.price;
  const quantity = isCatalogue ? product.total_stock : product.quantity;
  const unit = isCatalogue ? product.default_unit : product.unit;
  const hasOrganic = isCatalogue ? product.has_organic : product.is_organic;
  const isSeasonal = !!product.is_seasonal;
  const outOfStock = quantity === 0;

  // Retrieve current cart quantity for this master product
  const cartItems = items.filter(
    (i) => i.master_product_id === product.id || i.product.id === product.id
  );
  const cartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCatalogue) {
      // For multi-seller catalog entries, go to details page to choose farmer
      router.push(`/customer/product/${product.id}`);
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} added!`, { icon: "🛒", duration: 1500 });
  };

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCatalogue) return;
    updateQty(product.id, cartQty - 1);
  };

  const isList = viewMode === "list";
  const imageSrc = getProductImage(product.name, product.image_url);

  return (
    <div
      onClick={() => router.push(`/customer/product/${product.id}`)}
      className={clsx(
        "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
        "bg-[var(--surface)] border border-[var(--border)] shadow-xs hover:border-[var(--card-hover-border)] hover:shadow-md hover:-translate-y-1 active:scale-[0.99]",
        isList ? "flex gap-4 p-3 items-center" : "flex flex-col"
      )}
    >
      {/* ── Image Section ── */}
      <div
        className={clsx(
          "relative overflow-hidden rounded-xl flex-shrink-0 bg-[var(--surface-2)]",
          isList ? "w-28 h-28" : "w-full aspect-[4/5]"
        )}
      >
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={isList ? "112px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"}
          style={{ filter: "saturate(1.05) brightness(1.01)" }}
        />
        {/* Subtle Vignette Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 active:scale-75 shadow-xs z-20 backdrop-blur-md"
          style={{
            background: "rgba(255, 255, 255, 0.90)",
            color: isWishlisted ? "var(--danger)" : "var(--text-secondary)",
          }}
        >
          <Heart className="w-4 h-4" fill={isWishlisted ? "#EF4444" : "none"} strokeWidth={2} />
        </button>

        {/* Badges on Top Left */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20 pointer-events-none">
          {hasOrganic && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs"
              style={{
                background: "rgba(20, 83, 45, 0.92)",
                color: "#DCFCE7",
                backdropFilter: "blur(4px)",
              }}
            >
              <Leaf className="w-3 h-3 text-[var(--primary-light)]" />
              <span>Organic</span>
            </div>
          )}
          {isSeasonal && (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold shadow-xs"
              style={{
                background: "rgba(212, 175, 55, 0.92)",
                color: "#FFFFFF",
                backdropFilter: "blur(4px)",
              }}
            >
              <Star className="w-3 h-3 fill-current" />
              <span>Seasonal</span>
            </div>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/80 text-[var(--text-tertiary)] border border-white/10 tracking-wider">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* ── Info & Details Section ── */}
      <div className={clsx("flex-1 flex flex-col justify-between", isList ? "py-1 pr-1" : "p-3.5 sm:p-4")}>
        <div>
          {/* Farm Origin / Multi-Seller Indicator */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1 text-[11px] text-[var(--text-secondary)] font-medium">
            {isCatalogue && product.farmer_count > 0 ? (
              <span className="inline-flex items-center gap-1 text-[var(--purple)] font-semibold">
                <Store className="w-3 h-3" />
                {product.farmer_count} {product.farmer_count === 1 ? "seller" : "sellers"}
              </span>
            ) : (
              <span className="truncate flex items-center gap-1 text-[var(--primary-deep)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                {product.farmer_name || "Direct Farm"}
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3
            className="font-bold text-sm sm:text-base leading-snug text-[var(--text-primary)] line-clamp-1 group-hover:text-[var(--primary-deep)] transition-colors"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h3>

          {/* Unit Description */}
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-1">
            {isCatalogue ? `Fresh ${unit} pack` : `Fresh harvest • /${unit}`}
          </p>

          {/* Low Stock Warning */}
          {!outOfStock && quantity <= 10 && (
            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-[var(--warning)]">
              <AlertTriangle className="w-3 h-3" />
              Only {quantity} left!
            </div>
          )}
        </div>

        {/* Pricing & Action Row */}
        <div className={clsx("flex items-center justify-between gap-2", isList ? "mt-2" : "mt-3 pt-2 border-t border-[var(--divider)]")}>
          <div>
            <PriceBadge
              price={price}
              maxPrice={isCatalogue && maxPrice > price ? maxPrice : undefined}
              unit={unit}
              size="md"
            />
          </div>

          {/* Cart Actions */}
          {cartQty > 0 ? (
            <div
              className="flex items-center rounded-full overflow-hidden shadow-xs bg-[var(--primary)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={handleDec}
                disabled={isCatalogue}
                aria-label="Decrease quantity"
                className="w-7 h-7 flex items-center justify-center transition-all hover:bg-black/15 active:scale-90 disabled:opacity-40 text-[#FFFFFF]"
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
              <span
                className="text-xs font-black min-w-[1.25rem] text-center text-[#FFFFFF] tabular-nums"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {cartQty}
              </span>
              <button
                onClick={handleAdd}
                aria-label="Increase quantity"
                className="w-7 h-7 flex items-center justify-center transition-all hover:bg-black/15 active:scale-90 text-[#FFFFFF]"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className={clsx(
                "px-3.5 h-8 rounded-full flex items-center justify-center gap-1 text-xs font-bold transition-all duration-150 active:scale-95 shadow-xs",
                outOfStock
                  ? "bg-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed"
                  : "bg-[var(--primary)] text-[#FFFFFF] hover:bg-[var(--primary-hover)] hover:shadow-sm"
              )}
            >
              <span>Add</span>
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ProductCardSkeleton ────────────────────────────────────────────────── */

export function ProductCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  const isList = viewMode === "list";
  return (
    <div
      className={clsx(
        "rounded-2xl overflow-hidden p-3 border border-[var(--border)] bg-[var(--surface)] shadow-xs",
        isList ? "flex gap-4 items-center" : "flex flex-col space-y-3"
      )}
    >
      <div className={clsx("skeleton rounded-xl flex-shrink-0", isList ? "w-28 h-28" : "w-full aspect-[4/5]")} />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-3 skeleton w-1/3 rounded" />
        <div className="h-4 skeleton w-3/4 rounded" />
        <div className="h-3 skeleton w-1/2 rounded" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 skeleton w-16 rounded" />
          <div className="h-7 w-14 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}
