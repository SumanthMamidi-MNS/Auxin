"use client";
/**
 * components/ui/ColdStartLoader.tsx — Auxin v2.0
 * Beautiful loading experience for Render free-tier cold starts.
 * Shows rotating messages with skeleton loaders while backend wakes up.
 */

import { useEffect, useState } from "react";
import { Leaf } from "lucide-react";

const MESSAGES = [
  "Waking up the kitchen...",
  "Connecting to farmers...",
  "Fetching fresh produce...",
  "Warming up the servers...",
  "Almost ready...",
];

const DOTS_INTERVAL = 500; // ms between dot animations
const MESSAGE_INTERVAL = 2800; // ms between message rotations

function SkeletonBar({ width = "100%", height = 14, opacity = 1 }: {
  width?: string | number;
  height?: number;
  opacity?: number;
}) {
  return (
    <div
      className="rounded-lg animate-pulse"
      style={{
        width,
        height,
        background: "#27272A",
        opacity,
      }}
    />
  );
}

function DotsAnimation() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), DOTS_INTERVAL);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-8 text-left">{".".repeat(dots)}</span>;
}

export function ColdStartLoader() {
  const [msgIdx, setMsgIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Slight delay before showing — avoids flash on fast connections
    const showTimer = setTimeout(() => setVisible(true), 300);
    const msgTimer  = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), MESSAGE_INTERVAL);
    return () => {
      clearTimeout(showTimer);
      clearInterval(msgTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: "#0A0A0B" }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(34,197,94,0.07) 0%, transparent 60%)",
        }}
      />

      <div className="relative w-full max-w-[340px] px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <Leaf className="w-7 h-7 text-[#22C55E]" />
          </div>
          <p className="text-lg font-black text-[#F4F4F5] tracking-tight">Auxin</p>
        </div>

        {/* Skeleton cards */}
        <div className="space-y-3 mb-8">
          {/* Category row */}
          <div className="flex gap-2">
            {[80, 70, 90, 65].map((w, i) => (
              <SkeletonBar key={i} width={w} height={32} opacity={1 - i * 0.15} />
            ))}
          </div>

          {/* Product card skeletons */}
          {[1, 2].map((row) => (
            <div
              key={row}
              className="rounded-2xl p-4 space-y-2"
              style={{ background: "#111113", border: "1px solid #1A1A1D" }}
            >
              <SkeletonBar height={120} />
              <SkeletonBar width="70%" height={12} />
              <SkeletonBar width="40%" height={10} />
              <div className="flex justify-between items-center pt-1">
                <SkeletonBar width="30%" height={14} />
                <SkeletonBar width={40} height={32} />
              </div>
            </div>
          ))}
        </div>

        {/* Message */}
        <div className="text-center">
          <p className="text-sm font-medium text-[#A1A1AA]">
            {MESSAGES[msgIdx]}
            <DotsAnimation />
          </p>
          <p className="text-xs text-[#52525B] mt-1">
            Our servers wake up in 30–60 seconds
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="mt-4 h-0.5 rounded-full overflow-hidden"
          style={{ background: "#1A1A1D" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "#22C55E",
              animation: "cold-start-progress 45s linear infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes cold-start-progress {
          0%   { width: 0%; opacity: 1; }
          85%  { width: 90%; opacity: 1; }
          100% { width: 100%; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
