"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { PageLoader } from "@/components/ui/Card";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, Loader2, Truck, ShoppingBag, Mail, Key, UserPlus, LogIn, Sparkles, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";
import { sendOtp, verifyOtp, getMe } from "@/lib/auth";
import { profileApi } from "@/lib/profile";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.auxin.in";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "customer",  label: "Customer",  icon: <ShoppingBag size={18} />, desc: "Shop fresh produce" },
  { value: "farmer",    label: "Farmer",    icon: <Leaf size={18} />,        desc: "Sell your harvest" },
  { value: "delivery",  label: "Delivery",  icon: <Truck size={18} />,       desc: "Deliver orders" },
];

type AuthMode = "signin" | "signup";

function redirectByRole(user: any, router: ReturnType<typeof useRouter>) {
  const { role, status, address } = user;
  if (role === "admin" || role.endsWith("_admin")) {
    window.location.href = ADMIN_URL;
    return;
  }
  // Check profile completion first
  if (!address) {
    router.replace("/profile/create");
    return;
  }
  if (status === "pending" || status === "rejected") {
    router.replace("/pending-approval");
    return;
  }
  if (role === "farmer")    { router.replace("/farmer/dashboard"); return; }
  if (role === "delivery")  { router.replace("/delivery/dashboard"); return; }
  router.replace("/customer/home");
}

/* ── SVG Leaf Component ──────────────────────────────────────────────────── */
function SvgLeaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}>
      <path
        d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 13.5C2 15.5 3.75 17.25 3.75 17.25C7 8 17 8 17 8Z"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  );
}

