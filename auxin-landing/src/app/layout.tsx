import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auxin — Hyper-Local Direct-From-Farm Marketplace & Agritech Intelligence",
  description:
    "India's flagship direct-from-farm ecosystem. 100% cultivator margins, 2-hour harvest-to-door deliveries, 25 km geofenced logistics, and Milo AI copilot.",
  keywords: [
    "farm to table india",
    "direct from farmer",
    "hyperlocal produce delivery",
    "organic farm marketplace",
    "auxin",
    "sumanth mamidi",
    "agritech ai",
    "milo ai"
  ],
  metadataBase: new URL("https://auxin.in"),
  authors: [{ name: "Sumanth Mamidi", url: "https://github.com/SumanthMamidi-MNS" }],
  creator: "Sumanth Mamidi",
  openGraph: {
    type: "website",
    siteName: "Auxin",
    title: "Auxin — Pure Farm-to-Doorstep Freshness",
    description: "Zero Brokers. 100% Direct Margins. 25 KM Hyper-Local Delivery in 2 Hours.",
    url: "https://auxin.in",
    images: [{ url: "/logo.png", width: 1200, height: 630, alt: "Auxin Marketplace" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auxin — Hyper-Local Direct Farm Marketplace",
    description: "Zero Brokers. 100% Direct Margins. 25 KM Hyper-Local Delivery in 2 Hours.",
    images: ["/logo.png"],
    creator: "@SumanthMamidi",
  },
  icons: {
    icon: "/logo-cropped.png",
    apple: "/logo-cropped.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF7F2",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
