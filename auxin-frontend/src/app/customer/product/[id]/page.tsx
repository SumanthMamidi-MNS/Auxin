"use client";
/**
 * app/customer/product/[id]/page.tsx — Auxin v2.0
 * Premium dark product detail page.
 */

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import {
  ChevronLeft, ShoppingCart, Leaf, Calendar, Package,
  Plus, Minus, AlertCircle, Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { productsApi } from "@/lib/products";
import { useCartStore } from "@/store/cartStore";
import { PageLoader } from "@/components/ui/Card";
import toast from "react-hot-toast";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80";

export default function ProductDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(Number(id)).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) return <PageLoader />;
  if (isError || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6" style={{ background: "#0A0A0B" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.1)" }}>
          <AlertCircle className="w-8 h-8 text-[#EF4444]" />
        </div>
        <p className="text-[#FAFAFA] font-semibold text-lg">Product not found</p>
        <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, qty);
    toast.success(`${product.name} added to cart!`, { icon: "🛒" });
    router.push("/customer/cart");
  };

  const outOfStock = product.quantity === 0;

  return (
    <div className="min-h-screen pb-32" style={{ background: "#0A0A0B" }}>
      {/* Hero image */}
      <div className="relative h-72 bg-[#111113] overflow-hidden">
        <Image
          src={product.image_url ?? FALLBACK_IMG}
          alt={product.name}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-black/30" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        {/* Cart button */}
        <button
          onClick={() => router.push("/customer/cart")}
          className="absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
        >
          <ShoppingCart className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content card sliding up over image */}
      <div
        className="relative -mt-6 rounded-t-3xl px-5 pt-6 pb-6"
        style={{
          background: "#0A0A0B",
          minHeight: "calc(100vh - 264px)",
        }}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-[#FAFAFA] leading-tight">{product.name}</h1>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#22C55E] flex-shrink-0" />
              <span className="text-sm text-[#A1A1AA]">
                {product.farmer_name ?? "Local Farm"}
              </span>
            </div>
          </div>
          <Badge label={product.is_active ? "active" : "unavailable"} dot />
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-sm text-[#71717A] leading-relaxed mb-5">{product.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="rounded-2xl p-4"
            style={{ background: "#111113", border: "1px solid #27272A" }}
          >
            <div className="flex items-center gap-2 text-[#22C55E] mb-2">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold text-[#A1A1AA]">Available Stock</span>
            </div>
            <p className="text-xl font-black text-[#FAFAFA]">
              {product.quantity}
              <span className="text-sm font-normal text-[#71717A] ml-1">{product.unit}</span>
            </p>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "#111113", border: "1px solid #27272A" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-[#F59E0B]" />
              <span className="text-xs font-semibold text-[#A1A1AA]">Harvested</span>
            </div>
            <p className="text-base font-bold text-[#FAFAFA]">
              {new Date(product.harvest_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Freshness indicator */}
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-6"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
        >
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-3.5 h-3.5 text-[#22C55E]" fill="#22C55E" />
            ))}
          </div>
          <span className="text-xs text-[#22C55E] font-medium">Farm-fresh, harvested recently</span>
        </div>

        {/* Price + Qty picker */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-3xl font-black text-[#FAFAFA]">₹{product.price}</span>
            <span className="text-sm text-[#71717A] ml-1">/{product.unit}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#111113", border: "1px solid #27272A" }}
            >
              <Minus className="w-4 h-4 text-[#FAFAFA]" />
            </button>
            <span className="text-lg font-black text-[#FAFAFA] w-7 text-center">{qty}</span>
            <button
              onClick={() => setQty((q) => Math.min(product.quantity, q + 1))}
              disabled={qty >= product.quantity}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
              style={{ background: "#22C55E" }}
            >
              <Plus className="w-4 h-4 text-[#052E16]" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Subtotal */}
        <div
          className="flex justify-between items-center px-4 py-3 rounded-2xl mb-6"
          style={{ background: "#111113", border: "1px solid #1A1A1D" }}
        >
          <span className="text-sm text-[#71717A]">
            Subtotal for {qty} {product.unit}
          </span>
          <span className="font-black text-[#FAFAFA] text-lg">
            ₹{(product.price * qty).toFixed(2)}
          </span>
        </div>

        {/* CTA */}
        <Button
          fullWidth
          size="lg"
          variant={outOfStock ? "outline" : "primary"}
          icon={<ShoppingCart className="w-5 h-5" />}
          onClick={handleAddToCart}
          disabled={outOfStock}
        >
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
