"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Address } from "@/types";

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

const ADDRESS_TYPES = ["Home", "Work", "Other"];

interface AddressFormProps {
  initialAddress?: Partial<Address> | null;
  onSubmit: (addressData: any) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  loading?: boolean;
}

export function AddressForm({
  initialAddress,
  onSubmit,
  onCancel,
  submitLabel = "Save Address",
  loading = false,
}: AddressFormProps) {
  const [houseFlat, setHouseFlat] = useState(initialAddress?.house_flat || "");
  const [building, setBuilding] = useState(initialAddress?.building || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [area, setArea] = useState(initialAddress?.area || "");
  const [landmark, setLandmark] = useState(initialAddress?.landmark || "");
  const [city, setCity] = useState(initialAddress?.city || "");
  const [state, setState] = useState(initialAddress?.state || "");
  const [pinCode, setPinCode] = useState(initialAddress?.pin_code || "");
  const [addressType, setAddressType] = useState(initialAddress?.address_type || "Home");
  const [latitude, setLatitude] = useState<number | null>(initialAddress?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(initialAddress?.longitude ?? null);

  const [gpsStatus, setGpsStatus] = useState<"idle" | "detecting" | "fetching" | "success" | "error">("idle");

  // Sync state if initialAddress changes
  useEffect(() => {
    if (initialAddress) {
      setHouseFlat(initialAddress.house_flat || "");
      setBuilding(initialAddress.building || "");
      setStreet(initialAddress.street || "");
      setArea(initialAddress.area || "");
      setLandmark(initialAddress.landmark || "");
      setCity(initialAddress.city || "");
      setState(initialAddress.state || "");
      setPinCode(initialAddress.pin_code || "");
      setAddressType(initialAddress.address_type || "Home");
      setLatitude(initialAddress.latitude ?? null);
      setLongitude(initialAddress.longitude ?? null);
    }
  }, [initialAddress]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLatitude(null);
    setLongitude(null);
    setGpsStatus("detecting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        try {
          setGpsStatus("fetching");
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&_=${Date.now()}`,
            { headers: { "Accept-Language": "en" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            if (addr) {
              const detectedArea = addr.suburb || addr.neighbourhood || addr.locality || addr.city_district || addr.subdistrict || addr.residential || addr.commercial || "";
              const detectedStreet = addr.road || "";
              const detectedCity = addr.city || addr.town || addr.village || addr.municipality || addr.county || "";
              const detectedState = addr.state || "";
              const detectedPostcode = addr.postcode ? addr.postcode.replace(/\s+/g, "").slice(0, 6) : "";

              if (!area) setArea(detectedArea);
              if (!street) setStreet(detectedStreet);
              if (!city) setCity(detectedCity);
              if (!state) {
                const matchedState = STATES.find(
                  (s) => s.toLowerCase() === detectedState.toLowerCase()
                );
                if (matchedState) setState(matchedState);
              }
              if (!pinCode) setPinCode(detectedPostcode);

              setGpsStatus("success");
              toast.success("Address located!");
              setTimeout(() => setGpsStatus("idle"), 3000);
            }
          } else {
            throw new Error("Geocoding failed");
          }
        } catch (err) {
          console.error(err);
          setGpsStatus("error");
          toast.error("Manual entry required.");
          setTimeout(() => setGpsStatus("idle"), 3000);
        }
      },
      (err) => {
        console.error(err);
        setGpsStatus("error");
        toast.error("Manual entry required.");
        setTimeout(() => setGpsStatus("idle"), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!houseFlat.trim()) { toast.error("House/Flat number is required."); return; }
    if (!area.trim()) { toast.error("Area/Locality is required."); return; }
    if (!city.trim()) { toast.error("City is required."); return; }
    if (!state) { toast.error("State is required."); return; }
    if (!/^\d{6}$/.test(pinCode.trim())) { toast.error("PIN Code must be exactly 6 digits."); return; }

    onSubmit({
      house_flat: houseFlat.trim(),
      building: building.trim(),
      street: street.trim(),
      area: area.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      state,
      pin_code: pinCode.trim(),
      address_type: addressType,
      latitude,
      longitude,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* GPS Autofill */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>GPS Localization</h4>
        </div>
        <button
          type="button"
          onClick={handleGetCurrentLocation}
          disabled={gpsStatus === "detecting" || gpsStatus === "fetching"}
          className="h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 disabled:opacity-50"
          style={{
            background: "var(--primary-subtle)",
            borderColor: "var(--primary-ring)",
            color: "var(--primary)",
          }}
        >
          {(gpsStatus === "detecting" || gpsStatus === "fetching") ? (
            <Loader2 size={13} className="animate-spin" />
          ) : null}
          {gpsStatus === "detecting" && "Detecting..."}
          {gpsStatus === "fetching" && "Locating..."}
          {gpsStatus === "success" && "Located ✓"}
          {gpsStatus === "error" && "📍 Autofill Location"}
          {gpsStatus === "idle" && "📍 Autofill Location"}
        </button>
      </div>

      {latitude && longitude && (
        <div className="p-3.5 rounded-2xl border text-xs space-y-1" style={{ background: "#F3F4F6", borderColor: "var(--border)" }}>
          <p className="font-bold flex items-center gap-1" style={{ color: "var(--primary)" }}>📍 Detected Coordinates</p>
          <p style={{ color: "var(--text-secondary)" }}>{area || "Detected Locality"}, {city || "Detected City"}</p>
        </div>
      )}

      {/* House/Flat & Building */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>House / Flat Number *</label>
          <input
            type="text"
            required
            placeholder="e.g. Flat 402, Block A"
            value={houseFlat}
            onChange={(e) => setHouseFlat(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Apartment / Building</label>
          <input
            type="text"
            placeholder="e.g. Green Meadows"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Street Address</label>
        <input
          type="text"
          placeholder="e.g. 5th Main Road"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Area / Locality */}
      <div>
        <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Area / Locality *</label>
        <input
          type="text"
          required
          placeholder="e.g. Indiranagar"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Landmark & City */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Landmark</label>
          <input
            type="text"
            placeholder="e.g. Near Park"
            value={landmark}
            onChange={(e) => setLandmark(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>City *</label>
          <input
            type="text"
            required
            placeholder="e.g. Bengaluru"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      </div>

      {/* State, PIN Code, & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>State *</label>
          <select
            required
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border text-sm focus:outline-none transition-all bg-[var(--surface)] text-[var(--text-primary)]"
            style={{
              borderColor: "var(--border)",
            }}
          >
            <option value="" disabled>Select State</option>
            {STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>PIN Code *</label>
          <input
            type="text"
            required
            placeholder="e.g. 560001"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full h-11 px-4 rounded-xl border text-sm focus:outline-none transition-all"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-secondary)" }}>Address Type *</label>
          <div className="flex gap-1">
            {ADDRESS_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAddressType(t)}
                className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95`}
                style={{
                  background: addressType === t ? "var(--primary-subtle)" : "var(--surface)",
                  borderColor: addressType === t ? "var(--primary)" : "var(--border)",
                  color: addressType === t ? "var(--primary)" : "var(--text-secondary)",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-11 rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-95"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center gap-1.5"
          style={{
            background: "var(--primary)",
            boxShadow: "0 4px 12px var(--primary-glow)",
          }}
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
