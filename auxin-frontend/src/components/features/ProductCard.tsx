"use client";
/**
 * components/features/ProductCard.tsx — Auxin v2.0
 * Dark theme product card — Swiggy/Blinkit inspired.
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Leaf, ShoppingCart } from "lucide-react";
import type { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";

/* ── Image resolver ─────────────────────────────────────────────────────── */

const PRODUCT_IMAGES: Record<string, string> = {
  tomato:   "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80",
  mango:    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80",
  rice:     "https://images.unsplash.com/photo-1536304993881-ff86e6d42a46?w=400&q=80",
  spinach:  "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
  potato:   "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
  onion:    "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80",
  wheat:    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
  carrot:   "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
  brinjal:  "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80",
  default:  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
};

function getProductImage(name: string, url?: string | null): string {
  if (url) return url;
  const key = name.toLowerCase();
  for (const k of Object.keys(PRODUCT_IMAGES)) {
    if (key.includes(k)) return PRODUCT_IMAGES[k];
  }
  return PRODUCT_IMAGES.default;
}

/* ── ProductCard ────────────────────────────────────────────────────────── */

export function ProductCard({ product }: { product: Product }) {
  const router  = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`${product.name} added!`, { icon: "🛒", duration: 1500 });
  };

  const outOfStock = product.quantity === 0;

  return (
    <div
      onClick={() => router.push(`/customer/product/${product.id}`)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97]"
      style={{
        background: "#111113",
        border: "1px solid #27272A",
      }}
    >
      {/* Image */}
      <div className="relative h-40 bg-[#18181B] overflow-hidden">
        <Image
          src={getProductImage(product.name, product.image_url)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 300px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Stock badge */}
        {!outOfStock && (
          <div
            className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.65)", color: "#A1A1AA" }}
          >
            {product.quantity} {product.unit}
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#71717A] bg-black/70 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-[#FAFAFA] text-sm leading-tight line-clamp-1">
          {product.name}
        </p>

        <div className="flex items-center gap-1 mt-1 mb-3">
          <Leaf className="w-3 h-3 text-[#22C55E] flex-shrink-0" />
          <span className="text-[11px] text-[#71717A] truncate">
            {product.farmer_name ?? "Local Farm"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-black text-[#FAFAFA]">
              ₹{product.price}
            </span>
            <span className="text-[11px] text-[#71717A]">/{product.unit}</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: outOfStock ? "#27272A" : "#22C55E",
              color: outOfStock ? "#52525B" : "#052E16",
            }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ProductCardSkeleton ────────────────────────────────────────────────── */

export function ProductCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      <div className="h-40 skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-4 skeleton w-3/4 rounded-lg" />
        <div className="h-3 skeleton w-1/2 rounded-lg" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-5 skeleton w-16 rounded-lg" />
          <div className="h-8 w-8 skeleton rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ── CartAwareProductCard (inline cart controls) ─────────────────────────── */

export function CartAwareProductCard({ product }: { product: Product }) {
  const router     = useRouter();
  const { items, addItem, updateQty } = useCartStore();
  const cartItem   = items.find((i) => i.product.id === product.id);
  const qty        = cartItem?.quantity ?? 0;
  const outOfStock = product.quantity === 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(product, 1);
    if (!cartItem) toast.success(`${product.name} added!`, { icon: "🛒", duration: 1500 });
  };

  const handleDec = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQty(product.id, qty - 1);
  };

  return (
    <div
      onClick={() => router.push(`/customer/product/${product.id}`)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.97]"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      <div className="relative h-40 bg-[#18181B] overflow-hidden">
        <Image
          src={getProductImage(product.name, product.image_url)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {!outOfStock && (
          <div
            className="absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.65)", color: "#A1A1AA" }}
          >
            {product.quantity} {product.unit}
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-[#71717A] bg-black/70 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-[#FAFAFA] text-sm leading-tight line-clamp-1">{product.name}</p>
        <div className="flex items-center gap-1 mt-1 mb-3">
          <Leaf className="w-3 h-3 text-[#22C55E] flex-shrink-0" />
          <span className="text-[11px] text-[#71717A] truncate">{product.farmer_name ?? "Local Farm"}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-base font-black text-[#FAFAFA]">₹{product.price}</span>
            <span className="text-[11px] text-[#71717A]">/{product.unit}</span>
          </div>

          {qty > 0 ? (
            <div
              className="flex items-center gap-2 rounded-xl overflow-hidden"
              style={{ background: "#22C55E" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={handleDec} className="w-8 h-8 flex items-center justify-center text-[#052E16] hover:bg-black/10 active:scale-90 transition-all">
                <span className="text-lg font-bold leading-none">−</span>
              </button>
              <span className="text-sm font-bold text-[#052E16] min-w-[1rem] text-center">{qty}</span>
              <button onClick={handleAdd} className="w-8 h-8 flex items-center justify-center text-[#052E16] hover:bg-black/10 active:scale-90 transition-all">
                <Plus className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: outOfStock ? "#27272A" : "#22C55E",
                color: outOfStock ? "#52525B" : "#052E16",
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
