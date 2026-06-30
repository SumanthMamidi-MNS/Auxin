"use client";

/**
 * auxin-admin/src/app/auth/page.tsx
 * ------------------------------------
 * Admin authentication page for Auxin v2.0.
 * Uses email + password via Supabase Auth.
 * Verifies role is any admin role on our backend before granting access.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Loader2, AlertCircle, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { adminSignIn, getAdminMe } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { isAdminRole } from "@/types";
import type { User } from "@/types";

const ADMIN_ROLES = ["admin", "super_admin", "support_admin", "operations_admin", "logistics_admin"];

export default function AdminAuthPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Bootstrap: restore session on refresh
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
      if (!result.success) {
        setError(result.error ?? "Authentication failed.");
        return;
      }

      setAuth(result.user as User);
      toast.success("Welcome to the admin dashboard.");
      router.replace("/dashboard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.08) 0%, #0A0A0B 60%)",
      }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <Leaf className="w-7 h-7 text-[#22C55E]" />
          </div>
          <h1 className="text-3xl font-black text-[#F4F4F5] tracking-tight">Auxin Admin</h1>
          <p className="text-[#52525B] text-sm mt-1.5">Operations & Management Portal</p>
        </div>

        {/* Card */}
        <div
          className="p-8 rounded-3xl shadow-2xl"
          style={{
            background: "rgba(24,24,27,0.8)",
            backdropFilter: "blur(20px)",
            border: "1px solid #27272A",
          }}
        >
          <h2 className="text-base font-bold text-[#F4F4F5] mb-6">Sign In to Admin</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs text-[#71717A] mb-1.5 font-medium">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@auxin.in"
                className="w-full px-4 py-3 rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#3F3F46] focus:outline-none transition-all"
                style={{
                  background: "#1F1F23",
                  border: "1px solid #27272A",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#22C55E";
                  e.currentTarget.style.boxShadow = "0 0 0 2px rgba(34,197,94,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#27272A";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-[#71717A] mb-1.5 font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 rounded-xl text-sm text-[#F4F4F5] placeholder:text-[#3F3F46] focus:outline-none transition-all"
                  style={{
                    background: "#1F1F23",
                    border: "1px solid #27272A",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#22C55E";
                    e.currentTarget.style.boxShadow = "0 0 0 2px rgba(34,197,94,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#27272A";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52525B] hover:text-[#A1A1AA] transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#FCA5A5",
                }}
              >
                <AlertCircle className="w-4 h-4 text-[#EF4444] flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-2 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: loading ? "rgba(34,197,94,0.6)" : "#22C55E",
                color: "#052E16",
                boxShadow: "0 4px 14px rgba(34,197,94,0.2)",
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Authenticating…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-[#3F3F46] text-xs mt-6">
          Auxin Admin Portal · Restricted Access
        </p>
      </div>
    </div>
  );
}
