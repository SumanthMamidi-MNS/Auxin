"use client";
/**
 * components/features/SeasonalCard.tsx — Auxin v3.1
 * Compact seasonal spotlight card: square thumbnail + text, fixed height.
 * Uses ProductImage, so it never shows a photo of a different product.
 */

import Link from "next/link";
import { Star, Leaf, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { ProductImage } from "@/components/features/ProductImage";

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
    category_slug?: string;
    category_icon?: string | null;
  };
  className?: string;
}

export function SeasonalCard({ product, className }: SeasonalCardProps) {
  const isOrganic = product.has_organic || product.is_organic;
  const unit = product.unit || product.default_unit || "kg";
  const displayPrice = product.price ?? product.min_price ?? 0;

  return (
    <article
      className={clsx(
        "group relative flex items-center gap-3 p-2.5 h-[104px] rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-xs",
        "transition-[box-shadow,border-color] duration-200 hover:shadow-md hover:border-[var(--card-hover-border)]",
        "has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-[var(--primary)]",
        className
      )}
    >
      <div className="relative w-[84px] h-[84px] rounded-xl overflow-hidden flex-shrink-0">
        <ProductImage
          name={product.name}
          imageUrl={product.image_url}
          categorySlug={product.category_slug}
          categoryIcon={product.category_icon}
          sizes="84px"
          width={240}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--gold-deep)]">
          <Star className="w-3 h-3 fill-[var(--gold)] text-[var(--gold)]" />
          {product.seasonal_tag || "In season"}
          {isOrganic && (
            <span className="ml-1 inline-flex items-center gap-0.5 normal-case tracking-normal text-[var(--primary-dim)]">
              <Leaf className="w-3 h-3" /> Organic
            </span>
          )}
        </p>
        <Link
          href={`/customer/product/${product.id}`}
          className="mt-0.5 block text-sm font-semibold text-[var(--text-primary)] truncate after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[13px] font-bold text-[var(--text-price)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
          ₹{displayPrice}
          {product.max_price && product.max_price > displayPrice ? (
            <span className="font-semibold text-[var(--text-secondary)]">–{product.max_price}</span>
          ) : null}
          <span className="ml-0.5 text-[11px] font-normal text-[var(--text-tertiary)]">/{unit}</span>
        </p>
      </div>

      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 group-hover:text-[var(--primary)]" aria-hidden="true" />
    </article>
  );
}
