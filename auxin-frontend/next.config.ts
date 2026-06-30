import type { NextConfig } from "next";

const IS_PROD = process.env.NEXT_PUBLIC_APP_ENV === "production";

const nextConfig: NextConfig = {
  // ── Output ──────────────────────────────────────────────────────────────────
  // standalone: self-contained output — works with Docker, Railway, Render.
  // In dev mode: undefined so hot-reload works normally.
  output: IS_PROD ? "standalone" : undefined,

  // ── Image domains ────────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      // Demo fallback images (only used in dev via demo products)
      { protocol: "https", hostname: "images.unsplash.com" },
      // Your own CDN — uncomment and update when you set up storage
      // { protocol: "https", hostname: "cdn.auxin.in" },
      // { protocol: "https", hostname: "storage.googleapis.com" },
    ],
    // Disable image optimization in dev for speed; full optimization in prod
    unoptimized: !IS_PROD,
    // Aggressively cache images in production
    minimumCacheTTL: IS_PROD ? 86400 : 0,
  },

  // ── React ────────────────────────────────────────────────────────────────────
  // Strict mode helps catch subtle bugs during development
  reactStrictMode: true,

  // ── Security headers (production) ────────────────────────────────────────────
  async headers() {
    if (!IS_PROD) return [];
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-DNS-Prefetch-Control",  value: "on" },
          { key: "X-Content-Type-Options",  value: "nosniff" },
          { key: "X-Frame-Options",         value: "DENY" },
          { key: "X-XSS-Protection",        value: "1; mode=block" },
          { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js needs 'unsafe-inline' for styles in dev; in prod inline styles are minimal
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com",
              // Razorpay checkout script
              "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
              // Razorpay iframe
              "frame-src https://api.razorpay.com https://checkout.razorpay.com",
              "connect-src 'self' https://api.auxin.in https://api.razorpay.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ── Redirects ────────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // Convenience: /login → /auth
      { source: "/login",   destination: "/auth", permanent: true },
      { source: "/signin",  destination: "/auth", permanent: true },
      { source: "/signup",  destination: "/auth", permanent: true },
    ];
  },
};

export default nextConfig;
