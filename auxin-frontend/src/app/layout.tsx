/**
 * app/layout.tsx â€“ Root layout with providers and production SEO
 */

import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.auxin.in";

export const metadata: Metadata = {
  // â”€â”€ Basic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  title: {
    default:  "Auxin â€” Fresh From the Farm",
    template: "%s | Auxin",
  },
  description:
    "Buy directly from farmers. Fresh vegetables, fruits, and grains â€” harvested and delivered to your door. No middlemen. Fair prices.",
  keywords: [
    "fresh produce", "farm to table", "organic vegetables", "buy from farmers",
    "auxin", "marketplace", "fresh fruits", "farm delivery india",
  ],

  // â”€â”€ Canonical + robots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  metadataBase:  new URL(APP_URL),
  alternates:    { canonical: "/" },
  robots: {
    index:  true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  // â”€â”€ Open Graph (Facebook, WhatsApp previews) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  openGraph: {
    type:        "website",
    siteName:    "Auxin",
    title:       "Auxin â€” Fresh From the Farm",
    description: "Buy directly from farmers. No middlemen. Fair prices.",
    url:         APP_URL,
    images: [
      {
        url:    "/og-image.png",   // 1200Ã—630 image in /public
        width:  1200,
        height: 630,
        alt:    "Auxin â€” Fresh farm produce marketplace",
      },
    ],
  },

  // â”€â”€ Twitter card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  twitter: {
    card:        "summary_large_image",
    title:       "Auxin â€” Fresh From the Farm",
    description: "Buy directly from farmers. No middlemen. Fair prices.",
    images:      ["/og-image.png"],
  },

  // â”€â”€ PWA / icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  manifest: "/manifest.json",
  icons: {
    icon:             [{ url: "/favicon.ico" }, { url: "/icon-192.png", sizes: "192x192" }],
    apple:            "/apple-touch-icon.png",
    shortcut:         "/favicon.ico",
  },

  // â”€â”€ App metadata â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  applicationName: "Auxin",
  creator:         "Auxin Team",
  publisher:       "Auxin",
  category:        "shopping",
};

export const viewport: Viewport = {
  width:         "device-width",
  initialScale:  1,
  // Zoom lock removed for WCAG 1.4.4 accessibility compliance
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B5E20" },
    { media: "(prefers-color-scheme: dark)",  color: "#1B5E20" },
  ],
};

import { MiloAssistant } from "@/components/ui/MiloAssistant";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to font + API origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <MiloAssistant />
        </Providers>
      </body>
    </html>
  );
}

