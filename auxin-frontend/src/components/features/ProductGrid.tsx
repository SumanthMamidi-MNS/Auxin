"use client";
/**
 * components/features/ProductGrid.tsx — Auxin v3.0
 * Responsive marketplace product grid container with staggered motion,
 * 2-col (mobile) -> 3-col (tablet) -> 4-col (desktop) -> 5-col (wide) layout.
 */

import { clsx } from "clsx";
import type { ReactNode } from "react";

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
          "flex flex-col gap-3 sm:gap-4 max-w-3xl mx-auto w-full",
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
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
    auto: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5",
  };

  return (
    <div
      className={clsx(
        "grid gap-3 sm:gap-4 lg:gap-5 w-full",
        columnStyles[columns],
        stagger && "stagger",
        className
      )}
    >
      {children}
    </div>
  );
}
