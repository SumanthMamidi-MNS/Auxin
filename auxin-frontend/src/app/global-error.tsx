"use client";
/**
 * app/global-error.tsx — Auxin v2.0
 * Top-level error boundary that catches errors in the root layout itself.
 * Next.js requires this to have its own <html> and <body> tags.
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
          background: "#0A0A0B",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center", padding: "24px", maxWidth: "400px" }}>
          {/* Logo */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontSize: "24px" }}>🌿</span>
          </div>

          <h1 style={{ color: "#F4F4F5", fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
            Auxin ran into a problem
          </h1>
          <p style={{ color: "#71717A", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
            Something critical failed. Please refresh the page.
          </p>

          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              borderRadius: "12px",
              background: "#22C55E",
              color: "#052E16",
              fontWeight: 600,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            ↻ Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
