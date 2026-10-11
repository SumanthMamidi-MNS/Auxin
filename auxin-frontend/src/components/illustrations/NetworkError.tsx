"use client";
/**
 * components/illustrations/NetworkError.tsx — Auxin v3.0
 * Minimalist luxury SVG illustration for network / connection error state.
 */

export function NetworkErrorIllustration({ className = "w-20 h-20" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="40" cy="40" r="36" fill="rgba(239, 68, 68, 0.04)" stroke="rgba(239, 68, 68, 0.15)" strokeWidth="1.5" strokeDasharray="3 3" />
      {/* WiFi Waves */}
      <path
        d="M24 28C33.5 19 46.5 19 56 28"
        stroke="var(--danger)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M30 36C36 30 44 30 50 36"
        stroke="var(--danger)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M35 44C38 41 42 41 45 44"
        stroke="var(--danger)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="40" cy="52" r="3" fill="var(--danger)" />
      {/* Slash */}
      <line x1="22" y1="20" x2="58" y2="60" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
