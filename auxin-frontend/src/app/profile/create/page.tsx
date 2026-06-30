"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Mail, Loader2, Leaf } from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { profileApi } from "@/lib/profile";
import { useAuthStore } from "@/store/authStore";

export default function CreateProfilePage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmail, setFetchingEmail] = useState(true);

  useEffect(() => {
    async function loadEmail() {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser?.email) {
          setEmail(sbUser.email);
        } else {
          toast.error("Session expired. Please log in again.");
          router.replace("/auth");
        }
      } catch (err) {
        console.error("Failed to load email:", err);
      } finally {
        setFetchingEmail(false);
      }
    }
    loadEmail();
  }, [router]);

  // Pre-fill name and phone if already synced from auth signup page
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone) {
        // Strip prefix if any for the 10-digit input field
        const cleanPhone = user.phone.replace("+91", "").trim();
        setPhone(cleanPhone);
      }
    }
  }, [user]);

  function getRoleRoute(role: string): string {
    switch (role) {
      case "customer": return "/customer/home";
      case "farmer":   return "/farmer/dashboard";
      case "delivery": return "/delivery/dashboard";
      default:         return "/auth";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Full Name is required.");
      return;
    }

    // Phone validation
    const digits = phone.trim().replace(/\s+/g, "").replace("+91", "");
    if (!/^\d{10}$/.test(digits)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    const blacklist = [
      "9999999999",
      "1111111111",
      "1234567890",
      "0123456789",
      "9876543210"
    ];
    if (blacklist.includes(digits)) {
      toast.error("Invalid phone number sequence. Please enter a real phone number.");
      return;
    }

    if (!address.trim()) {
      toast.error("Primary Address is required.");
      return;
    }

    setLoading(true);
    try {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please log in again.");
        router.replace("/auth");
        return;
      }

      // 2. Read role from user metadata
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      const userRole = sbUser?.user_metadata?.role ?? "customer";

      // 3. Call sync-user first to create/sync the database user row
      const { syncUser } = await import("@/lib/auth");
      await syncUser(session.access_token, {
        name: name.trim(),
        phone: "+91" + digits,
        role: userRole,
        email: email,
      });

      // 4. Now call createProfile to save address and complete profile setup
      const res = await profileApi.createProfile({
        name: name.trim(),
        phone: digits,
        address: address.trim(),
      });

      toast.success("Profile created successfully!");
      setAuth(res.data);

      // Redirect to correct dashboard
      router.replace(getRoleRoute(res.data.role));
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.error ?? "Failed to create profile.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  if (fetchingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 backdrop-blur-sm mb-3">
            <Leaf size={28} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Complete Profile</h1>
          <p className="text-emerald-300/70 text-xs mt-1">Please set up your profile to continue using Auxin</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Read-Only) */}
            <div>
              <label className="block text-xs text-white/60 mb-1.5 font-medium">Email Address (Locked)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/40 text-white/50 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs text-white/60 mb-1.5 font-medium">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs text-white/60 mb-1.5 font-medium">Phone Number</label>
              <div className="relative flex">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/30">
                  <Phone size={16} />
                  <span className="text-sm font-medium text-white/60 border-r border-white/10 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 pl-[4.5rem] pr-4 rounded-xl border border-white/10 bg-black/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Primary Address */}
            <div>
              <label className="block text-xs text-white/60 mb-1.5 font-medium">Primary Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3 text-white/30" />
                <textarea
                  placeholder="Enter primary delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full min-h-[90px] pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-55 active:scale-98 shadow-md shadow-emerald-500/25"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Save and Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
