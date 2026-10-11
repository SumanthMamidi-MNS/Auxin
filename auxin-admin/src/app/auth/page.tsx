"use client";

/**
 * auxin-admin/src/app/auth/page.tsx
 * ------------------------------------
 * Admin authentication page for Auxin v3.0.
 * Uses email + password via Supabase Auth.
 * Verifies role is any admin role on our backend before granting access.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { adminSignIn, getAdminMe } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { isAdminRole } from "@/types";
import type { User } from "@/types";

export default function AdminAuthPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [mounted, setMounted]   = useState(false);

  /* ── Mouse Parallax ──────────────────────────────────────────────── */
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const el = containerRef.current;
    if (el) el.addEventListener("mousemove", handleMouseMove);
    return () => { if (el) el.removeEventListener("mousemove", handleMouseMove); };
  }, [handleMouseMove]);

  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const me = await getAdminMe();
        if (me && isAdminRole(me.role)) {
          setAuth(me);
          router.replace("/dashboard");
        }
      }
    })();
  }, [setAuth, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await adminSignIn(email, password);
      if (!result.success) { setError(result.error ?? "Authentication failed."); return; }
      setAuth(result.user as User);
      toast.success("Welcome to the admin dashboard.");
      router.replace("/dashboard");
    } finally { setLoading(false); }
  }

  /* ── Parallax transform helpers ──────────────────────────────────── */
  const px = (mousePos.x - 0.5) * 2; // -1 to 1
  const py = (mousePos.y - 0.5) * 2;

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 160% 120% at 50% -10%, rgba(34,197,94,0.13) 0%, #101214 45%, #0C0E10 100%)",
      }}
    >
      {/* ─── 3D DEPTH BACKGROUND ─────────────────────────────────────── */}

      {/* Perspective grid floor — the key 3D element */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,197,94,0.055) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,197,94,0.055) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: `perspective(900px) rotateX(58deg) scaleX(1.6) translateY(-15%)`,
          transformOrigin: "50% 0%",
          opacity: mounted ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      />

      {/* Flat grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Horizon glow with animated sweep */}
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0, right: 0, top: "38%", height: 2,
          background: "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.18) 20%, rgba(34,197,94,0.35) 50%, rgba(34,197,94,0.18) 80%, transparent 100%)",
          filter: "blur(3px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          left: 0, right: 0, top: "37%", height: 60,
          background: "linear-gradient(180deg, transparent, rgba(34,197,94,0.04) 50%, transparent)",
        }}
      />
      {/* Animated light sweep on horizon */}
      {mounted && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: "37.5%", width: 200, height: 4,
            background: "radial-gradient(ellipse, rgba(34,197,94,0.5) 0%, transparent 70%)",
            filter: "blur(4px)",
            animation: "horizonSweep 8s ease-in-out infinite",
          }}
        />
      )}

      {/* Floating 3D cubes / geometric accent blocks with parallax */}
      {/* Top-left cube */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "14%", left: "8%",
          opacity: 0.22,
          animation: mounted ? "floatCube1 9s ease-in-out infinite" : "none",
          transform: `translate(${px * 20}px, ${py * 14}px)`,
          transition: "transform 0.35s ease-out",
        }}
      >
        <svg width="52" height="58" viewBox="0 0 52 58" fill="none">
          <polygon points="26,0 52,14 52,42 26,56 0,42 0,14" fill="none" stroke="rgba(34,197,94,0.7)" strokeWidth="0.8"/>
          <polygon points="26,0 52,14 26,28 0,14" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.6"/>
          <polygon points="0,14 26,28 26,56 0,42" fill="rgba(34,197,94,0.04)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.6"/>
          <polygon points="52,14 26,28 26,56 52,42" fill="rgba(34,197,94,0.08)" stroke="rgba(34,197,94,0.5)" strokeWidth="0.6"/>
        </svg>
      </div>
      {/* Bottom-right cube */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "15%", right: "7%",
          opacity: 0.18,
          animation: mounted ? "floatCube2 11s ease-in-out infinite" : "none",
          transform: `translate(${px * -18}px, ${py * -12}px)`,
          transition: "transform 0.35s ease-out",
        }}
      >
        <svg width="44" height="50" viewBox="0 0 52 58" fill="none">
          <polygon points="26,0 52,14 52,42 26,56 0,42 0,14" fill="none" stroke="rgba(34,197,94,0.6)" strokeWidth="0.8"/>
          <polygon points="26,0 52,14 26,28 0,14" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.6"/>
          <polygon points="0,14 26,28 26,56 0,42" fill="rgba(34,197,94,0.03)" stroke="rgba(34,197,94,0.3)" strokeWidth="0.6"/>
          <polygon points="52,14 26,28 26,56 52,42" fill="rgba(34,197,94,0.07)" stroke="rgba(34,197,94,0.4)" strokeWidth="0.6"/>
        </svg>
      </div>
      {/* Top-right small diamond */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%", right: "13%",
          opacity: 0.15,
          animation: mounted ? "floatCube3 13s ease-in-out infinite" : "none",
          transform: `translate(${px * -14}px, ${py * 10}px)`,
          transition: "transform 0.35s ease-out",
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <polygon points="16,0 32,16 16,32 0,16" fill="rgba(34,197,94,0.06)" stroke="rgba(34,197,94,0.55)" strokeWidth="0.7"/>
          <polygon points="16,0 32,16 16,16" fill="rgba(34,197,94,0.10)" stroke="none"/>
        </svg>
      </div>
      {/* Bottom-left small diamond */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "18%", left: "10%",
          opacity: 0.13,
          animation: mounted ? "floatCube4 10s ease-in-out infinite" : "none",
          transform: `translate(${px * 16}px, ${py * -10}px)`,
          transition: "transform 0.35s ease-out",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <polygon points="16,0 32,16 16,32 0,16" fill="rgba(34,197,94,0.05)" stroke="rgba(34,197,94,0.45)" strokeWidth="0.7"/>
        </svg>
      </div>

      {/* Wireframe ring — behind card, very subtle */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "50%", left: "50%",
          width: 380, height: 380,
          transform: `translate(-50%, -50%) translate(${px * 4}px, ${py * 3}px)`,
          transition: "transform 0.4s ease-out",
          opacity: mounted ? 0.06 : 0,
          animation: mounted ? "ringRotate 40s linear infinite" : "none",
        }}
      >
        <svg width="380" height="380" viewBox="0 0 380 380" fill="none">
          <ellipse cx="190" cy="190" rx="185" ry="60" stroke="rgba(34,197,94,0.6)" strokeWidth="0.6" strokeDasharray="4 6"/>
          <ellipse cx="190" cy="190" rx="185" ry="60" stroke="rgba(34,197,94,0.3)" strokeWidth="0.4" strokeDasharray="2 8" transform="rotate(60 190 190)"/>
          <ellipse cx="190" cy="190" rx="185" ry="60" stroke="rgba(34,197,94,0.2)" strokeWidth="0.4" strokeDasharray="3 7" transform="rotate(120 190 190)"/>
        </svg>
      </div>

      {/* Floating horizontal data stream lines */}
      {mounted && [
        { top: "25%", delay: "0s", dur: "14s", w: 120, opacity: 0.06 },
        { top: "65%", delay: "4s", dur: "18s", w: 80, opacity: 0.04 },
        { top: "45%", delay: "7s", dur: "16s", w: 100, opacity: 0.05 },
      ].map((l, i) => (
        <div
          key={`stream-${i}`}
          className="absolute pointer-events-none"
          style={{
            top: l.top,
            width: l.w,
            height: 1,
            background: `linear-gradient(90deg, transparent, rgba(34,197,94,0.6), transparent)`,
            opacity: l.opacity,
            animation: `dataStream ${l.dur} linear ${l.delay} infinite`,
          }}
        />
      ))}

      {/* Soft floating particles */}
      {mounted && [
        { left: "20%", delay: "0s", dur: "20s", size: 2 },
        { left: "40%", delay: "5s", dur: "24s", size: 3 },
        { left: "60%", delay: "3s", dur: "22s", size: 2 },
        { left: "80%", delay: "8s", dur: "18s", size: 2 },
        { left: "35%", delay: "10s", dur: "26s", size: 3 },
      ].map((p, i) => (
        <div
          key={`particle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: p.left,
            bottom: "-3%",
            background: "rgba(34,197,94,0.5)",
            animation: `particleRise ${p.dur} linear ${p.delay} infinite`,
          }}
        />
      ))}

      {/* Left vertical accent lines */}
      <div className="absolute pointer-events-none" style={{ top: "20%", left: "4%", opacity: 0.10 }}>
        {[0,12,24].map(offset => (
          <div key={offset} style={{ width: 1, height: 80, background: `linear-gradient(180deg, transparent, rgba(34,197,94,0.8) 50%, transparent)`, marginBottom: 6, marginLeft: offset }} />
        ))}
      </div>
      {/* Right vertical accent lines */}
      <div className="absolute pointer-events-none" style={{ top: "55%", right: "5%", opacity: 0.08 }}>
        {[0,10,20].map(offset => (
          <div key={offset} style={{ width: 1, height: 60, background: `linear-gradient(180deg, transparent, rgba(34,197,94,0.8) 50%, transparent)`, marginBottom: 5, marginLeft: offset }} />
        ))}
      </div>

      {/* Ambient green glows — depth-layer effect */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 600, height: 600,
          top: -200, left: "50%", transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(34,197,94,0.07) 0%, transparent 70%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 300, height: 300,
          bottom: "5%", left: "50%", transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(34,197,94,0.05) 0%, transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      {/* Card-behind green glow pulse */}
      {mounted && (
        <div
          className="absolute pointer-events-none rounded-3xl"
          style={{
            width: 420, height: 340,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            background: "radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)",
            filter: "blur(30px)",
            animation: "cardGlow 4s ease-in-out infinite",
          }}
        />
      )}

      {/* ── KEYFRAME ANIMATIONS ────────────────────────────────────── */}
      <style>{`
        @keyframes floatCube1 {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(2deg); }
          66% { transform: translateY(-6px) rotate(-1deg); }
        }
        @keyframes floatCube2 {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          40% { transform: translateY(-10px) rotate(-2deg); }
          70% { transform: translateY(-5px) rotate(1deg); }
        }
        @keyframes floatCube3 {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(3deg); }
        }
        @keyframes floatCube4 {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          45% { transform: translateY(-8px) rotate(-2deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.0), 0 4px 20px rgba(34,197,94,0.20); }
          50% { box-shadow: 0 0 0 8px rgba(34,197,94,0.04), 0 4px 28px rgba(34,197,94,0.35); }
        }
        @keyframes ringRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes horizonSweep {
          0%, 100% { left: -200px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% + 200px); opacity: 0; }
        }
        @keyframes dataStream {
          0% { left: -150px; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: calc(100% + 150px); opacity: 0; }
        }
        @keyframes particleRise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.5; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-110vh) scale(0.3); opacity: 0; }
        }
        @keyframes cardGlow {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes btnShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
      `}</style>

      {/* ─── CONTENT ─────────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-md"
        style={{ animation: mounted ? "fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both" : "none" }}
      >
        {/* Logo */}
        <div
          className="text-center mb-10"
          style={{ animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both" : "none" }}
        >
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center relative mx-auto mb-5"
            style={{
              border: "2px solid rgba(34,197,94,0.30)",
              boxShadow: "0 8px 32px rgba(34,197,94,0.25), 0 2px 8px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.05)",
              background: "rgba(20,22,25,0.95)",
              animation: mounted ? "logoPulse 3s ease-in-out infinite" : "none",
            }}
          >
            {/* Inner shimmer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)",
                zIndex: 2,
              }}
            />
            <Image src="/logo-cropped.png" alt="Auxin Logo" fill className="object-cover scale-110" priority />
          </div>
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "#F4F4F5", textShadow: "0 2px 20px rgba(34,197,94,0.12)" }}
          >
            Auxin Admin
          </h1>
          <p className="text-[#4A4A54] text-sm mt-1.5 font-medium">Operations &amp; Management Portal</p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-3xl shadow-2xl relative overflow-hidden"
          style={{
            background: "rgba(26,27,30,0.90)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(55,55,62,0.80)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.04) inset, 0 -1px 0 rgba(0,0,0,0.30) inset",
            animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both" : "none",
          }}
        >
          {/* Card top edge highlight — gives 3D lifted feel */}
          <div
            style={{
              position: "absolute", top: 0, left: "10%", right: "10%", height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 30%, rgba(34,197,94,0.14) 50%, rgba(255,255,255,0.08) 70%, transparent)",
            }}
          />

          {/* Shield badge */}
          <div
            className="flex items-center gap-2.5 mb-6"
            style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.3s both" : "none" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)" }}
            >
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
            </div>
            <h2 className="text-sm font-bold text-[#F4F4F5]">Sign In to Admin</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.35s both" : "none" }}>
              <label className="block text-[11px] text-[#52525B] mb-1.5 font-semibold uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@auxin.in"
                className="w-full px-4 py-3 rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#3A3A42] focus:outline-none transition-all duration-150"
                style={{ background: "#1A1B1F", border: "1px solid #2A2A30" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#22C55E";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.12)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#2A2A30";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.4s both" : "none" }}>
              <label className="block text-[11px] text-[#52525B] mb-1.5 font-semibold uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#3A3A42] focus:outline-none transition-all duration-150"
                  style={{ background: "#1A1B1F", border: "1px solid #2A2A30" }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#22C55E";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(34,197,94,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#2A2A30";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#3F3F46] hover:text-[#71717A] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.20)", color: "#FCA5A5" }}
              >
                <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-2 active:scale-[0.99] disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: loading
                  ? "rgba(34,197,94,0.5)"
                  : "linear-gradient(180deg, #4ade80 0%, #22c55e 50%, #15803d 100%)",
                color: "#052E16",
                boxShadow: loading ? "none" : "0 4px 16px rgba(34,197,94,0.35), 0 1px 0 rgba(255,255,255,0.15) inset",
                animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.45s both" : "none",
              }}
            >
              {/* Gloss stripe */}
              {!loading && (
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "46%",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.02) 100%)",
                  borderRadius: "inherit", pointerEvents: "none",
                }} />
              )}
              {/* Animated shimmer sweep */}
              {!loading && (
                <div style={{
                  position: "absolute", top: 0, bottom: 0, width: "35%",
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                  animation: "btnShimmer 3s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              )}
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Authenticating…" : "Sign In"}
            </button>
          </form>
        </div>

        <div
          className="text-center mt-6 space-y-0.5"
          style={{ animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.55s both" : "none" }}
        >
          <p className="text-[#3E3E46] text-xs font-medium">
            Auxin Admin V3.0 · Restricted Access
          </p>
          <p className="text-[#2A2A32] text-[10px] font-medium">
            Designed & Engineered by Sumanth Mamidi
          </p>
        </div>
      </div>
    </div>
  );
}
