"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Mail, Loader2 } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import { profileApi } from "@/lib/profile";
import { useAuthStore } from "@/store/authStore";
import { AddressForm } from "@/components/features/AddressForm";
import type { Address } from "@/types";

export default function CreateProfilePage() {
  const router = useRouter();
  const { setAuth, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmail, setFetchingEmail] = useState(true);
  const [role, setRole] = useState("customer");
  const [farmName, setFarmName] = useState("");
  const [farmCategory, setFarmCategory] = useState("Vegetables & Fruits");

  useEffect(() => {
    async function loadEmail() {
      try {
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        if (sbUser?.email) {
          setEmail(sbUser.email);
          const userRole = sbUser?.user_metadata?.role ?? "customer";
          setRole(userRole);
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

  useEffect(() => {
    async function fetchExistingProfile() {
      try {
        const res = await profileApi.getProfile();
        const prof = res.data;
        if (prof.name) setName(prof.name);
        if (prof.phone) setPhone(prof.phone.replace("+91", "").trim());
      } catch (err) {
        // Keep fields empty so the user enters every part manually from scratch
      }
    }
    fetchExistingProfile();
  }, [user]);

  function getRoleRoute(role: string): string {
    switch (role) {
      case "customer": return "/customer/home";
      case "farmer":   return "/farmer/dashboard";
      case "delivery": return "/delivery/dashboard";
      default:         return "/auth";
    }
  }

  const handleAddressSubmit = async (addressData: any) => {
    if (!name.trim()) {
      toast.error("Full Name is required.");
      return;
    }

    const digits = phone.trim().replace(/\s+/g, "").replace("+91", "");
    if (!/^\d{10}$/.test(digits)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    // Goat-level sequence/fake validation
    const uniqueDigits = new Set(digits).size;
    const isAscending = "01234567890123456789".includes(digits);
    const isDescending = "98765432109876543210".includes(digits);
    const isRepeatingPair = digits === (digits.slice(0, 2).repeat(5));
    const isRepeatingTriplet = digits === (digits.slice(0, 3).repeat(4).slice(0, 10));

    if (uniqueDigits < 3 || isAscending || isDescending || isRepeatingPair || isRepeatingTriplet) {
      toast.error("Invalid phone number sequence. Please enter a real phone number.");
      return;
    }

    if (role === "farmer" && !farmName.trim()) {
      toast.error("Farm Name is required.");
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

      // 4. Now call createProfile to save structured address and complete profile setup
      const res = await profileApi.createProfile({
        name: name.trim(),
        phone: digits,
        house_flat: addressData.house_flat,
        building: addressData.building || undefined,
        street: addressData.street || addressData.area, 
        area: addressData.area,
        landmark: addressData.landmark || undefined,
        city: addressData.city,
        state: addressData.state,
        pin_code: addressData.pin_code,
        address_type: addressData.address_type,
        latitude: addressData.latitude,
        longitude: addressData.longitude,
        farm_name: role === "farmer" ? farmName.trim() : undefined,
        farm_category: role === "farmer" ? farmCategory : undefined,
      });

      toast.success("Profile created successfully!");
      setAuth(res.data);

      router.replace(getRoleRoute(res.data.role));
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.error ?? "Failed to create profile.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center animate-fade-in" style={{ background: "var(--bg)" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16 flex items-center justify-center p-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center relative mx-auto"
            style={{
              border: "3px solid var(--gold)",
              boxShadow: "0 4px 16px var(--gold-glow)",
            }}
          >
            <Image
              src="/logo-cropped.png"
              alt="Auxin Logo"
              fill
              className="object-cover scale-110"
              priority
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Complete Profile
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
              Please set up your profile details and delivery address
            </p>
          </div>
        </div>

        {/* Account Details form card */}
        <div
          className="rounded-3xl p-6 shadow-sm space-y-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email (read only) */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Email Address (Locked)</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm cursor-not-allowed"
                  style={{
                    background: "#F3F4F6",
                    border: "1px solid var(--border)",
                    color: "var(--text-tertiary)",
                  }}
                />
              </div>
            </div>
            {/* Full name */}
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-secondary)" }} />
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl text-sm focus:outline-none transition-all"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Phone number */}
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Phone Number *</label>
            <div className="relative flex">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Phone size={14} />
                <span className="text-sm font-semibold pr-2 border-r" style={{ borderColor: "var(--border-2)" }}>+91</span>
              </div>
              <input
                type="tel"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                maxLength={10}
                className="w-full h-11 pl-18 pr-4 rounded-xl text-sm focus:outline-none transition-all"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                required
              />
            </div>
          </div>

          {/* Farmer-specific Farm Information */}
          {role === "farmer" && (
            <div className="space-y-4 pt-4 border-t border-[var(--border)] animate-fade-in">
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                Farm Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Farm Name *</label>
                  <input
                    type="text"
                    placeholder="Enter farm name (e.g. Green Meadows)"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      borderWidth: "1px",
                      color: "var(--text-primary)",
                    }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Farm Category *</label>
                  <select
                    value={farmCategory}
                    onChange={(e) => setFarmCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl text-sm focus:outline-none transition-all"
                    style={{
                      background: "var(--surface)",
                      borderColor: "var(--border)",
                      borderWidth: "1px",
                      color: "var(--text-primary)",
                    }}
                  >
                    <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                    <option value="Organic Fruits">Organic Fruits</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Dairy & Poultry">Dairy & Poultry</option>
                    <option value="Exotic Herbs">Exotic Herbs</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Reusable Address Form */}
          <div className="pt-2 border-t border-[var(--border)]">
            <AddressForm
              onSubmit={handleAddressSubmit}
              submitLabel="Save and Continue"
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
