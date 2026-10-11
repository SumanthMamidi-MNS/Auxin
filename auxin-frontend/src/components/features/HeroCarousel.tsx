"use client";
/**
 * components/features/HeroCarousel.tsx — Auxin v3.0
 * Editorial promotional carousel with auto-rotation, pagination dots,
 * responsive aspect ratios (16:9 on desktop, 2:1 on mobile), and micro-motion.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
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
  imageSrc?: string;
  icon?: string;
}

const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: "fair-trade",
    tag: "100% DIRECT",
    tagColor: "#DCFCE7",
    tagBg: "rgba(20, 83, 45, 0.9)",
    title: "Empower Indian Farmers",
    description: "Skip the middlemen. 100% of profit margins flow straight to the producer at your doorstep.",
    ctaText: "Explore Harvest",
    ctaLink: "#catalog",
    bgGradient: "linear-gradient(135deg, #14532D 0%, #166534 50%, #052E16 100%)",
    imageSrc: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=1200&q=80&fit=crop",
    icon: "🌾",
  },
  {
    id: "seasonal-mangoes",
    tag: "SEASON'S BEST",
    tagColor: "#FFFFFF",
    tagBg: "rgba(212, 175, 55, 0.9)",
    title: "Ratnagiri Alphonso Mangoes",
    description: "Naturally tree-ripened, chemical-free organic mangoes harvested fresh this morning.",
    ctaText: "Shop Mangoes",
    ctaLink: "#catalog",
    bgGradient: "linear-gradient(135deg, #78350F 0%, #B45309 50%, #D97706 100%)",
    imageSrc: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=1200&q=80&fit=crop",
    icon: "🥭",
  },
  {
    id: "hyper-local-fresh",
    tag: "25 KM PROMISE",
    tagColor: "#E0F2FE",
    tagBg: "rgba(7, 89, 133, 0.9)",
    title: "Harvest to Door in 2 Hours",
    description: "Hyper-local geo-fenced deliveries preserving maximum vitamins and crisp farm texture.",
    ctaText: "Order Fresh",
    ctaLink: "#catalog",
    bgGradient: "linear-gradient(135deg, #0C4A6E 0%, #0369A1 50%, #0284C7 100%)",
    imageSrc: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80&fit=crop",
    icon: "🚚",
  },
];

interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
  className?: string;
  onSlideClick?: (slide: HeroSlide) => void;
}

export function HeroCarousel({
  slides = DEFAULT_SLIDES,
  autoPlayInterval = 6000,
  className,
  onSlideClick,
}: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused) return;
    timerRef.current = setInterval(nextSlide, autoPlayInterval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, autoPlayInterval]);

  const activeSlide = slides[current];

  const handleAction = (slide: HeroSlide) => {
    if (onSlideClick) {
      onSlideClick(slide);
      return;
    }
    if (slide.ctaLink.startsWith("#")) {
      const el = document.querySelector(slide.ctaLink);
      el?.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(slide.ctaLink);
    }
  };

  return (
    <div
      className={clsx(
        "relative rounded-3xl overflow-hidden shadow-md group select-none",
        "h-52 sm:h-64 lg:h-72 w-full",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slides Background Container */}
      {slides.map((slide, idx) => {
        const isActive = idx === current;
        return (
          <div
            key={slide.id}
            className={clsx(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
            style={{ background: slide.bgGradient }}
          >
            {/* Background Image with Dark Vignette */}
            {slide.imageSrc && (
              <div className="absolute inset-0">
                <Image
                  src={slide.imageSrc}
                  alt={slide.title}
                  fill
                  priority={idx === 0}
                  className="object-cover opacity-35 mix-blend-overlay"
                  sizes="(max-width: 1024px) 100vw, 1280px"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
              </div>
            )}

            {/* Slide Content */}
            <div className="relative z-10 h-full p-5 sm:p-8 lg:p-10 flex flex-col justify-between max-w-xl text-white">
              <div>
                {/* Tag Pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wider uppercase backdrop-blur-md mb-2 sm:mb-3 shadow-xs"
                  style={{
                    background: slide.tagBg || "rgba(255, 255, 255, 0.2)",
                    color: slide.tagColor || "#FFFFFF",
                  }}
                >
                  <span>{slide.icon || "🌱"}</span>
                  <span>{slide.tag}</span>
                </div>

                {/* Title */}
                <h2
                  className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight leading-tight"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {slide.title}
                </h2>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/85 mt-1 sm:mt-2 line-clamp-2 max-w-md leading-relaxed">
                  {slide.description}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleAction(slide)}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold bg-white text-[var(--text-primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <span>{slide.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Manual Navigation Controls (Hover visible on desktop) */}
      <button
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 right-4 sm:bottom-5 sm:right-6 flex items-center gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={clsx(
              "h-1.5 rounded-full transition-all duration-300",
              idx === current ? "w-6 bg-white shadow-xs" : "w-1.5 bg-white/40 hover:bg-white/70"
            )}
          />
        ))}
      </div>
    </div>
  );
}
