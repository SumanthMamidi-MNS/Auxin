"use client";
/**
 * components/illustrations/EmptySearch.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for no search results found.
 */

export function EmptySearchIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="var(--primary-glow-sm)" stroke="var(--primary-ring)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Magnifying Glass */}
      <circle
        cx="37"
        cy="37"
        r="14"
        fill="var(--surface)"
        stroke="var(--primary-dim)"
        strokeWidth="2.5"
      />
      <path
        d="M47 47L58 58"
        stroke="var(--primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Sprout inside lens */}
      <path
        d="M37 32C37 36 34 39 31 39C31 35 34 32 37 32Z"
        fill="var(--primary)"
      />
      <path
        d="M37 34C37 37 40 40 43 40C43 37 40 34 37 34Z"
        fill="var(--primary-light)"
      />
      <path
        d="M37 32V42"
        stroke="var(--primary-deep)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
