"use client";
/**
 * components/features/ProductGrid.tsx — Auxin v3.1
 * Uniform product layouts.
 *
 * ProductGrid: 2 cols (phones) -> 3 (tablets) -> 4 (laptops) -> 5 (wide),
 *   every cell the same width; cards stretch to equal height per row.
 * ProductRail: horizontally scrollable row with snap; each card is exactly
 *   one grid column wide, so rail cards and grid cards are the same size.
 */

import { Children, useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";

interface ProductGridProps {
  children: ReactNode;
  viewMode?: "grid" | "list";
  columns?: 2 | 3 | 4 | 5 | "auto";
  className?: string;
  stagger?: boolean;
}

export function ProductGrid({
  children,
  viewMode = "grid",
  columns = "auto",
  className,
  stagger = true,
}: ProductGridProps) {
  if (viewMode === "list") {
    return (
      <div
        className={clsx(
          "grid grid-cols-1 lg:grid-cols-2 gap-3 w-full",
          stagger && "stagger",
          className
        )}
      >
        {children}
      </div>
    );
  }

  const columnStyles = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
    auto: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  };

  return (
    <div
      className={clsx(
        "grid gap-3 sm:gap-4 w-full",
        columnStyles[columns],
        stagger && "stagger",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ProductRail({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const scrollByPage = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };
  const arrow =
    "hidden lg:flex absolute top-[38%] -translate-y-1/2 z-20 w-9 h-9 rounded-full items-center justify-center " +
    "bg-[var(--surface)] border border-[var(--border)] shadow-md text-[var(--text-secondary)] " +
    "hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] opacity-0 group-hover/rail:opacity-100 focus-visible:opacity-100 transition-opacity";

  return (
    <div className="relative group/rail">
      <button type="button" aria-label="Scroll left" onClick={() => scrollByPage(-1)} className={clsx(arrow, "-left-4")}>
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div
        ref={trackRef}
        role="list"
        aria-label={label}
        className={clsx(
          "flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory scroll-px-4 md:scroll-px-6 lg:scroll-px-0",
          "-mx-4 px-4 md:-mx-6 md:px-6 lg:mx-0 lg:px-0 pb-1",
          className
        )}
      >
        {Children.map(children, (child) => (
          <div
            role="listitem"
            className={clsx(
              "snap-start flex-shrink-0",
              // Same width as one ProductGrid column at every breakpoint
              "w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)]"
            )}
          >
            {child}
          </div>
        ))}
      </div>
      <button type="button" aria-label="Scroll right" onClick={() => scrollByPage(1)} className={clsx(arrow, "-right-4")}>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
