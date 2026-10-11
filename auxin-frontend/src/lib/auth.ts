 /**
 * auxin-frontend/src/lib/auth.ts
 * --------------------------------
 * Supabase Auth wrapper for the Auxin customer/farmer/delivery app.
 *
 * Authentication method: Email OTP (One-Time Password)
 *
 * Demo accounts bypass using OTP 111111, while production accounts
 * receive a secure OTP dispatched via Supabase.
 *
 * After sign-in, the app synchronizes session data with the backend API.
 */

import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// OTP Authentication
// ---------------------------------------------------------------------------

// Demo sign-in is OFF unless the build explicitly enables it.  The shared demo
// password is never written in source: it comes from NEXT_PUBLIC_DEMO_PASSWORD,
// which is only meaningful for a sandbox/demo deployment (these are throw-away
// accounts holding sample data).  Set NEXT_PUBLIC_DEMO_MODE=false for any build
// that serves real users.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "";
const DEMO_CODE = "111111";
const DEMO_EMAILS = [
  "demo.customer@auxin.app",
  "demo.farmer@auxin.app",
  "demo.delivery@auxin.app",
];

// Local-development convenience accounts. Only active under `next dev`.
const DEV_TEST_PASSWORD = process.env.NEXT_PUBLIC_DEV_TEST_PASSWORD ?? "";
const DEV_TEST_USERS = (process.env.NEXT_PUBLIC_DEV_TEST_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isDemoEmail(email: string): boolean {
  return DEMO_MODE && DEMO_PASSWORD !== "" && DEMO_EMAILS.includes(email.trim());
}

function isDevTestEmail(email: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    DEV_TEST_PASSWORD !== "" &&
    DEV_TEST_USERS.includes(email.trim())
  );
}

export async function sendOtp(
  email: string,
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (isDemoEmail(email) || isDevTestEmail(email)) {
    return { success: true };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      shouldCreateUser: true,
      data: role ? { role } : undefined,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function verifyOtp(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  if (isDemoEmail(email)) {
    if (token.trim() !== DEMO_CODE) {
      return { success: false, error: "Invalid OTP code for demo account." };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: DEMO_PASSWORD,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  if (isDevTestEmail(email)) {
    if (token.trim() !== "000000") {
      return { success: false, error: "Token has expired or is invalid" };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: DEV_TEST_PASSWORD,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }

  const { error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export const DEMO_LOGIN_ENABLED = DEMO_MODE && DEMO_PASSWORD !== "";

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Get current session (lightweight)
// ---------------------------------------------------------------------------

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---------------------------------------------------------------------------
// Get authenticated user profile from our backend
// ---------------------------------------------------------------------------

export async function getMe() {
  const session = await getSession();
  if (!session) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) return null;
  return res.json();
}

// ---------------------------------------------------------------------------
// Sync user to our database (called after sign-up)
// ---------------------------------------------------------------------------

export async function syncUser(
  accessToken: string,
  profile: { name: string; phone: string; role: UserRole; email?: string }
) {
  const res = await fetch(`${API_URL}/auth/sync-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.error ?? "sync-user failed");
  }

  return res.json();
}