/* ── Floating Glass Panel ─────────────────────────────────────────────── */
function GlassPanel({ width, height, style, animName }: { width: number; height: number; style: React.CSSProperties; animName: string }) {
  return (
    <div
      className="absolute pointer-events-none rounded-xl"
      style={{
        width, height,
        background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(2px)",
        animation: `${animName} 18s ease-in-out infinite`,
        ...style,
      }}
    />
  );
}

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preview = searchParams.get("preview") === "true";
  const queryRole = (searchParams.get("role") as UserRole) || "customer";
  const queryMode = (searchParams.get("mode") as AuthMode) || "signup";
  const queryEmail = searchParams.get("email") || (queryRole === "customer" ? "ananya.sharma@example.com" : queryRole === "farmer" ? "ramesh.harvest@auxin.farm" : "vikram.courier@auxin.delivery");
  const queryOtpSent = searchParams.get("otpSent") === "true";

  const { setAuth, isAuthenticated, user } = useAuthStore();

  const [mode, setMode]         = useState<AuthMode>(queryMode);
  const [email, setEmail]       = useState(queryEmail);
  const [otp, setOtp]           = useState(queryOtpSent ? "482103" : "");
  const [role, setRole]         = useState<UserRole>(queryRole);
  const [otpSent, setOtpSent]   = useState(queryOtpSent);
  const [loading, setLoading]   = useState(false);
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

  // Redirect already-authenticated users
  useEffect(() => {
    if (preview) return;
    if (isAuthenticated && user) {
      redirectByRole(user, router);
    }
  }, [isAuthenticated, user, router, preview]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const me = await getMe();
          if (me) { setAuth(me); }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [setAuth, router]);

  function switchMode(newMode: AuthMode) {
    setMode(newMode);
    setOtpSent(false);
    setOtp("");
    setEmail("");
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { toast.error("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const result = await sendOtp(email, role);
      if (!result.success) { toast.error(result.error ?? "Failed to send OTP."); return; }
      setOtpSent(true);
      toast.success("OTP sent to your email!");
    } finally { setLoading(false); }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) { toast.error("Please enter the OTP."); return; }
    setLoading(true);
    try {
      const result = await verifyOtp(email, otp);
      if (!result.success) {
        toast.error(result.error ?? "Verification failed. Check your code and try again.");
        return;
      }
      const me = await getMe();
      if (me) {
        if (me.role === "admin" || String(me.role).endsWith("_admin")) {
          await supabase.auth.signOut();
          toast.error("Please use the admin portal.");
          window.location.href = ADMIN_URL;
          return;
        }
        const profileExists = await profileApi.getProfile().then(() => true).catch(() => false);
        setAuth(me);
        if (profileExists) {
          toast.success(
            mode === "signup"
              ? "This email already has an account, so we signed you in."
              : `Welcome back, ${me.name.split(" ")[0]}!`
          );
          redirectByRole(me, router);
        } else {
          toast.success("Please complete your profile.");
          router.replace("/profile/create");
        }
      } else {
        toast.success("Email verified! Please complete your profile.");
        router.replace("/profile/create");
      }
    } finally { setLoading(false); }
  }

  /* ── Parallax transform helpers ──────────────────────────────────── */
  const px = (mousePos.x - 0.5) * 2; // -1 to 1
  const py = (mousePos.y - 0.5) * 2;

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center relative overflow-hidden p-4"
      style={{
        background: "radial-gradient(ellipse 130% 110% at 50% 35%, #00FF87 -15%, #00E676 10%, #00C853 30%, #008F39 55%, #006026 80%, #013214 100%)",
      }}
    >
      {/* ── ANIMATED BACKGROUND LAYERS ─────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Luminous orbs with parallax response */}
        <div
          className="absolute rounded-full"
          style={{
            width: 480, height: 480,
            top: -140, left: -120,
            background: "radial-gradient(circle, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.12) 55%, transparent 75%)",
            filter: "blur(3px)",
            animation: mounted ? "floatOrb1 8s ease-in-out infinite" : "none",
            transform: `translate(${px * 12}px, ${py * 8}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 420, height: 420,
            top: -110, right: -110,
            background: "radial-gradient(circle, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.10) 55%, transparent 75%)",
            filter: "blur(3px)",
            animation: mounted ? "floatOrb4 7s ease-in-out infinite" : "none",
            transform: `translate(${px * -10}px, ${py * 6}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380, height: 380,
            bottom: -100, left: -80,
            background: "radial-gradient(circle, rgba(254,240,138,0.28) 0%, rgba(250,204,21,0.10) 55%, transparent 75%)",
            filter: "blur(4px)",
            animation: mounted ? "floatOrb5 9s ease-in-out infinite" : "none",
            transform: `translate(${px * 8}px, ${py * -10}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 360, height: 360,
            bottom: -90, right: -80,
            background: "radial-gradient(circle, rgba(254,240,138,0.26) 0%, rgba(250,204,21,0.08) 55%, transparent 75%)",
            filter: "blur(4px)",
            animation: mounted ? "floatOrb2 10s ease-in-out infinite" : "none",
            transform: `translate(${px * -14}px, ${py * -6}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        {/* Center shimmer */}
        <div
          className="absolute rounded-full"
          style={{
            width: 340, height: 340,
            top: "35%", left: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 60%, transparent 80%)",
            filter: "blur(2px)",
            animation: mounted ? "floatOrb3 12s ease-in-out infinite" : "none",
            transform: `translateX(-50%) translate(${px * 6}px, ${py * 4}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* SVG Leaf decorations (replacing emoji) with parallax */}
        {[
          { top: "10%", left: "7%", rot: -25, opacity: 0.15, size: 44, pFactor: 18 },
          { top: "72%", left: "4%", rot: 40, opacity: 0.12, size: 32, pFactor: 12 },
          { top: "18%", right: "9%", rot: 20, opacity: 0.14, size: 38, pFactor: 22 },
          { top: "82%", right: "6%", rot: -35, opacity: 0.10, size: 30, pFactor: 10 },
          { top: "48%", left: "2%", rot: 55, opacity: 0.08, size: 24, pFactor: 16 },
          { top: "42%", right: "3%", rot: -50, opacity: 0.10, size: 28, pFactor: 14 },
        ].map((l, i) => (
          <SvgLeaf
            key={i}
            className="absolute text-white/80"
            style={{
              top: l.top,
              left: (l as any).left,
              right: (l as any).right,
              opacity: l.opacity,
              width: l.size,
              height: l.size,
              transform: `rotate(${l.rot}deg) translate(${px * l.pFactor}px, ${py * l.pFactor * 0.6}px)`,
              transition: "transform 0.4s ease-out",
              animation: mounted ? `leafFloat${(i % 3) + 1} ${10 + i * 2}s ease-in-out infinite` : "none",
            }}
          />
        ))}

        {/* Floating glass panels — 3D depth elements */}
        <GlassPanel width={120} height={80} animName="glassFloat1" style={{ top: "15%", left: "12%", transform: `rotate(-8deg) translate(${px * 20}px, ${py * 14}px)`, transition: "transform 0.4s ease-out" }} />
        <GlassPanel width={90} height={60} animName="glassFloat2" style={{ top: "22%", right: "10%", transform: `rotate(12deg) translate(${px * -16}px, ${py * 10}px)`, transition: "transform 0.4s ease-out" }} />
        <GlassPanel width={70} height={50} animName="glassFloat3" style={{ bottom: "20%", left: "8%", transform: `rotate(5deg) translate(${px * 14}px, ${py * -12}px)`, transition: "transform 0.4s ease-out" }} />
        <GlassPanel width={100} height={65} animName="glassFloat4" style={{ bottom: "25%", right: "7%", transform: `rotate(-6deg) translate(${px * -18}px, ${py * -8}px)`, transition: "transform 0.4s ease-out" }} />

        {/* Soft floating particles */}
        {mounted && [
          { left: "15%", delay: "0s", dur: "18s", size: 3 },
          { left: "30%", delay: "3s", dur: "22s", size: 2 },
          { left: "55%", delay: "6s", dur: "20s", size: 4 },
          { left: "75%", delay: "2s", dur: "24s", size: 2 },
          { left: "88%", delay: "8s", dur: "19s", size: 3 },
          { left: "42%", delay: "5s", dur: "21s", size: 2 },
        ].map((p, i) => (
          <div
            key={`p-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: "-5%",
              background: "rgba(255,255,255,0.35)",
              animation: `particleRise ${p.dur} linear ${p.delay} infinite`,
            }}
          />
        ))}

        {/* Hexagonal pattern overlay — very subtle */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, #00FF87 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── KEYFRAME ANIMATIONS ────────────────────────────────────── */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 25px) scale(1.05); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20px, -30px) scale(1.04); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translateX(-50%) translate(0, 0) scale(1); }
          40% { transform: translateX(-50%) translate(-25px, 20px) scale(0.96); }
          80% { transform: translateX(-50%) translate(15px, -15px) scale(1.03); }
        }
        @keyframes floatOrb4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10px, 18px) scale(1.06); }
        }
        @keyframes floatOrb5 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18px, -12px) scale(1.04); }
        }
        @keyframes leafFloat1 {
          0%, 100% { opacity: inherit; }
          50% { opacity: calc(inherit + 0.03); transform: rotate(inherit) translateY(-6px); }
        }
        @keyframes leafFloat2 {
          0%, 100% { opacity: inherit; }
          50% { opacity: calc(inherit + 0.02); transform: rotate(inherit) translateY(-8px); }
        }
        @keyframes leafFloat3 {
          0%, 100% { opacity: inherit; }
          50% { opacity: calc(inherit + 0.04); transform: rotate(inherit) translateY(-5px); }
        }
        @keyframes glassFloat1 {
          0%, 100% { transform: rotate(-8deg) translateY(0); }
          50% { transform: rotate(-6deg) translateY(-14px); }
        }
        @keyframes glassFloat2 {
          0%, 100% { transform: rotate(12deg) translateY(0); }
          50% { transform: rotate(10deg) translateY(-10px); }
        }
        @keyframes glassFloat3 {
          0%, 100% { transform: rotate(5deg) translateY(0); }
          50% { transform: rotate(7deg) translateY(-12px); }
        }
        @keyframes glassFloat4 {
          0%, 100% { transform: rotate(-6deg) translateY(0); }
          50% { transform: rotate(-4deg) translateY(-8px); }
        }
        @keyframes particleRise {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(0, 255, 135, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(0, 255, 135, 0); }
        }
        @keyframes btnShimmer {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .otp-input::placeholder { color: rgba(0, 153, 76, 0.35); }
        .email-input::placeholder { color: rgba(0, 153, 76, 0.35); }
      `}</style>

      {/* ── MAIN CARD CONTAINER ────────────────────────────────────── */}
      <div
        className="relative w-full max-w-md"
        style={{
          animation: mounted ? "fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) both" : "none",
        }}
      >
        {/* Logo section */}
        <div
          className="text-center mb-7"
          style={{ animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both" : "none" }}
        >
          <div
            className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center relative mx-auto mb-4"
            style={{
              border: "3px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 32px rgba(34,197,94,0.35), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
              background: "rgba(255,255,255,0.95)",
            }}
          >
            <Image src="/logo-cropped.png" alt="Auxin Logo" fill className="object-cover scale-110" priority />
          </div>

          <div className="inline-flex items-center gap-1.5 bg-white/40 backdrop-blur-sm border border-white/60 rounded-full px-3 py-1 mb-2">
            <Sparkles size={11} className="text-emerald-600" />
            <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">Farm Fresh Platform</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white drop-shadow-sm"
            style={{ fontFamily: "var(--font-heading)", textShadow: "0 2px 12px rgba(21,128,61,0.3)" }}
          >
            Auxin
          </h1>
          <p className="text-sm mt-1 font-medium text-white/90">Farm-fresh, straight to you</p>
        </div>

        {/* White glassmorphism card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(24px)",
            border: "1.5px solid rgba(255,255,255,0.95)",
            boxShadow: "0 20px 60px rgba(21,128,61,0.18), 0 8px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)",
            animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both" : "none",
          }}
        >
          {/* Tab bar */}
          {!otpSent && (
            <div
              className="flex rounded-2xl overflow-hidden mb-6 p-1"
              style={{
                background: "rgba(240,253,244,0.8)",
                border: "1.5px solid #bbf7d0",
                animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.3s both" : "none",
              }}
            >
              <button
                id="tab-signin"
                type="button"
                onClick={() => switchMode("signin")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-250"
                style={
                  mode === "signin"
                    ? { background: "#00E676", color: "#fff", boxShadow: "0 4px 14px rgba(0, 230, 118, 0.45)" }
                    : { color: "#6b7280" }
                }
              >
                <LogIn size={15} />
                Sign In
              </button>
              <button
                id="tab-signup"
                type="button"
                onClick={() => switchMode("signup")}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl transition-all duration-250"
                style={
                  mode === "signup"
                    ? { background: "#00E676", color: "#fff", boxShadow: "0 4px 14px rgba(0, 230, 118, 0.45)" }
                    : { color: "#6b7280" }
                }
              >
                <UserPlus size={15} />
                Sign Up
              </button>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div
                className="text-center"
                style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.35s both" : "none" }}
              >
                <h2 className="text-xl font-black text-gray-800">
                  {mode === "signin" ? "Welcome back 👋" : "Join Auxin today 🌱"}
                </h2>
                <p className="text-xs mt-1.5 text-gray-500 leading-relaxed">
                  {mode === "signin"
                    ? "Enter your email to receive a one-time verification code."
                    : "Enter your email to get started on the platform."}
                </p>
              </div>

              {/* Role Selection — Sign Up only */}
              {mode === "signup" && (
                <div style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.4s both" : "none" }}>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">I am joining as…</label>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-semibold transition-all duration-200 border"
                        style={
                          role === r.value
                            ? {
                                background: "linear-gradient(135deg, #E6FDF4, #C7FBE4)",
                                borderColor: "#00FF87",
                                color: "#007D3E",
                                boxShadow: "0 4px 12px rgba(0,255,135,0.25), inset 0 1px 0 rgba(255,255,255,0.8)",
                              }
                            : {
                                background: "rgba(249,250,251,0.8)",
                                borderColor: "#e5e7eb",
                                color: "#9ca3af",
                              }
                        }
                      >
                        <span style={{ color: role === r.value ? "#16a34a" : "#d1d5db" }}>{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Email field */}
              <div style={{ animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.45s both" : "none" }}>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="email-input w-full pl-10 pr-4 py-3.5 rounded-2xl text-gray-800 text-sm font-medium transition-all duration-200 outline-none"
                    style={{
                      background: "rgba(230,253,245,0.6)",
                      border: "1.5px solid #a7f3d0",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00E676"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,230,118,0.20)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#a7f3d0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
                style={{
                  background: loading
                    ? "#a7fdd2"
                    : "linear-gradient(180deg, #00FF87 0%, #00D974 50%, #00994C 100%)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(0,255,135,0.45), 0 2px 8px rgba(0,153,76,0.3), inset 0 1px 0 rgba(255,255,255,0.40)",
                  animation: mounted ? "staggerIn 0.4s cubic-bezier(0.22,1,0.36,1) 0.5s both" : "none",
                }}
              >
                {/* Gloss shine stripe */}
                {!loading && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "48%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 100%)",
                    borderRadius: "inherit", pointerEvents: "none",
                  }} />
                )}
                {/* Animated shimmer sweep */}
                {!loading && (
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, width: "40%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    animation: "btnShimmer 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                )}
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Sending OTP...</>
                ) : (
                  <><span>Send OTP</span><ArrowRight size={16} /></>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {/* OTP sent confirmation */}
              <div className="text-center">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                    border: "2px solid #86efac",
                    boxShadow: "0 4px 16px rgba(34,197,94,0.20)",
                    animation: "badgePulse 2s infinite",
                  }}
                >
                  <Mail size={24} className="text-emerald-500" />
                </div>
                <h2 className="text-xl font-black text-gray-800">Check your inbox</h2>
                <p className="text-xs mt-1.5 text-gray-500 leading-relaxed">
                  We sent a 6-digit OTP to{" "}
                  <span className="font-bold text-emerald-600">{email}</span>
                </p>
              </div>

              {/* OTP field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">6-Digit OTP</label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                  <input
                    id="auth-otp"
                    type="text"
                    inputMode="numeric"
                    required
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="· · · · · ·"
                    className="otp-input w-full pl-10 pr-4 py-4 rounded-2xl text-gray-800 text-lg font-black font-mono tracking-[0.5em] text-center transition-all duration-200 outline-none"
                    style={{
                      background: "rgba(230,253,245,0.6)",
                      border: "1.5px solid #a7f3d0",
                      letterSpacing: "0.4em",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#00E676"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,230,118,0.20)"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#a7f3d0"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl text-white font-black text-sm transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden active:scale-[0.98]"
                style={{
                  background: loading
                    ? "#a7fdd2"
                    : "linear-gradient(180deg, #00FF87 0%, #00D974 50%, #00994C 100%)",
                  boxShadow: loading ? "none" : "0 8px 24px rgba(0,255,135,0.45), 0 2px 8px rgba(0,153,76,0.3), inset 0 1px 0 rgba(255,255,255,0.30)",
                }}
              >
                {!loading && (
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: "48%",
                    background: "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.04) 100%)",
                    borderRadius: "inherit", pointerEvents: "none",
                  }} />
                )}
                {!loading && (
                  <div style={{
                    position: "absolute", top: 0, bottom: 0, width: "40%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    animation: "btnShimmer 3s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                )}
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Verifying...</>
                ) : (
                  <><span>Verify & Sign In</span><ArrowRight size={16} /></>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setOtpSent(false); setOtp(""); }}
                className="w-full text-center text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mt-1"
              >
                ← Back to email entry
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          className="text-center mt-6 space-y-0.5"
          style={{ animation: mounted ? "staggerIn 0.5s cubic-bezier(0.22,1,0.36,1) 0.65s both" : "none" }}
        >
          <p className="text-white/80 text-xs font-medium drop-shadow-sm">
            Auxin V3.0 · Farm-fresh marketplace
          </p>
          <p className="text-white/50 text-[10px] font-medium">
            Designed & Engineered by Sumanth Mamidi
          </p>
        </div>
      </div>
    </div>
  );
}


export default function AuthPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AuthContent />
    </Suspense>
  );
}
