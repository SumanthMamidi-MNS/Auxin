"use client";
/**
 * components/features/SeasonalCard.tsx — Auxin v3.0
 * Editorial Seasonal Harvest feature card (Split layout on desktop, stacked on mobile).
 */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star, Sparkles, ArrowRight, Leaf } from "lucide-react";
import { clsx } from "clsx";
import { PriceBadge } from "@/components/ui/PriceBadge";

interface SeasonalCardProps {
  product: {
    id: number;
    name: string;
    description?: string | null;
    price?: number;
    min_price?: number;
    max_price?: number;
    originalPrice?: number;
    unit?: string;
    default_unit?: string;
    image_url?: string | null;
    farmer_name?: string;
    is_organic?: boolean;
    has_organic?: boolean;
    seasonal_tag?: string;
  };
  className?: string;
}

export function SeasonalCard({ product, className }: SeasonalCardProps) {
  const router = useRouter();
  const isOrganic = product.has_organic || product.is_organic;
  const unit = product.unit || product.default_unit || "kg";
  const displayPrice = product.price ?? product.min_price ?? 0;

  const imageSrc =
    product.image_url ||
    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&q=80&fit=crop";

  return (
    <div
      onClick={() => router.push(`/customer/product/${product.id}`)}
      className={clsx(
        "group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300",
        "border border-[var(--border)] bg-[var(--surface)] shadow-sm hover:shadow-lg hover:border-[var(--card-hover-border)]",
        "flex flex-col md:flex-row items-stretch",
        className
      )}
    >
      {/* ── Image Side (Full on mobile, 45% on desktop) ── */}
      <div className="relative w-full md:w-[46%] h-56 sm:h-64 md:h-auto min-h-[220px] bg-[var(--surface-2)] overflow-hidden">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-xs"
            style={{
              background: "rgba(212, 175, 55, 0.95)",
              color: "#FFFFFF",
              backdropFilter: "blur(4px)",
            }}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{product.seasonal_tag || "Seasonal Special"}</span>
          </div>

          {isOrganic && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold shadow-xs"
              style={{
                background: "rgba(20, 83, 45, 0.92)",
                color: "#DCFCE7",
                backdropFilter: "blur(4px)",
              }}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Organic</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Editorial Content Side (54% on desktop) ── */}
      <div className="p-5 sm:p-7 md:p-8 flex-1 flex flex-col justify-between bg-gradient-to-br from-[var(--surface)] to-[var(--surface-warm)]">
        <div>
          {/* Farm Origin */}
          <p className="text-xs font-bold text-[var(--primary-dim)] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[var(--gold)]" />
            {product.farmer_name || "Featured Organic Farm"}
          </p>

          {/* Product Title */}
          <h3
            className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight group-hover:text-[var(--primary-deep)] transition-colors leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed line-clamp-2 sm:line-clamp-3">
            {product.description ||
              "Handpicked at peak sweetness from certified pesticide-free orchards. Delivered fresh within 24 hours of harvest."}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-[var(--divider)]">
          <PriceBadge
            price={displayPrice}
            maxPrice={product.max_price}
            originalPrice={product.originalPrice}
            unit={unit}
            size="lg"
          />

          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-all shadow-xs group-hover:shadow-sm"
          >
            <span>View Produce</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
