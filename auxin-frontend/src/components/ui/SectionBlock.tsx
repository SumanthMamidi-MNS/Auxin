"use client";
/**
 * components/ui/SectionBlock.tsx — Auxin v3.1
 * Section container with a compact, consistent header:
 * optional overline, title (Poppins), one-line subtitle and trailing action.
 */

import { clsx } from "clsx";
import type { ReactNode } from "react";

interface SectionBlockProps {
  overline?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  noMargin?: boolean;
  id?: string;
}

export function SectionBlock({
  overline,
  title,
  subtitle,
  action,
  children,
  className,
  headerClassName,
  noMargin = false,
  id,
}: SectionBlockProps) {
  return (
    <section id={id} className={clsx(!noMargin && "mb-8 lg:mb-10", "scroll-mt-20", className)}>
      {/* Header Row */}
      <div className={clsx("flex items-end justify-between mb-3 lg:mb-4 gap-3", headerClassName)}>
        <div className="min-w-0">
          {overline && (
            <p className="text-overline mb-0.5 text-[10px] sm:text-[11px]">{overline}</p>
          )}
          <h2
            className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] leading-tight truncate"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Section Content */}
      {children}
    </section>
  );
}
