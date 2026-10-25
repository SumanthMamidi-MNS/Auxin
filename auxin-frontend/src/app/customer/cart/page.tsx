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
import { ProductImage } from "@/components/features/ProductImage";
import { AddressManagerSheet } from "@/components/features/AddressManagerSheet";
import { CartSkeleton } from "@/components/ui/Skeletons";
import { clsx } from "clsx";

type CheckoutStep = "idle" | "placing" | "paying" | "verifying";

const DEFAULT_FALLBACK_ADDRESS: Address = {
  id: 101,
  user_id: 1,
  house_flat: "Villa 14",
  building: "Palm Grove Enclave",
  street: "Golf Course Extension Road",
  area: "Sector 65",
  landmark: "Opposite Central Park",
  city: "Gurugram",
  state: "Haryana",
  pin_code: "122018",
  address_type: "Home",
  latitude: 28.4015,
  longitude: 77.0678,
  is_default: true,
};

const DEMO_CART_ITEMS = [
  {
    product: {
      id: 1,
      name: "Ratnagiri Alphonso Mangoes",
      price: 180,
      unit: "kg",
      image_url: "/fruits/mango.png",
      farmer_name: "Auxin Green Harvest Orchards",
    },
    quantity: 2,
    inventory_id: 101,
  },
];

function formatAddress(addr: Address) {
  return [
    addr.house_flat, addr.building, addr.street,
    addr.area, addr.landmark, addr.city, addr.state, addr.pin_code,
  ].filter(Boolean).join(", ");
}

export default function CartPage() {
  const router  = useRouter();
  const { items, updateQty, removeItem, cartTotal, clearCart, itemCount } = useCartStore();
  const effectiveItems = items.length > 0 ? items : DEMO_CART_ITEMS;
  const effectiveItemCount = items.length > 0 ? itemCount : 2;
  const effectiveTotal = items.length > 0 ? cartTotal : 360;
  const { user } = useAuthStore();
  const [step, setStep] = useState<CheckoutStep>("idle");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");

  const [address, setAddress]               = useState<Address | null>(DEFAULT_FALLBACK_ADDRESS);
  const [addresses, setAddresses]           = useState<Address[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showAddressSelect, setShowAddressSelect] = useState(false);
  const [sheetTab, setSheetTab]             = useState<"list" | "add">("list");

  const refreshAddresses = async (silent = false) => {
    if (!silent) setLoadingAddress(true);
    try {
      const addrRes = await profileApi.listAddresses();
      const addrs = addrRes.data || [];
      setAddresses(addrs);
      if (addrs.length === 0) {
        setAddresses([DEFAULT_FALLBACK_ADDRESS]);
        setAddress(DEFAULT_FALLBACK_ADDRESS);
        setLoadingAddress(false);
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
    <div className="min-h-screen pb-44 sm:pb-32" style={{ background: "var(--bg)" }}>
      <TopBar title="My Cart" showBack />

      <div className="page-content py-4 sm:py-6">
        {loadingAddress ? (
          <div className="py-6">
            <CartSkeleton />
          </div>
        ) : effectiveItems.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
            {/* ── Left Column: Cart Items (7 cols on desktop) ───────────── */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                    {effectiveItemCount} items in cart
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">Direct from regional farmers</p>
                </div>
                <button
                  type="button"
                  onClick={clearCart}
                  className="h-8 px-2 -mr-2 rounded-lg text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* Items List */}
              <ul className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs divide-y divide-[var(--divider)]">
                {effectiveItems.map((item) => {
                  const { product, quantity, inventory_id } = item;
                  const itemId = inventory_id || product.id;
                  const isInv = !!inventory_id;
                  const itemKey = inventory_id ? `inv-${inventory_id}` : `prod-${product.id}`;

                  return (
                    <li key={itemKey} className="flex gap-3 p-3 sm:p-4 animate-fade-in">
                      {/* Product Thumbnail */}
                      <div className="relative w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <ProductImage name={product.name} imageUrl={product.image_url} sizes="80px" width={200} />
                      </div>

                      {/* Info & Quantity Controls */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-[15px] text-[var(--text-primary)] truncate leading-5" style={{ fontFamily: "var(--font-heading)" }}>
                              {product.name}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                              ₹{product.price} / {product.unit}{inventory_id ? " · Fresh harvest" : ""}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeItem(itemId, isInv)}
                            aria-label={`Remove ${product.name}`}
                            className="w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-2">
                          <QuantityStepper
                            quantity={quantity}
                            onIncrement={() => updateQty(itemId, quantity + 1, isInv)}
                            onDecrement={() => updateQty(itemId, quantity - 1, isInv)}
                            size="sm"
                          />

                          <span className="font-bold text-sm sm:text-base text-[var(--text-primary)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                            ₹{(product.price * quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Trust Badge Card */}
              <TrustBadge type="escrow" variant="card" />
            </div>

            {/* ── Right Column: Summary & Checkout (5 cols on desktop) ─── */}
            <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
              {/* Delivery Address Card */}
              <section className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-[var(--primary-muted)] text-[var(--primary-deep)] flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </span>
                    <h3 className="font-semibold text-sm text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                      Delivery address
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSheetTab("list");
                      setShowAddressSelect(true);
                    }}
                    className="h-8 px-3 rounded-lg text-xs font-semibold text-[var(--primary-deep)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                  >
                    Change
                  </button>
                </div>

                {address ? (
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[var(--text-primary)] truncate">{user?.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--surface-2)] text-[var(--text-secondary)] uppercase tracking-wider">
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
              </section>

              {/* Bill Details Summary Card */}
              <section className="p-4 sm:p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
                <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                  Bill details
                </h3>

                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <dt>Item total</dt>
                    <dd className="font-medium text-[var(--text-primary)] tabular-nums">₹{cartTotal.toFixed(2)}</dd>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <dt>Delivery (within 25 km)</dt>
                    <dd className="font-semibold text-[var(--primary-dim)]">Free</dd>
                  </div>

                  <div className="flex justify-between text-[var(--text-secondary)]">
                    <dt>Escrow protection</dt>
                    <dd className="font-semibold text-[var(--primary-dim)]">Free</dd>
                  </div>

                  <div className="pt-3 mt-1 border-t border-dashed border-[var(--border-2)] flex justify-between items-baseline">
                    <dt className="font-semibold text-[var(--text-primary)]">To pay</dt>
                    <dd className="text-xl font-bold text-[var(--text-primary)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                      ₹{cartTotal.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                {/* Primary Checkout Button (desktop / tablet; phones use the sticky bar) */}
                <div className="pt-4 hidden sm:block">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    onClick={handleCheckout}
                    iconRight={<ArrowRight className="w-4 h-4" />}
                  >
                    {isLoading ? "Processing payment…" : `Proceed to pay ₹${cartTotal.toFixed(2)}`}
                  </Button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Sticky checkout bar for phones (sits above the bottom navigation) */}
      {!loadingAddress && items.length > 0 && (
        <div className="sm:hidden fixed left-0 right-0 bottom-[64px] z-40 px-4 pt-3 pb-3 bg-[var(--surface-overlay)] backdrop-blur-xl border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--text-secondary)] leading-none">To pay</p>
              <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums leading-tight mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                ₹{cartTotal.toFixed(2)}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="flex-1"
              loading={isLoading}
              onClick={handleCheckout}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {isLoading ? "Processing…" : "Proceed to pay"}
            </Button>
          </div>
        </div>
      )}

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
