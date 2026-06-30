/**
 * auxin-landing/src/app/layout.tsx
 * Root layout for the Auxin marketing site (auxin.com)
 */
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default:  "Auxin — Fresh From the Farm",
    template: "%s | Auxin",
  },
  description:
    "India's first farmer-direct marketplace. Fresh produce harvested daily, delivered to your door. No middlemen, no compromise.",
  keywords: [
    "farm to table india", "buy from farmers", "fresh vegetables online",
    "organic produce delivery", "auxin marketplace",
  ],
  metadataBase: new URL("https://auxin.in"),
  alternates:   { canonical: "/" },
  robots:       { index: true, follow: true },
  openGraph: {
    type:        "website",
    siteName:    "Auxin",
    title:       "Auxin — Fresh From the Farm",
    description: "India's first farmer-direct marketplace.",
    url:         "https://auxin.in",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Auxin" }],
  },
  twitter: {
    card:  "summary_large_image",
    title: "Auxin — Fresh From the Farm",
    images: ["/og.png"],
  },
  icons: {
    icon:  "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
  themeColor:   "#1B5E20",
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ margin: 0, fontFamily: "'Inter', system-ui, sans-serif", background: "#FAF9F6" }}>
        {children}
      </body>
    </html>
  );
}
