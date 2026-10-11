"use client";
/**
 * app/global-error.tsx — Auxin v3.0
 * Top-level error boundary that catches errors in the root layout itself.
 */

import { RefreshCw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#FDFBF6",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          color: "#0F172A",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px", maxWidth: "420px" }}>
          {/* Logo */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "20px",
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: "20px",
            }}
          >
            <span style={{ fontSize: "24px" }}>🌱</span>
          </div>

          <h1 style={{ color: "#0F172A", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>
            Auxin System Synchronization
          </h1>
          <p style={{ color: "#64748B", fontSize: "13px", lineHeight: 1.6, margin: "0 0 24px" }}>
            An unexpected error occurred at root level. Tap below to reload the marketplace application.
          </p>

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 28px",
              borderRadius: "16px",
              background: "#22C55E",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: "13px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(34,197,94,0.2)",
            }}
          >
            ↻ Reload Auxin
          </button>
        </div>
      </body>
    </html>
  );
}
