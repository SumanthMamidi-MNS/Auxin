/**
 * auxin-frontend/src/lib/payments.ts
 * =====================================
 * Frontend payment API - Razorpay integration.
 *
 * Flow:
 *   1. customer calls createPayment()  backend creates Razorpay order
 *   2. frontend opens Razorpay checkout widget
 *   3. on success, frontend calls verifyPayment()  backend validates HMAC signature
 *   4. backend marks payment as "paid" (held in escrow)
 *
 * SECURITY RULE:
 *   The frontend NEVER trusts the Razorpay "payment.success" callback directly.
 *   ALL payment verification is done server-side.
 */

import api from "./api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentCreateOut {
  razorpay_order_id: string;
  razorpay_key_id: string;     // Public key -- safe to expose to frontend
  amount: number;              // Amount in paise
  currency: string;
  order_id: number;
  prefill?: {
    name?: string;
    contact?: string;
    email?: string;
  };
}

export interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface PaymentVerifyOut {
  success: boolean;
  payment_id: number;
  message: string;
}

export interface PaymentOut {
  id: number;
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: "created" | "paid" | "failed" | "refunded";
  transactions: Array<{
    id: number;
    type: "payment" | "release" | "refund";
    amount: number;
    status: "success" | "failed";
    note: string | null;
    created_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// Razorpay script loader
// ---------------------------------------------------------------------------

let _razorpayScriptLoaded = false;

function loadRazorpayScript(): Promise<boolean> {
  if (_razorpayScriptLoaded || typeof (window as { Razorpay?: unknown }).Razorpay !== "undefined") {
    _razorpayScriptLoaded = true;
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { _razorpayScriptLoaded = true; resolve(true); };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ---------------------------------------------------------------------------
// Payment API
// ---------------------------------------------------------------------------

export const paymentsApi = {
  async createPayment(orderId: number): Promise<PaymentCreateOut> {
    const { data } = await api.post<PaymentCreateOut>("/payments/create", { order_id: orderId });
    return data;
  },

  async verifyPayment(payload: PaymentVerifyRequest): Promise<PaymentVerifyOut> {
    const { data } = await api.post<PaymentVerifyOut>("/payments/verify", payload);
    return data;
  },

  async getPayment(orderId: number): Promise<PaymentOut> {
    const { data } = await api.get<PaymentOut>(`/payments/${orderId}`);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Razorpay checkout helper
// ---------------------------------------------------------------------------

export interface CheckoutCallbacks {
  onSuccess: (verifyResult: PaymentVerifyOut) => void;
  onFailure: (error: string) => void;
  onDismiss?: () => void;
}

/**
 * Opens the Razorpay checkout modal and handles the full payment flow.
 * Automatically calls verifyPayment() on success -- the frontend never
 * marks a payment as complete without backend confirmation.
 */
export async function openRazorpayCheckout(
  paymentData: PaymentCreateOut,
  user: { name?: string; phone?: string; email?: string },
  callbacks: CheckoutCallbacks,
): Promise<void> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    callbacks.onFailure("Failed to load payment gateway. Check your internet connection.");
    return;
  }

  const options = {
    key:         paymentData.razorpay_key_id,
    amount:      paymentData.amount,
    currency:    paymentData.currency,
    name:        "Auxin Marketplace",
    description: `Order #${paymentData.order_id}`,
    order_id:    paymentData.razorpay_order_id,
    prefill: {
      name:    user.name    ?? "",
      contact: user.phone   ?? "",
      email:   user.email   ?? "",
    },
    theme: { color: "#1B5E20" },
    modal: {
      ondismiss: () => callbacks.onDismiss?.(),
    },
    handler: async (response: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    }) => {
      // CRITICAL: always verify server-side -- never trust this callback alone
      try {
        const result = await paymentsApi.verifyPayment({
          razorpay_order_id:   response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature:  response.razorpay_signature,
        });
        callbacks.onSuccess(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Payment verification failed";
        callbacks.onFailure(msg);
      }
    },
  };

  const rzp = new ((window as unknown) as { Razorpay: new (opts: unknown) => { on: (e: string, cb: unknown) => void; open: () => void } }).Razorpay(options);
  rzp.on("payment.failed", (response: { error?: { description?: string } }) => {
    callbacks.onFailure(response?.error?.description ?? "Payment failed");
  });
  rzp.open();
}
