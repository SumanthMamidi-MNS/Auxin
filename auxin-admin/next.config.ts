import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Admin runs on port 3001 to avoid conflict with the main app on 3000
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
    unoptimized: process.env.NEXT_PUBLIC_APP_ENV === "development",
  },
  reactStrictMode: true,
};

export default nextConfig;
