"use client";
/**
 * app/delivery/profile/page.tsx — Auxin v3.0
 * GOAT-Level Delivery Partner Profile & Duty Identity:
 *  - Operations Duty Status Badge & Vehicle Information
 *  - Driving License & Vehicle Registration Management
 *  - Escrow Direct Deposit Bank Account Settings
 *  - Quick Sign-Out & Availability Toggle
 */

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  User, Phone, MapPin, Mail, Loader2, Edit2, Save, X,
  Headphones, Clock, HelpCircle, Info, FileText, LogOut,
  Landmark, Wallet, Calendar, ShieldCheck, Truck, Power, CheckCircle
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { deliveryApi } from "@/lib/delivery";
import { profileApi } from "@/lib/profile";
import { signOut } from "@/lib/auth";
import { ProfileSkeleton } from "@/components/ui/Skeletons";
import toast from "react-hot-toast";

export default function DeliveryProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, setAuth, clearAuth } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [personalName, setPersonalName] = useState("");
  const [phone, setPhone] = useState("");

  // Vehicle Info Fields
  const [vehicleType, setVehicleType] = useState("Bike");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [drivingLicense, setDrivingLicense] = useState("");

  // Bank Account Fields
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // Fetch delivery profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ["delivery-profile-detail"],
    queryFn: () => deliveryApi.getProfile().then((r) => r.data),
  });

  // Toggle online/offline availability
  const toggleMutation = useMutation({
    mutationFn: (nextAvailable: boolean) => deliveryApi.toggleAvailability(nextAvailable),
    onSuccess: (res) => {
      qc.setQueryData(["delivery-profile-detail"], res.data);
      toast.success(res.data.is_available ? "You are now ONLINE 🟢" : "You are now OFFLINE 🔴");
    },
    onError: () => toast.error("Failed to update availability."),
  });

  // Sync state with profile data
  useEffect(() => {
    if (user) {
      setPersonalName(user.name);
      setPhone(user.phone.replace("+91", ""));
    }
    if (profile) {
      setVehicleType(profile.vehicle_type || "Bike");
      setVehicleNumber(profile.vehicle_number || "");
      setDrivingLicense(profile.driving_license || "");

      setBankName(profile.bank_name || "");
      setAccountHolderName(profile.account_holder_name || "");
      setBankAccountNumber(profile.bank_account_number || "");
      setConfirmAccountNumber(profile.bank_account_number || "");
      setIfscCode(profile.ifsc_code || "");
      setUpiId(profile.upi_id || "");
    }
  }, [profile, user]);

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

  const handleCancel = () => {
    if (user) {
      setPersonalName(user.name);
      setPhone(user.phone.replace("+91", ""));
    }
    if (profile) {
      setVehicleType(profile.vehicle_type || "Bike");
      setVehicleNumber(profile.vehicle_number || "");
      setDrivingLicense(profile.driving_license || "");

      setBankName(profile.bank_name || "");
      setAccountHolderName(profile.account_holder_name || "");
      setBankAccountNumber(profile.bank_account_number || "");
      setConfirmAccountNumber(profile.bank_account_number || "");
      setIfscCode(profile.ifsc_code || "");
      setUpiId(profile.upi_id || "");
    }
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!personalName.trim()) { toast.error("Owner name is required."); return; }
    if (!vehicleNumber.trim()) { toast.error("Vehicle plate number is required."); return; }
    if (!drivingLicense.trim()) { toast.error("Driving License number is required."); return; }

    const bankFilled = !!bankName.trim() || !!accountHolderName.trim() || !!bankAccountNumber.trim() || !!ifscCode.trim();
    if (bankFilled) {
      if (!bankName.trim() || !accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
        toast.error("Please fill all bank details together.");
        return;
      }
      if (bankAccountNumber !== confirmAccountNumber) {
        toast.error("Bank account numbers do not match.");
        return;
      }
      if (bankAccountNumber.length < 9 || bankAccountNumber.length > 18) {
        toast.error("Bank account number must be between 9 and 18 digits.");
        return;
      }
      const ifsc = ifscCode.trim().toUpperCase();
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifsc)) {
        toast.error("Enter a valid 11-digit IFSC code.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1. Update User Profile Name & Phone
      await profileApi.updateProfile({
        name: personalName.trim(),
        phone: "+91" + phone.trim(),
      });
      if (user) {
        setAuth({
          ...user,
          name: personalName.trim(),
          phone: "+91" + phone.trim(),
        }, useAuthStore.getState().token || "");
      }

      // 2. Update Delivery Partner Profile Details
      await deliveryApi.updateProfile({
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        driving_license: drivingLicense.trim().toUpperCase(),
        bank_name: bankName.trim() || undefined,
        account_holder_name: accountHolderName.trim() || undefined,
        bank_account_number: bankAccountNumber.trim() || undefined,
        ifsc_code: ifscCode.trim().toUpperCase() || undefined,
        upi_id: upiId.trim() || undefined,
      });

      toast.success("Courier profile updated successfully!");
      qc.invalidateQueries({ queryKey: ["delivery-profile-detail"] });
      setIsEditing(false);
    } catch (err: any) {
      const detail = err.response?.data?.error ?? err.response?.data?.detail ?? "Failed to update partner profile.";
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24" style={{ background: "var(--bg)" }}>
        <TopBar title="Delivery Partner Profile" />
        <div className="page-content py-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  const isAvailable = profile?.is_available ?? false;

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      <TopBar title="Courier Partner Profile" />

      <div className="page-content py-4 sm:py-6 space-y-6 max-w-2xl">
        {/* Partner Identity Card */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface)] to-[var(--surface-warm)] shadow-xs flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-[var(--primary-subtle)] border-2 border-[var(--primary-glow)] flex items-center justify-center font-black text-2xl text-[var(--primary-deep)] shadow-xs">
            🛵
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                {personalName || "Auxin Courier"}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[var(--primary-subtle)] text-[var(--primary-deep)] border border-[var(--primary-glow)] flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--primary)]" /> 25 KM Fleet
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              {vehicleType} ({vehicleNumber || "Plate pending"}) • 4.95 ★ Rated
            </p>
          </div>

          {/* Quick Duty Toggle Button */}
          <button
            onClick={() => toggleMutation.mutate(!isAvailable)}
            disabled={toggleMutation.isPending}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
              isAvailable
                ? "bg-[var(--primary)] text-white"
                : "bg-gray-100 text-gray-700 border border-gray-200"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isAvailable ? "Duty: ONLINE" : "Duty: OFFLINE"}</span>
          </button>
        </div>

        {/* Partner Profile Form */}
        <div className="p-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Vehicle & Identity Information
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Required credentials for active fulfillment runs</p>
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
              <label className="text-overline block mb-1">Full Legal Name *</label>
              <input
                type="text"
                value={personalName}
                onChange={(e) => setPersonalName(e.target.value)}
                disabled={!isEditing}
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-75"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="text-overline block mb-1">Contact Phone *</label>
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

            {/* Vehicle Type */}
            <div>
              <label className="text-overline block mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                disabled={!isEditing}
                className="w-full h-11 px-3 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] disabled:opacity-75"
              >
                <option value="Bike">Motorcycle / Scooter</option>
                <option value="EV Scooter">Electric Scooter (EV)</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Van">Small Delivery Van</option>
              </select>
            </div>

            {/* Vehicle Registration Number */}
            <div>
              <label className="text-overline block mb-1">Vehicle Registration Plate *</label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                disabled={!isEditing}
                placeholder="e.g. KA-01-AB-1234"
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] uppercase disabled:opacity-75"
                required
              />
            </div>

            {/* Driving License */}
            <div>
              <label className="text-overline block mb-1">Driving License Number *</label>
              <input
                type="text"
                value={drivingLicense}
                onChange={(e) => setDrivingLicense(e.target.value.toUpperCase())}
                disabled={!isEditing}
                placeholder="e.g. DL-0420110012345"
                className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] uppercase disabled:opacity-75"
                required
              />
            </div>

            {/* Payout Bank Details */}
            <div className="pt-4 border-t border-[var(--divider)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-[var(--primary)]" /> Fixed Payout Bank Account (₹40 per run)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-overline block mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. HDFC Bank"
                    className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-75"
                  />
                </div>

                <div>
                  <label className="text-overline block mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    disabled={!isEditing}
                    placeholder="e.g. HDFC0001234"
                    className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] uppercase disabled:opacity-75"
                  />
                </div>
              </div>

              <div>
                <label className="text-overline block mb-1">Bank Account Number</label>
                <input
                  type="password"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  disabled={!isEditing}
                  placeholder="••••••••••••"
                  className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-75"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-2.5 pt-3">
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
                  Save Courier Profile
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Logout */}
        <div className="p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50/50 transition-colors text-xs font-bold text-[var(--danger)]"
          >
            <span className="flex items-center gap-2.5">
              <LogOut className="w-4 h-4 text-[var(--danger)]" /> Sign Out of Courier Portal
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
