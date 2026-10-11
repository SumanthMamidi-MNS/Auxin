"use client";
/**
 * components/features/CategoryRail.tsx — Auxin v3.0
 * Horizontally scrollable category chips rail with luxury icons,
 * active indicator pills, and desktop scroll helper arrows.
 */

import { useRef } from "react";
import { clsx } from "clsx";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";

export interface CategoryItem {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "all", label: "All Items", icon: "🌱" },
  { id: "vegetables", label: "Vegetables", icon: "🥬" },
  { id: "fruits", label: "Fruits", icon: "🍎" },
  { id: "grains", label: "Grains & Pulses", icon: "🌾" },
  { id: "dairy", label: "Dairy & Eggs", icon: "🥛" },
  { id: "herbs", label: "Herbs & Spices", icon: "🌿" },
  { id: "natural", label: "Natural Products", icon: "🍯" },
];

interface CategoryRailProps {
  categories?: CategoryItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  className?: string;
}

export function CategoryRail({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onSelectCategory,
  className,
}: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const offset = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  return (
    <div className={clsx("relative group w-full", className)}>
      {/* Left Scroll Arrow (Desktop) */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide py-1 px-0.5 scroll-smooth"
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-2xl whitespace-nowrap text-xs sm:text-sm font-semibold transition-all duration-200 flex-shrink-0 cursor-pointer select-none",
                isSelected
                  ? "bg-[var(--primary)] text-[#FFFFFF] shadow-sm shadow-[var(--primary-glow)] scale-100 font-bold"
                  : "bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
              )}
            >
              <span className="text-base sm:text-lg leading-none">{cat.icon || "🌱"}</span>
              <span>{cat.label}</span>
              {cat.count !== undefined && (
                <span
                  className={clsx(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-2)] text-[var(--text-tertiary)]"
                  )}
                >
                  {cat.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Scroll Arrow (Desktop) */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-md items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] z-10 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
