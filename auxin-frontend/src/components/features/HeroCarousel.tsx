"use client";
/**
 * components/features/HeroCarousel.tsx — Auxin v3.1
 * Slim promotional strip (replaces the old full-height slide carousel).
 *
 * Phones: horizontally swipeable tiles with snap + a peek of the next tile.
 * Tablets/laptops: all tiles side by side in one compact row.
 * No stock photography, so the art can never mismatch the message.
 */

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

export interface HeroSlide {
  id: string;
  tag: string;
  tagColor?: string;
  tagBg?: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  bgGradient: string;
  /** Kept for backward compatibility; not rendered. */
  imageSrc?: string;
  icon?: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "fair-trade",
    tag: "100% farm direct",
    title: "No middlemen",
    description: "Fair prices, paid to farmers.",
    ctaText: "Explore harvest",
    ctaLink: "#catalog",
    bgGradient: "linear-gradient(135deg, #0F3D22 0%, #14532D 55%, #166534 100%)",
    icon: "🌾",
  },
  {
    id: "seasonal",
    tag: "In season",
    title: "Picked at peak",
    description: "Ripened naturally, picked at peak.",
    ctaText: "Shop seasonal",
    ctaLink: "#seasonal",
    bgGradient: "linear-gradient(135deg, #6B3A0C 0%, #92400E 55%, #B45309 100%)",
    icon: "🥭",
  },
  {
    id: "hyper-local-fresh",
    tag: "25 km promise",
    title: "Harvest to door",
    description: "From farms within 25 km of you.",
    ctaText: "Order fresh",
    ctaLink: "#catalog",
    bgGradient: "linear-gradient(135deg, #115E3B 0%, #15803D 55%, #16A34A 100%)",
    icon: "🚚",
  },
];

interface HeroCarouselProps {
  slides?: HeroSlide[];
  /** Kept for backward compatibility; the strip no longer auto-rotates. */
  autoPlayInterval?: number;
  className?: string;
  onSlideClick?: (slide: HeroSlide) => void;
}

export function HeroCarousel({ slides = DEFAULT_SLIDES, className, onSlideClick }: HeroCarouselProps) {
  const router = useRouter();

  const handleAction = (slide: HeroSlide) => {
    if (onSlideClick) {
      onSlideClick(slide);
      return;
    }
    if (slide.ctaLink.startsWith("#")) {
      const el = document.querySelector(slide.ctaLink) ?? document.querySelector("#catalog");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(slide.ctaLink);
    }
  };

  return (
    <div
      className={clsx(
        "flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-4 -mx-4 px-4",
        "md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible",
        className
      )}
      aria-label="Highlights"
    >
      {slides.map((slide) => (
        <button
          key={slide.id}
          type="button"
          onClick={() => handleAction(slide)}
          className={clsx(
            "group relative snap-start flex-shrink-0 w-[84%] max-w-[340px] md:w-auto md:max-w-none",
            "h-[104px] sm:h-[112px] rounded-2xl overflow-hidden text-left text-white",
            "shadow-xs transition-shadow duration-200 hover:shadow-md",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          )}
          style={{ background: slide.bgGradient }}
        >
          {/* Decorative art */}
          <span aria-hidden="true" className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute right-10 -top-10 w-20 h-20 rounded-full bg-white/[0.06]" />
          <span
            aria-hidden="true"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[44px] sm:text-[48px] leading-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
          >
            {slide.icon || "🌱"}
          </span>

          <span className="relative z-10 flex h-full flex-col justify-between p-4 pr-20">
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">
                {slide.tag}
              </span>
              <span
                className="mt-1 block text-base sm:text-[17px] font-bold leading-tight truncate"
                style={{ fontFamily: "var(--font-heading)", color: "#FFFFFF" }}
              >
                {slide.title}
              </span>
              <span className="mt-0.5 block text-xs text-white/80 leading-snug line-clamp-1">
                {slide.description}
              </span>
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-white">
              {slide.ctaText}
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
