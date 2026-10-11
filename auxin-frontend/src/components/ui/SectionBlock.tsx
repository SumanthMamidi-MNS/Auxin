"use client";
/**
 * components/ui/SectionBlock.tsx — Auxin v3.0
 * Section container with consistent typographic hierarchy, overline tag,
 * title (Poppins), subtitle, trailing action, and responsive spacing.
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
}: SectionBlockProps) {
  return (
    <section className={clsx(!noMargin && "mb-8 lg:mb-12", className)}>
      {/* Header Row */}
      <div className={clsx("flex items-end justify-between mb-3.5 lg:mb-5 gap-3", headerClassName)}>
        <div>
          {overline && (
            <p className="text-overline mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
              {overline}
            </p>
          )}
          <h2 className="text-h2 text-[var(--text-primary)] font-bold tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-[var(--text-secondary)] mt-0.5 max-w-xl">
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
