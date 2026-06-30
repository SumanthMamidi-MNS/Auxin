"use client";
/**
 * app/customer/cart/page.tsx — Auxin v2.0
 * Premium dark cart with Razorpay checkout flow.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Minus, Plus, Trash2, ShoppingCart, ArrowRight,
  CreditCard, Shield, ChevronLeft,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Card";
import { useCartStore } from "@/store/cartStore";
import { useAuthStore } from "@/store/authStore";
import { ordersApi } from "@/lib/orders";
import { paymentsApi, openRazorpayCheckout } from "@/lib/payments";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";

const FALLBACK = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=200&q=70";

type CheckoutStep = "idle" | "placing" | "paying" | "verifying";

export default function CartPage() {
  const router  = useRouter();
  const { items, updateQty, removeItem, cartTotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<CheckoutStep>("idle");

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setStep("placing");

    let orderId: number;
    try {
      const payload = items.map((i) => ({ product_id: i.product.id, quantity: i.quantity }));
      const { data: order } = await ordersApi.create(payload);
      orderId = order.id;
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStep("idle");
      return;
    }

    setStep("paying");
    try {
      const paymentData = await paymentsApi.createPayment(orderId);

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
            toast.error(`Payment failed: ${errMsg}. Your order is saved — retry from My Orders.`);
            clearCart();
            setStep("idle");
            router.push("/customer/orders");
          },
          onDismiss: () => {
            toast("Payment cancelled. You can pay later from My Orders.", { icon: "ℹ️" });
            clearCart();
            setStep("idle");
            router.push("/customer/orders");
          },
        },
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
      setStep("idle");
    }
  };

  const isLoading = step !== "idle";
  const stepLabel = {
    idle:      `Pay  ₹${cartTotal.toFixed(2)}`,
    placing:   "Creating order…",
    paying:    "Opening payment…",
    verifying: "Verifying payment…",
  }[step];

  return (
    <div className="min-h-screen" style={{ background: "#0A0A0B" }}>
      <TopBar title="My Cart" showBack />

      {items.length === 0 ? (
        <div className="px-4 py-8">
          <EmptyState
            icon={<ShoppingCart className="w-8 h-8" />}
            title="Your cart is empty"
            description="Add fresh produce from the home page"
            action={
              <Button onClick={() => router.push("/customer/home")} icon={<ChevronLeft className="w-4 h-4" />}>
                Browse Products
              </Button>
            }
          />
        </div>
      ) : (
        <div className="px-4 py-5 space-y-4 pb-36">
          {/* Cart items */}
          <div className="space-y-2">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 p-4 rounded-2xl animate-fade-in"
                style={{ background: "#111113", border: "1px solid #27272A" }}
              >
                {/* Product image */}
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#18181B] flex-shrink-0">
                  <Image
                    src={product.image_url ?? FALLBACK}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#FAFAFA] text-sm truncate">{product.name}</p>
                  <p className="text-[#71717A] text-xs mt-0.5">₹{product.price}/{product.unit}</p>

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(product.id, quantity - 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{ background: "#1F1F23", border: "1px solid #27272A" }}
                      >
                        <Minus className="w-3 h-3 text-[#FAFAFA]" />
                      </button>
                      <span className="text-sm font-bold text-[#FAFAFA] w-5 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQty(product.id, quantity + 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{ background: "#22C55E" }}
                      >
                        <Plus className="w-3 h-3 text-[#052E16]" strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* Subtotal + delete */}
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[#FAFAFA] text-sm">
                        ₹{(product.price * quantity).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(product.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                        style={{ background: "rgba(239,68,68,0.1)" }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div
            className="p-5 rounded-2xl space-y-3"
            style={{ background: "#111113", border: "1px solid #27272A" }}
          >
            <h3 className="font-bold text-[#FAFAFA] mb-1">Order Summary</h3>
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between text-sm">
                <span className="text-[#71717A] truncate max-w-[200px]">
                  {product.name} × {quantity}
                </span>
                <span className="text-[#FAFAFA] font-medium ml-4">
                  ₹{(product.price * quantity).toFixed(2)}
                </span>
              </div>
            ))}
            <div
              className="flex justify-between items-center pt-3"
              style={{ borderTop: "1px solid #27272A" }}
            >
              <span className="font-bold text-[#FAFAFA]">Total</span>
              <span className="font-black text-[#22C55E] text-xl">₹{cartTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Trust signal */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3"
            style={{
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.15)",
            }}
          >
            <Shield className="w-4 h-4 text-[#22C55E] flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#22C55E]">Secured by Razorpay</p>
              <p className="text-xs text-[#71717A] mt-0.5">
                Payment held in escrow until delivery confirmed
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky checkout bar */}
      {items.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 py-4 pb-safe"
          style={{
            background: "rgba(10,10,11,0.95)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid #1A1A1D",
          }}
        >
          <Button
            fullWidth
            size="lg"
            variant="primary"
            loading={isLoading}
            onClick={handleCheckout}
            icon={<CreditCard className="w-5 h-5" />}
            iconRight={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
          >
            {stepLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
