"use client";
/**
 * components/illustrations/EmptyCart.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for empty cart state.
 */

export function EmptyCartIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="var(--primary-glow-sm)" stroke="var(--primary-ring)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* Shopping Bag */}
      <path
        d="M26 30H54L51 58C50.8 60.2 49 62 46.8 62H33.2C31 62 29.2 60.2 29 58L26 30Z"
        fill="var(--surface)"
        stroke="var(--primary-dim)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bag Handle */}
      <path
        d="M33 30V24C33 20.1 36.1 17 40 17C43.9 17 47 20.1 47 24V30"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Little Leaf Accent */}
      <path
        d="M40 38C40 38 45 39 46 44C47 49 42 51 40 51C40 51 41 46 40 38Z"
        fill="var(--primary-light)"
        opacity="0.8"
      />
      <path
        d="M40 51C40 46 43 43 46 44"
        stroke="var(--primary-deep)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* Sparkles */}
      <circle cx="23" cy="23" r="1.5" fill="var(--gold)" />
      <circle cx="58" cy="27" r="2" fill="var(--gold)" />
    </svg>
  );
}
