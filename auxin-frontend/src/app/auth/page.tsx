"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf, Loader2, Truck, ShoppingBag, Mail, Key } from "lucide-react";
import toast from "react-hot-toast";
import { sendOtp, verifyOtp, getMe } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { UserRole } from "@/types";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.auxin.in";

const ROLES: { value: UserRole; label: string; icon: React.ReactNode }[] = [
  { value: "customer",  label: "Customer",  icon: <ShoppingBag size={16} /> },
  { value: "farmer",    label: "Farmer",    icon: <Leaf size={16} /> },
  { value: "delivery",  label: "Delivery",  icon: <Truck size={16} /> },
];

function redirectByRole(role: string, status: string, router: ReturnType<typeof useRouter>) {
  if (role === "admin" || role.endsWith("_admin")) {
    window.location.href = ADMIN_URL;
    return;
  }
  if (status === "pending") {
    router.replace("/pending-approval");
    return;
  }
  if (role === "farmer")    { router.replace("/farmer/dashboard"); return; }
  if (role === "delivery")  { router.replace("/delivery/dashboard"); return; }
  router.replace("/customer/home");
}

export default function AuthPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, user } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [role, setRole]         = useState<UserRole>("customer");
  const [otpSent, setOtpSent]   = useState(false);
  const [loading, setLoading]   = useState(false);

  // Redirect already-authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      redirectByRole(user.role as string, user.status, router);
    }
  }, [isAuthenticated, user, router]);

  // Listen for Supabase auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          const me = await getMe();
          if (me) {
            setAuth(me);
          } else {
            // New user: redirect to profile setup
            router.replace("/profile/create");
          }
        }
      }
    );
    return () => subscription.unsubscribe();
  }, [setAuth, router]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(email, role);
      if (!result.success) {
        toast.error(result.error ?? "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      toast.success("Verification code sent to your email!");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(email, otp);
      if (!result.success) {
        toast.error(result.error ?? "Verification failed.");
        return;
      }

      // Check backend sync-user record
      const me = await getMe();
      if (me) {
        // Exclude admin role
        if (me.role === "admin" || String(me.role).endsWith("_admin")) {
          await supabase.auth.signOut();
          toast.error("Please use the admin portal.");
          window.location.href = ADMIN_URL;
          return;
        }
        setAuth(me);
        toast.success(`Welcome back, ${me.name.split(" ")[0]}!`);
      } else {
        // Redirect to profile setup
        toast.success("Email verified! Please complete your profile.");
        router.replace("/profile/create");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm mb-4">
            <Leaf size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Auxin</h1>
          <p className="text-emerald-300/70 text-sm mt-1">Farm-fresh, straight to you</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {otpSent ? "Enter Verification Code" : "Sign In / Sign Up"}
          </h2>

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">I want to log in as a……</label>
                <div className="grid grid-cols-3 gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium border transition-all duration-200 ${
                        role === r.value
                          ? "bg-emerald-500/20 border-emerald-400/60 text-emerald-300"
                          : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {r.icon}
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Sending code..." : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <p className="text-white/70 text-sm text-center">
                We sent a 6-digit verification code to <span className="font-semibold text-white">{email}</span>.
              </p>

              {/* OTP Code */}
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Verification Code</label>
                <div className="relative">
                  <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    id="auth-otp"
                    type="text"
                    required
                    pattern="\d{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/25 text-sm font-mono tracking-widest text-center focus:outline-none focus:border-emerald-400/60 focus:ring-1 focus:ring-emerald-400/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? "Verifying..." : "Verify & Login"}
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-center text-xs text-emerald-400 hover:underline transition-colors mt-2"
              >
                ← Back to email entry
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          © {new Date().getFullYear()} Auxin · Farm-fresh marketplace
        </p>
      </div>
    </div>
  );
}
