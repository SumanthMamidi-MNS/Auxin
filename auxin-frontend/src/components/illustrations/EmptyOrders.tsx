"use client";
/**
 * components/illustrations/EmptyOrders.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for empty orders state.
 */

export function EmptyOrdersIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="var(--primary-glow-sm)" stroke="var(--primary-ring)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Clipboard / Box */}
      <rect
        x="24"
        y="22"
        width="32"
        height="42"
        rx="4"
        fill="var(--surface)"
        stroke="var(--primary-dim)"
        strokeWidth="2"
      />
      {/* Clipboard clip */}
      <rect
        x="33"
        y="18"
        width="14"
        height="7"
        rx="2"
        fill="var(--primary-muted)"
        stroke="var(--primary)"
        strokeWidth="1.5"
      />
      {/* Content lines */}
      <line x1="30" y1="33" x2="50" y2="33" stroke="var(--border-2)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="41" x2="46" y2="41" stroke="var(--border-2)" strokeWidth="2" strokeLinecap="round" />
      <line x1="30" y1="49" x2="42" y2="49" stroke="var(--border-2)" strokeWidth="2" strokeLinecap="round" />
      {/* Green Checkmark Circle */}
      <circle cx="50" cy="52" r="8" fill="var(--primary)" />
      <path d="M47 52L49.5 54.5L53.5 49.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
