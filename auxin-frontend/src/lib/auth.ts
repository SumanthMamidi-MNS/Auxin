/**
 * auxin-frontend/src/lib/auth.ts
 * --------------------------------
 * Supabase Auth wrapper for the Auxin customer/farmer/delivery app.
 *
 * Authentication method: Mobile Number + Password
 *
 * Supabase Auth requires an email address for email+password auth.
 * We convert the phone number to a deterministic synthetic email:
 *   +919876543210  →  +919876543210@auxin.app
 *
 * This keeps the auth experience phone-native while using Supabase's
 * stable email+password backend.  The synthetic email is never shown
 * to the user and is never used for communication.
 *
 * After sign-up, the app calls POST /auth/sync-user with the real phone
 * number to create the application-layer user record.
 */

import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// OTP Authentication
// ---------------------------------------------------------------------------

export async function sendOtp(
  email: string,
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
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
