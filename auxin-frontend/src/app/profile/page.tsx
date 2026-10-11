"use client";
/**
 * app/profile/page.tsx — Auxin v3.0
 * GOAT-Level Customer Marketplace Profile & Identity Experience:
 *  - Verified Marketplace Citizen Card with Avatar & Verification Badges
 *  - Form Editing for Personal Details & Phone
 *  - Saved Delivery Addresses Manager modal linkage
 *  - Account Preferences, Support & Safe Sign-Out
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User, Phone, MapPin, Mail, Loader2, Edit2, Save, X,
  Headphones, Clock, HelpCircle, FileText, Info, LogOut, ChevronRight, ShieldCheck, ShoppingBag
} from "lucide-react";
import toast from "react-hot-toast";
import { profileApi } from "@/lib/profile";
import { useAuthStore } from "@/store/authStore";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { signOut } from "@/lib/auth";
import type { Address } from "@/types";
import { AddressManagerSheet } from "@/components/features/AddressManagerSheet";
import { ProfileSkeleton } from "@/components/ui/Skeletons";

export default function ProfilePage() {
  const router = useRouter();
  const { setAuth, user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      clearAuth();
      toast.success("Signed out successfully");
      router.replace("/auth");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form fields
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [showAddressManage, setShowAddressManage] = useState(false);
  const [sheetTab, setSheetTab] = useState<"list" | "add" | "edit">("list");

  function formatAddress(addr: Address) {
    return [
      addr.house_flat, addr.building, addr.street,
      addr.area, addr.landmark, addr.city, addr.state, addr.pin_code,
    ].filter(Boolean).join(", ");
  }

  const refreshDefaultAddress = async () => {
    try {
      const res = await profileApi.listAddresses();
      const list = res.data || [];
      const def = list.find((a) => a.is_default) || list[0] || null;
      setDefaultAddress(def);
      if (def) {
        setAddress(formatAddress(def));
      } else {
        setAddress("");
      }
    } catch (err) {
      console.error("Failed to load default address:", err);
    }
  };

  // Fetch latest profile from backend on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await profileApi.getProfile();
        const profile = res.data;
        setEmail(profile.email ?? "");
        setName(profile.name);
        
        const cleanPhone = (profile.phone ?? "").replace("+91", "").trim();
        setPhone(cleanPhone);
        setAuth(profile);
        await refreshDefaultAddress();
      } catch (err: any) {
        console.error("Failed to load profile:", err);
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

    const digits = phone.trim().replace(/\s+/g, "").replace("+91", "");
    if (!/^\d{10}$/.test(digits)) {
      toast.error("Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    try {
      const res = await profileApi.updateProfile({
        name: name.trim(),
        phone: digits,
      });

      toast.success("Profile updated successfully!");
      setAuth(res.data);
      setIsEditing(false);
    } catch (err: any) {
      const detail = err.response?.data?.error ?? "Failed to update profile.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
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
      <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
        <TopBar title="My Profile" />
        <div className="page-content py-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      <TopBar title="My Profile" />

      <div className="page-content py-4 sm:py-6 space-y-6 max-w-2xl">
        {/* Profile Avatar Card */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-warm)] shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary-subtle)] border-2 border-[var(--primary-glow)] flex items-center justify-center font-black text-2xl text-[var(--primary-deep)] shadow-xs">
            {user?.name?.charAt(0).toUpperCase() || "A"}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                {user?.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[var(--primary-subtle)] text-[var(--primary-deep)] border border-[var(--primary-glow)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--primary)]" /> Verified Citizen
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              {email || user?.phone} • 25 KM Farm Fresh Consumer
            </p>
          </div>
        </div>

        {/* Account Details Editor */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Personal Information
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Your contact details for order deliveries</p>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-[var(--primary)] flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            {/* Full Name */}
            <div>
              <label className="text-overline block mb-1">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-75"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-overline block mb-1">Phone Number *</label>
              <div className="relative flex">
                <span className="inline-flex items-center px-3.5 rounded-l-xl bg-[var(--surface-3)] border border-r-0 border-[var(--border)] text-xs font-bold text-[var(--text-secondary)]">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  maxLength={10}
                  disabled={!isEditing}
                  className="w-full h-11 px-4 rounded-r-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-75"
                  required
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div>
              <label className="text-overline block mb-1">Email Address (Login ID)</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-3)] border border-[var(--border)] text-[var(--text-tertiary)] cursor-not-allowed"
              />
            </div>

            {isEditing && (
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={loading}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Delivery Addresses Management Card */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3.5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Saved Delivery Addresses
              </h3>
            </div>

            <button
              onClick={() => {
                setSheetTab("list");
                setShowAddressManage(true);
              }}
              className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
            >
              Manage
            </button>
          </div>

          {defaultAddress ? (
            <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] text-xs space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-[var(--text-primary)]">{defaultAddress.address_type}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary-subtle)] text-[var(--primary-deep)] uppercase">Default</span>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">{formatAddress(defaultAddress)}</p>
            </div>
          ) : (
            <p className="text-xs text-[var(--text-secondary)]">No address saved. Add one to checkout faster.</p>
          )}

          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => {
              setSheetTab("add");
              setShowAddressManage(true);
            }}
          >
            + Add New Address
          </Button>
        </div>

        {/* Navigation & Logout */}
        <div className="p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-2">
          <button
            onClick={() => router.push("/customer/orders")}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[var(--surface-2)] transition-colors text-xs font-bold text-[var(--text-primary)]"
          >
            <span className="flex items-center gap-2.5">
              <ShoppingBag className="w-4 h-4 text-[var(--primary)]" /> My Past Orders
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50/50 transition-colors text-xs font-bold text-[var(--danger)]"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-[var(--danger)]" /> Sign Out of Auxin
            </span>
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      {/* Address Manager Sheet */}
      {showAddressManage && (
        <AddressManagerSheet
          isOpen={showAddressManage}
          onClose={() => {
            setShowAddressManage(false);
            refreshDefaultAddress();
          }}
          selectedAddressId={defaultAddress?.id}
          onSelect={(addr) => {
            setDefaultAddress(addr);
            setAddress(formatAddress(addr));
            setShowAddressManage(false);
          }}
          initialTab={sheetTab}
        />
      )}
    </div>
  );
}
