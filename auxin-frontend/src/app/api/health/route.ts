/**
 * app/api/health/route.ts — Auxin Frontend v2.0
 * Next.js Route Handler that proxies to the backend /health endpoint.
 * Used by Vercel health checks and uptime monitors.
 */

import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ?? "";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      next: { revalidate: 0 }, // always fresh — no caching
      signal: AbortSignal.timeout(8000),
    });

    const data = await res.json();

    return NextResponse.json(
      {
        frontend: "ok",
        backend: data,
        timestamp: new Date().toISOString(),
      },
      { status: res.ok ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        frontend: "ok",
        backend: "unreachable",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
