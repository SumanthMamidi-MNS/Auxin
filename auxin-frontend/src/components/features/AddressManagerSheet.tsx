"use client";

import { useEffect, useState } from "react";
import { X, Plus, Trash2, Edit, Check, MapPin, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi } from "@/lib/profile";
import { AddressForm } from "./AddressForm";
import type { Address } from "@/types";

interface AddressManagerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAddressId?: number | null;
  onSelect?: (address: Address) => void;
  onAddressesUpdated?: () => void;
  initialTab?: "list" | "add" | "edit";
}

export function AddressManagerSheet({
  isOpen,
  onClose,
  selectedAddressId,
  onSelect,
  onAddressesUpdated,
  initialTab = "list",
}: AddressManagerSheetProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "add" | "edit">(initialTab);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [localSelectedId, setLocalSelectedId] = useState<number | null>(selectedAddressId || null);

  // Fetch addresses
  const loadAddresses = async (selectNewDefault = false) => {
    setLoading(true);
    try {
      const res = await profileApi.listAddresses();
      const list = res.data || [];
      setAddresses(list);

      // Notify parent
      if (onAddressesUpdated) {
        onAddressesUpdated();
      }

      // If we want to set local selection automatically
      if (list.length > 0) {
        // If no selection yet, choose the default address or first address
        if (!localSelectedId) {
          const defaultAddr = list.find((a) => a.is_default) || list[0];
          setLocalSelectedId(defaultAddr.id);
        } else {
          // If the previously selected address was deleted, reset selection
          const exists = list.some((a) => a.id === localSelectedId);
          if (!exists) {
            const defaultAddr = list.find((a) => a.is_default) || list[0];
            setLocalSelectedId(defaultAddr.id);
          }
        }
      } else {
        setLocalSelectedId(null);
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
      toast.error("Failed to fetch saved addresses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setActiveTab(initialTab);
      setEditingAddress(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (selectedAddressId) {
      setLocalSelectedId(selectedAddressId);
    }
  }, [selectedAddressId]);

  const handleCreateAddress = async (payload: any) => {
    setLoading(true);
    try {
      const res = await profileApi.createAddress(payload);
      toast.success("New address added!");
      setActiveTab("list");
      // Load addresses and auto-select the newly created address
      const resList = await profileApi.listAddresses();
      const list = resList.data || [];
      setAddresses(list);
      if (onAddressesUpdated) onAddressesUpdated();
      
      const newAddr = list.find((a) => a.house_flat === payload.house_flat && a.area === payload.area) || res.data;
      if (newAddr) {
        setLocalSelectedId(newAddr.id);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to add address.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAddress = async (payload: any) => {
    if (!editingAddress) return;
    setLoading(true);
    try {
      await profileApi.updateAddress(editingAddress.id, payload);
      toast.success("Address updated successfully!");
      setActiveTab("list");
      setEditingAddress(null);
      loadAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update address.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this address?")) return;
    setLoading(true);
    try {
      await profileApi.deleteAddress(id);
      toast.success("Address deleted.");
      loadAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete address.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await profileApi.setDefaultAddress(id);
      toast.success("Default address updated!");
      loadAddresses();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update default address.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelection = () => {
    const selectedAddr = addresses.find((a) => a.id === localSelectedId);
    if (selectedAddr && onSelect) {
      onSelect(selectedAddr);
      onClose();
    } else {
      toast.error("Please select a delivery address.");
    }
  };

  const formatAddressString = (addr: Address) => {
    const parts = [
      addr.house_flat,
      addr.building,
      addr.street,
      addr.area,
      addr.landmark ? `(Landmark: ${addr.landmark})` : "",
      addr.city,
      addr.state,
      addr.pin_code,
    ];
    return parts.filter(Boolean).join(", ");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Sheet Container */}
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[85vh] overflow-y-auto p-6 space-y-4 animate-slide-up shadow-2xl"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h3
            className="text-lg font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
          >
            {activeTab === "list" && "Manage Addresses"}
            {activeTab === "add" && "Add New Address"}
            {activeTab === "edit" && "Edit Address"}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: "var(--surface-3)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {loading && addresses.length === 0 ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--primary)" }} />
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "list" && (
              <>
                {/* List of addresses */}
                {addresses.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <p style={{ color: "var(--text-secondary)" }} className="text-sm">No saved addresses found.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {addresses.map((addr) => {
                      const isSelected = localSelectedId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => setLocalSelectedId(addr.id)}
                          className="p-4 rounded-2xl cursor-pointer transition-all flex gap-3 items-start relative group"
                          style={{
                            background: isSelected ? "var(--primary-subtle)" : "var(--surface)",
                            border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                          }}
                        >
                          {/* Custom Radio Button */}
                          <div className="mt-1.5 flex-shrink-0">
                            <div
                              className="w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all"
                              style={{
                                borderColor: isSelected ? "var(--primary)" : "var(--border-2)",
                                background: isSelected ? "var(--primary)" : "transparent",
                              }}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                            </div>
                          </div>

                          {/* Address Details */}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg"
                                style={{
                                  background: "var(--surface-2)",
                                  color: "var(--text-secondary)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                {addr.address_type}
                              </span>
                              {addr.is_default && (
                                <span
                                  className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-1"
                                  style={{
                                    background: "var(--primary-subtle)",
                                    color: "var(--primary)",
                                    border: "1px solid var(--primary-ring)",
                                  }}
                                >
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-secondary)" }}>
                              {formatAddressString(addr)}
                            </p>

                            {/* Address Action Bar */}
                            <div className="flex items-center gap-4 pt-2 text-[11px] font-bold">
                              {!addr.is_default && (
                                <button
                                  onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                  className="hover:underline"
                                  style={{ color: "var(--primary)" }}
                                >
                                  Set as Default
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingAddress(addr);
                                  setActiveTab("edit");
                                }}
                                className="flex items-center gap-1 hover:underline"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                <Edit size={11} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => handleDeleteAddress(addr.id, e)}
                                className="flex items-center gap-1 hover:underline text-rose-500"
                              >
                                <Trash2 size={11} />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add New Address Trigger */}
                <button
                  onClick={() => setActiveTab("add")}
                  className="w-full h-11 rounded-xl border border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all duration-150 hover:bg-[var(--surface-2)]"
                  style={{
                    borderColor: "var(--border-2)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add New Address
                </button>

                {/* Confirm Selection CTA */}
                {onSelect && addresses.length > 0 && (
                  <button
                    onClick={handleConfirmSelection}
                    className="w-full h-12 rounded-xl text-white font-bold text-sm transition-all duration-150 active:scale-95 mt-4"
                    style={{
                      background: "var(--primary)",
                      boxShadow: "0 4px 12px var(--primary-glow)",
                    }}
                  >
                    Confirm Selection
                  </button>
                )}
              </>
            )}

            {activeTab === "add" && (
              <AddressForm
                onSubmit={handleCreateAddress}
                onCancel={() => setActiveTab("list")}
                submitLabel="Add Address"
                loading={loading}
              />
            )}

            {activeTab === "edit" && (
              <AddressForm
                initialAddress={editingAddress}
                onSubmit={handleUpdateAddress}
                onCancel={() => {
                  setActiveTab("list");
                  setEditingAddress(null);
                }}
                submitLabel="Update Address"
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
