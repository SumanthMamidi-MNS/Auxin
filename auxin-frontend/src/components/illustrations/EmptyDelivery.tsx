"use client";
/**
 * components/illustrations/EmptyDelivery.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for empty delivery / discovery queue state.
 */

export function EmptyDeliveryIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="var(--primary-glow-sm)" stroke="var(--primary-ring)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Road / Horizon */}
      <path d="M18 56H62" stroke="var(--border-2)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Delivery Van */}
      <path
        d="M23 48V34C23 32.9 23.9 32 25 32H46V48H23Z"
        fill="var(--surface)"
        stroke="var(--primary-dim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M46 38H53.5L57 43V48H46V38Z"
        fill="var(--surface-2)"
        stroke="var(--primary-dim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Wheels */}
      <circle cx="31" cy="48" r="4.5" fill="var(--primary-deep)" stroke="var(--surface)" strokeWidth="2" />
      <circle cx="51" cy="48" r="4.5" fill="var(--primary-deep)" stroke="var(--surface)" strokeWidth="2" />
      {/* GPS / Signal Pin */}
      <circle cx="40" cy="24" r="3" fill="var(--primary)" />
      <path d="M40 27V31" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="24" r="7" stroke="var(--primary)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
    </svg>
  );
}
