"use client";
/**
 * components/features/ProductCard.tsx — Auxin v3.1
 * Uniform marketplace product cards (grid + list).
 *
 * Every card has the same anatomy and fixed row heights, so cards line up
 * regardless of name length, badges, or stock state:
 *   square image (object-cover) · meta row · 1-line title · sub row · price/action row
 * Hover only changes shadow/border (no lift, no layout shift).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Minus, Leaf, Heart, Star, Store, AlertTriangle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ProductImage, getProductImage, resolveProductImage } from "@/components/features/ProductImage";
import toast from "react-hot-toast";
import { clsx } from "clsx";

/* Image resolution lives in ProductImage.tsx; re-exported for existing imports. */
export { getProductImage, resolveProductImage };

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

/* ── Helpers ───────────────────────────────────────────────────────────── */

function formatPrice(n: number) {
  const v = Number(n);
  return Number.isInteger(v) ? `${v}` : v.toFixed(2);
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

  // Resolve properties for CatalogueProduct (multi-farmer) vs standard Product (single-supplier)
  const isCatalogue = "min_price" in product;
  const price = isCatalogue ? product.min_price : product.price;
  const maxPrice = isCatalogue ? product.max_price : product.price;
  const quantity = isCatalogue ? product.total_stock : product.quantity;
  const unit = isCatalogue ? product.default_unit : product.unit;
  const hasOrganic = isCatalogue ? product.has_organic : product.is_organic;
  const isSeasonal = !!product.is_seasonal;
  const outOfStock = quantity === 0;
  const lowStock = !outOfStock && quantity <= 10;
  const href = `/customer/product/${product.id}`;

  // Current cart quantity for this master product
  const cartItems = items.filter(
    (i) => i.master_product_id === product.id || i.product.id === product.id
  );
  const cartQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCatalogue) {
      // Multi-seller catalogue entries: go to the details page to choose a farmer
      router.push(href);
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} added!`, { icon: "🛒", duration: 1500 });
  };

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isCatalogue) return;
    updateQty(product.id, cartQty - 1);
  };

  const isList = viewMode === "list";
  const hasRange = isCatalogue && maxPrice > price;

  const metaLabel =
    isCatalogue && product.farmer_count > 0
      ? `${product.farmer_count} ${product.farmer_count === 1 ? "seller" : "sellers"}`
      : product.farmer_name || "Direct from farm";

  /* ── Shared pieces ── */

  const priceBlock = (
    <div className="min-w-0 leading-none">
      <p
        className="text-[15px] font-bold text-[var(--text-price)] tracking-tight truncate tabular-nums"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        ₹{formatPrice(price)}
        {hasRange && (
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">–{formatPrice(maxPrice)}</span>
        )}
      </p>
      <p className="text-[11px] text-[var(--text-tertiary)] mt-1 truncate">per {unit}</p>
    </div>
  );

  const action =
    cartQty > 0 ? (
      <div className="relative z-10 flex items-center h-8 rounded-full bg-[var(--primary)] text-white shadow-xs flex-shrink-0">
        <button
          onClick={handleDec}
          disabled={isCatalogue}
          aria-label={`Decrease ${product.name} quantity`}
          className="w-7 h-8 flex items-center justify-center rounded-l-full hover:bg-black/10 disabled:opacity-40"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
        <span className="min-w-[1.25rem] text-center text-xs font-bold tabular-nums" aria-live="polite">
          {cartQty}
        </span>
        <button
          onClick={handleAdd}
          aria-label={`Increase ${product.name} quantity`}
          className="w-7 h-8 flex items-center justify-center rounded-r-full hover:bg-black/10"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
        </button>
      </div>
    ) : (
      <button
        onClick={handleAdd}
        disabled={outOfStock}
        aria-label={outOfStock ? `${product.name} is sold out` : `Add ${product.name}`}
        className={clsx(
          "relative z-10 h-8 rounded-full flex items-center justify-center gap-1 text-xs font-bold flex-shrink-0 border transition-colors duration-150 active:scale-95",
          outOfStock ? "px-2.5" : "w-8 sm:w-auto sm:px-3",
          outOfStock
            ? "bg-[var(--surface-2)] text-[var(--text-tertiary)] border-[var(--border)] cursor-not-allowed"
            : "bg-[var(--primary-muted)] text-[var(--primary-deep)] border-[var(--primary-ring)] hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)]"
        )}
      >
        {outOfStock ? "Sold out" : (<><Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2.75} /><span className="hidden sm:inline">Add</span></>)}
      </button>
    );

  const subRow = lowStock ? (
    <p className="h-4 flex items-center gap-1 text-[11px] font-semibold text-[#B45309] truncate">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      Only {quantity} left
    </p>
  ) : (
    <p className="h-4 text-[11px] text-[var(--text-secondary)] truncate">
      {hasOrganic ? "Organic available" : product.category_name || "Fresh harvest"}
    </p>
  );

  const titleLink = (
    <Link
      href={href}
      className={clsx(
        "block font-semibold text-[13px] sm:text-sm leading-5 h-5 text-[var(--text-primary)] truncate",
        "after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
      )}
      style={{ fontFamily: "var(--font-heading)" }}
    >
      {product.name}
    </Link>
  );

  /* ── List layout ── */
  if (isList) {
    return (
      <article
        className={clsx(
          "group relative flex items-stretch gap-3 p-2.5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs",
          "transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-[var(--card-hover-border)]",
          "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[var(--primary)]"
        )}
      >
        <div className="relative w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
          <ProductImage
            name={product.name}
            imageUrl={product.image_url}
            categorySlug={product.category_slug}
            categoryIcon={product.category_icon}
            sizes="96px"
            width={240}
          />
          {outOfStock && <div className="absolute inset-0 bg-white/60" />}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div className="min-w-0">
            <p className="h-4 flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] truncate">
              {isCatalogue && product.farmer_count > 0 ? <Store className="w-3 h-3 flex-shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />}
              <span className="truncate">{metaLabel}</span>
              {hasOrganic && <Leaf className="w-3 h-3 text-[var(--primary-dim)] flex-shrink-0" aria-label="Organic" />}
              {isSeasonal && <Star className="w-3 h-3 text-[var(--gold)] fill-current flex-shrink-0" aria-label="Seasonal" />}
            </p>
            {titleLink}
            {subRow}
          </div>
          <div className="flex items-end justify-between gap-2 mt-1.5">
            {priceBlock}
            {action}
          </div>
        </div>

        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          className="relative z-10 self-start w-8 h-8 -mt-0.5 -mr-0.5 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
        >
          <Heart className="w-4 h-4" fill={isWishlisted ? "#EF4444" : "none"} color={isWishlisted ? "#EF4444" : "currentColor"} />
        </button>
      </article>
    );
  }

  /* ── Grid layout ── */
  return (
    <article
      className={clsx(
        "group relative flex flex-col h-full p-2 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs",
        "transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-[var(--card-hover-border)]",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[var(--primary)]"
      )}
    >
      {/* Image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden">
        <ProductImage
          name={product.name}
          imageUrl={product.image_url}
          categorySlug={product.category_slug}
          categoryIcon={product.category_icon}
          imgClassName="transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />

        {/* Badges */}
        {(hasOrganic || isSeasonal) && (
          <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1 pointer-events-none">
            {hasOrganic && (
              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[10px] font-bold bg-[var(--organic-badge-bg)]/90 text-[var(--organic-text)]">
                <Leaf className="w-2.5 h-2.5" /> Organic
              </span>
            )}
            {isSeasonal && (
              <span className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-md text-[10px] font-bold bg-white/95 text-[var(--gold-deep)] shadow-xs ring-1 ring-black/5">
                <Star className="w-2.5 h-2.5 fill-[var(--gold)] text-[var(--gold)]" /> Seasonal
              </span>
            )}
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={toggleWishlist}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          aria-pressed={isWishlisted}
          className="absolute z-10 top-1.5 right-1.5 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 shadow-xs backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--danger)] transition-colors active:scale-90"
        >
          <Heart className="w-4 h-4" fill={isWishlisted ? "#EF4444" : "none"} color={isWishlisted ? "#EF4444" : "currentColor"} strokeWidth={2} />
        </button>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/55">
            <span className="text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full bg-[var(--text-primary)]/85 text-white">
              SOLD OUT
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col px-1 pt-2.5">
        <p className="h-4 flex items-center gap-1 text-[11px] font-medium text-[var(--text-secondary)] truncate">
          {isCatalogue && product.farmer_count > 0 ? (
            <Store className="w-3 h-3 flex-shrink-0 text-[var(--primary-dim)]" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] flex-shrink-0" />
          )}
          <span className="truncate">{metaLabel}</span>
        </p>
        <div className="mt-1">{titleLink}</div>
        {subRow}

        <div className="mt-auto pt-2.5 flex items-end justify-between gap-1.5">
          {priceBlock}
          {action}
        </div>
      </div>
    </article>
  );
}

/* ── ProductCardSkeleton ────────────────────────────────────────────────── */

export function ProductCardSkeleton({ viewMode = "grid" }: { viewMode?: "grid" | "list" }) {
  if (viewMode === "list") {
    return (
      <div className="flex gap-3 p-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
        <div className="skeleton w-[84px] h-[84px] sm:w-24 sm:h-24 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 skeleton w-1/3 rounded" />
          <div className="h-4 skeleton w-2/3 rounded" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-5 skeleton w-14 rounded" />
            <div className="h-8 w-16 skeleton rounded-full" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col p-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
      <div className="skeleton aspect-square w-full rounded-xl" />
      <div className="px-1 pt-2.5 space-y-2">
        <div className="h-3 skeleton w-1/2 rounded" />
        <div className="h-4 skeleton w-3/4 rounded" />
        <div className="h-3 skeleton w-2/5 rounded" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-6 skeleton w-12 rounded" />
          <div className="h-8 w-14 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}
