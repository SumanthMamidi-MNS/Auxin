"use client";
/**
 * app/customer/cart/page.tsx — Auxin v3.0
 * GOAT-Level Cart & Escrow Checkout Experience:
 *  - 2-Column Responsive Split on Desktop (7 cols items / 5 cols sticky summary)
 *  - QuantityStepper integration with smooth micro-motion
 *  - Address selector with mini-preview
 *  - Razorpay Escrow Trust Signal Badge
 *  - EmptyCart illustration
 *  - Prominent 52px high-contrast checkout action
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2, ShoppingBag, ArrowRight,
  CreditCard, Shield, ChevronLeft, MapPin, Loader2, X, Leaf, Sparkles
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { TrustBadge } from "@/components/ui/TrustBadge";
import { EmptyCartIllustration } from "@/components/illustrations/EmptyCart";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/orders";
import { paymentsApi, openRazorpayCheckout } from "@/lib/payments";
import { profileApi } from "@/lib/profile";
import { getErrorMessage } from "@/lib/api";
import type { Address } from "@/types";
import toast from "react-hot-toast";
import { getProductImage } from "@/components/features/ProductCard";
import { AddressManagerSheet } from "@/components/features/AddressManagerSheet";
import { CartSkeleton } from "@/components/ui/Skeletons";
import { clsx } from "clsx";

type CheckoutStep = "idle" | "placing" | "paying" | "verifying";

function formatAddress(addr: Address) {
  return [
    addr.house_flat, addr.building, addr.street,
    addr.area, addr.landmark, addr.city, addr.state, addr.pin_code,
  ].filter(Boolean).join(", ");
}

export default function CartPage() {
  const router  = useRouter();
  const { items, updateQty, removeItem, cartTotal, clearCart, itemCount } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  const [address, setAddress]               = useState<Address | null>(null);
  const [addresses, setAddresses]           = useState<Address[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const [sheetTab, setSheetTab]             = useState<"list" | "add">("list");

  const refreshAddresses = async (silent = false) => {
    if (!silent) setLoadingAddress(true);
    try {
      const addrRes = await profileApi.listAddresses();
      const addrs = addrRes.data || [];
      setAddresses(addrs);
      if (addrs.length === 0) {
        toast.error("Please add a delivery address to complete your checkout.");
        router.replace("/profile/create");
        return;
      }
      if (address) {
        const stillExists = addrs.find((a) => a.id === address.id);
        if (stillExists) {
          setAddress(stillExists);
        } else {
          const def = addrs.find((a) => a.is_default) || addrs[0];
          setAddress(def);
        }
      } else {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        setAddress(def);
      }
    } catch (err) {
      console.error("Failed to load address details:", err);
    } finally {
      if (!silent) setLoadingAddress(false);
    }
  };

  useEffect(() => {
    profileApi.getProfile()
      .then(() => refreshAddresses())
      .catch((e) => {
        if (e.response?.status === 404) {
          toast.error("Please set up your profile first.");
          router.replace("/profile/create");
        }
      });
  }, [router]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!address) { toast.error("Please select a delivery address."); return; }
    setStep("placing");

    let orderId: number;
    try {
      const payload = items.map((i) => ({
        product_id: i.inventory_id ? undefined : i.product.id,
        inventory_id: i.inventory_id || undefined,
        quantity: i.quantity
      }));
      const { data: order } = await ordersApi.create(payload, paymentMethod);
      orderId = order.id;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStep("idle");
      return;
    }

    setStep("paying");
    try {
      const paymentData = await paymentsApi.createPayment(orderId);
      if (paymentData.status === "paid") {
        setStep("verifying");
        clearCart();
        toast.success("Demo checkout successful! Order placed 🎉");
        router.push("/customer/orders");
        return;
      }
      openRazorpayCheckout(
        paymentData,
        { name: user?.name, phone: user?.phone },
        {
          onSuccess: async () => {
            setStep("verifying");
            clearCart();
            toast.success("Payment successful! Order placed 🎉");
            router.push("/customer/orders");
          },
          onFailure: (errMsg) => {
            toast.error(`Payment failed: ${errMsg}. Please try again.`);
            setStep("idle");
          },
          onDismiss: () => {
            toast("Payment cancelled. You can try again.", { icon: "ℹ️" });
            setStep("idle");
          },
        },
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStep("idle");
    }
  };

  const isLoading = step !== "idle";

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      <TopBar title="My Cart" showBack />

      <div className="page-content py-4 sm:py-6">
        {loadingAddress ? (
          <div className="py-6">
            <CartSkeleton />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              illustration={<EmptyCartIllustration className="w-24 h-24" />}
              title="Your Harvest Cart is Empty"
              description="Explore farm-fresh organic vegetables, fruits, and grains harvested this morning."
              action={
                <Button onClick={() => router.push("/customer/home")} icon={<ChevronLeft className="w-4 h-4" />}>
                  Browse Fresh Produce
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* ── Left Column: Cart Items (7 cols on desktop) ───────────── */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--divider)]">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                    Cart Items ({itemCount})
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">Direct from regional farmers</p>
                </div>
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-[var(--danger)] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              </div>

              {/* Items List */}
              <div className="space-y-3.5">
                {items.map((item) => {
                  const { product, quantity, inventory_id } = item;
                  const itemId = inventory_id || product.id;
                  const isInv = !!inventory_id;
                  const itemKey = inventory_id ? `inv-${inventory_id}` : `prod-${product.id}`;

                  return (
                    <div
                      key={itemKey}
                      className="flex gap-4 p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs animate-fade-in items-center"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden flex-shrink-0 bg-[var(--surface-2)]">
                        <Image
                          src={getProductImage(product.name, product.image_url)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info & Quantity Controls */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] truncate" style={{ fontFamily: "var(--font-heading)" }}>
                              {product.name}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                              ₹{product.price}/{product.unit} {inventory_id ? "· Fresh Harvest" : ""}
                            </p>
                          </div>

                          <button
                            onClick={() => removeItem(itemId, isInv)}
                            aria-label="Remove item"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-[var(--divider)]">
                          <QuantityStepper
                            quantity={quantity}
                            onIncrement={() => updateQty(itemId, quantity + 1, isInv)}
                            onDecrement={() => updateQty(itemId, quantity - 1, isInv)}
                            size="sm"
                          />

                          <span className="font-black text-sm sm:text-base text-[var(--text-primary)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                            ₹{(product.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Badge Card */}
              <div className="pt-2">
                <TrustBadge type="escrow" variant="card" />
              </div>
            </div>

            {/* ── Right Column: Summary & Checkout (5 cols on desktop) ─── */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
              {/* Delivery Address Card */}
              <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[var(--primary-subtle)] text-[var(--primary)] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                      Delivery Address
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetTab("list");
                      setShowAddressSelect(true);
                    }}
                    className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {address ? (
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{user?.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--primary-subtle)] text-[var(--primary-deep)] uppercase tracking-wider">
                        {address.address_type}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {formatAddress(address)}
                    </p>
                    <p className="text-[var(--text-tertiary)]">{user?.phone}</p>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-tertiary)]">No address selected</p>
                )}
              </div>

              {/* Bill Details Summary Card */}
              <div className="p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3.5">
                <h3 className="font-bold text-sm text-[var(--text-primary)] pb-3 border-b border-[var(--divider)]" style={{ fontFamily: "var(--font-heading)" }}>
                  Bill Details
                </h3>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Item Total ({itemCount} {itemCount === 1 ? "item" : "items"})</span>
                    <span className="font-semibold text-[var(--text-primary)] tabular-nums">₹{cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Delivery Fee (25 KM Direct)</span>
                    <span className="font-bold text-[var(--primary)] uppercase tracking-wider text-xs">FREE</span>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <span>Escrow Protection Fee</span>
                    <span className="font-bold text-[var(--primary)] uppercase tracking-wider text-xs">FREE</span>
                  </div>

                  <div className="pt-3 border-t border-[var(--divider)] flex justify-between items-baseline font-black">
                    <span className="text-sm text-[var(--text-primary)]">To Pay</span>
                    <span className="text-xl sm:text-2xl text-[var(--primary-deep)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                      ₹{cartTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Primary Checkout Button */}
                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="xl"
                    fullWidth
                    loading={isLoading}
                    onClick={handleCheckout}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? "Processing Payment…" : `Proceed to Payment · ₹${cartTotal.toFixed(2)}`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Address Selection Modal Sheet */}
      {showAddressSelect && (
        <AddressManagerSheet
          isOpen={showAddressSelect}
          onClose={() => setShowAddressSelect(false)}
          selectedAddressId={address?.id}
          onSelect={(addr) => {
            setAddress(addr);
            setShowAddressSelect(false);
          }}
          initialTab={sheetTab}
        />
      )}
    </div>
  );
}
