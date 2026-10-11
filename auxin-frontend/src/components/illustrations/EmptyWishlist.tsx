"use client";
/**
 * components/illustrations/EmptyWishlist.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for empty wishlist state.
 */

export function EmptyWishlistIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="rgba(239, 68, 68, 0.04)" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Heart */}
      <path
        d="M40 57C40 57 23 45 23 32.5C23 26.5 27.5 22 33.5 22C37 22 39.5 24 40 25.5C40.5 24 43 22 46.5 22C52.5 22 57 26.5 57 32.5C57 45 40 57 40 57Z"
        fill="var(--surface)"
        stroke="#EF4444"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Small floating plant leaf inside or near */}
      <path
        d="M40 33C38 37 39 42 42 44C45 42 45 37 40 33Z"
        fill="var(--primary-light)"
        opacity="0.85"
      />
      {/* Little floating hearts */}
      <circle cx="58" cy="24" r="1.5" fill="var(--gold)" />
      <circle cx="21" cy="28" r="2" fill="var(--gold)" />
    </svg>
  );
}
