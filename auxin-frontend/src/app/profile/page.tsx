"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Mail, Loader2, ArrowLeft, Edit2, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi } from "@/lib/profile";
import { useAuthStore } from "@/store/authStore";
import { TopBar } from "@/components/layout/TopBar";

export default function ProfilePage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Fetch latest profile from backend on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await profileApi.getProfile();
        const profile = res.data;
        setEmail(profile.email ?? "");
        setName(profile.name);
        
        // Strip prefix for input editing
        const cleanPhone = (profile.phone ?? "").replace("+91", "").trim();
        setPhone(cleanPhone);
        setAddress(profile.address ?? "");
        
        // Keep Zustand synced
        setAuth(profile);
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        // If profile not found, they must create one
        if (err.response?.status === 404) {
          toast.error("Please set up your profile first.");
          router.replace("/profile/create");
        } else {
          toast.error("Failed to fetch profile.");
        }
      } finally {
        setFetching(false);
      }
    }
    loadProfile();
  }, [router, setAuth]);

  async function handleSave(e: React.FormEvent) {
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
      toast.error("Invalid phone number sequence.");
      return;
    }

    if (!address.trim()) {
      toast.error("Primary Address is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await profileApi.updateProfile({
        name: name.trim(),
        phone: digits,
        address: address.trim(),
      });

      toast.success("Profile updated successfully!");
      setAuth(res.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.error ?? "Failed to update profile.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    // Reset inputs to Zustand state
    if (user) {
      setName(user.name);
      const cleanPhone = (user.phone ?? "").replace("+91", "").trim();
      setPhone(cleanPhone);
      setAddress(user.address ?? "");
    }
    setIsEditing(false);
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B" }}>
      <TopBar title="My Profile" showBack={true} />

      <div className="max-w-lg mx-auto p-4 pt-6 pb-24">
        {/* Profile Card */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          {/* Header section with edit toggle */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div>
              <h2 className="text-xl font-bold text-white">Account Details</h2>
              <p className="text-xs text-[#71717A] mt-0.5">Manage your personal information</p>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 active:scale-95 transition-all duration-150"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Email (Always Read-Only) */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Email Address (Locked)</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/5 bg-black/40 text-white/40 text-sm focus:outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/10 bg-black/20 text-white text-sm disabled:opacity-75 disabled:cursor-not-allowed placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Phone Number</label>
              <div className="relative flex">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-white/30">
                  <Phone size={16} />
                  <span className="text-sm font-medium text-white/50 pr-2 border-r border-white/10">+91</span>
                </div>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="w-full h-11 pl-[4.5rem] pr-4 rounded-xl border border-white/10 bg-black/20 text-white text-sm disabled:opacity-75 disabled:cursor-not-allowed placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                  required
                />
              </div>
            </div>

            {/* Primary Address */}
            <div>
              <label className="block text-xs text-white/50 mb-1.5 font-medium">Primary Address</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-3 text-white/30" />
                <textarea
                  placeholder="Enter delivery address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                  className="w-full min-h-[90px] pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-black/20 text-white text-sm disabled:opacity-75 disabled:cursor-not-allowed placeholder:text-white/30 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all resize-none"
                  required
                />
              </div>
            </div>

            {/* Action buttons (only in edit mode) */}
            {isEditing && (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 active:scale-98"
                >
                  <X size={15} />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-55 active:scale-98 shadow-md shadow-emerald-500/20"
                >
                  {loading ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={15} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
